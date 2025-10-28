using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.DTOs;
using Subh_sankalp_estate.Models;
using Subh_sankalp_estate.Services;
using System.Security.Claims;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReceiptsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IReceiptService _receiptService;
        private readonly IPlotStatusService _plotStatusService;
        
        public ReceiptsController(ApplicationDbContext context, IReceiptService receiptService, IPlotStatusService plotStatusService)
        {
            _context = context;
            _receiptService = receiptService;
            _plotStatusService = plotStatusService;
        }
        
        [HttpPost]
        [Authorize(Roles = "Associate,Admin")]
        public async Task<ActionResult<ReceiptResponseDto>> CreateReceipt(CreateReceiptDto createReceiptDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Get plot information
            var plot = await _context.Plots
                .FirstOrDefaultAsync(p => p.SiteName == createReceiptDto.SiteName && 
                                        p.PlotNumber == createReceiptDto.PlotVillaNo);
            
            if (plot == null)
            {
                return BadRequest("Plot not found");
            }

            // Determine receipt type - default to token, but allow booking for admin
            var receiptType = createReceiptDto.ReceiptType ?? "token";
            
            // Only admin can create booking receipts
            if (receiptType == "booking" && userRole != "Admin")
            {
                return Forbid("Only admin can create booking receipts");
            }
            
            // Auto-populate customer information from previous receipts if not provided
            if (string.IsNullOrEmpty(createReceiptDto.PanNumber) || string.IsNullOrEmpty(createReceiptDto.AadharNumber))
            {
                var previousReceipt = await _context.Receipts
                    .Where(r => r.SiteName == createReceiptDto.SiteName && r.PlotVillaNo == createReceiptDto.PlotVillaNo)
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefaultAsync();
                
                if (previousReceipt != null)
                {
                    // Use previous receipt's PAN and AADHAR if current ones are empty
                    if (string.IsNullOrEmpty(createReceiptDto.PanNumber) && !string.IsNullOrEmpty(previousReceipt.PanNumber))
                    {
                        createReceiptDto.PanNumber = previousReceipt.PanNumber;
                    }
                    if (string.IsNullOrEmpty(createReceiptDto.AadharNumber) && !string.IsNullOrEmpty(previousReceipt.AadharNumber))
                    {
                        createReceiptDto.AadharNumber = previousReceipt.AadharNumber;
                    }
                }
            }
            
            // Generate receipt number
            var receiptNo = await _receiptService.GenerateReceiptNumberAsync(receiptType);
            
            var receipt = new Receipt
            {
                ReceiptNo = receiptNo,
                ReceiptType = receiptType,
                Date = DateTime.UtcNow,
                FromName = createReceiptDto.FromName,
                RelationType = createReceiptDto.RelationType,
                RelationName = createReceiptDto.RelationName,
                Address = createReceiptDto.Address,
                Mobile = createReceiptDto.Mobile,
                PanNumber = createReceiptDto.PanNumber,
                AadharNumber = createReceiptDto.AadharNumber,
                CompanyName = createReceiptDto.CompanyName,
                TokenExpiryDate = receiptType == "token" ? (createReceiptDto.TokenExpiryDate ?? DateTime.UtcNow.AddDays(30)) : null,
                ReceivedAmount = createReceiptDto.ReceivedAmount,
                ReferenceName = createReceiptDto.ReferenceName,
                SiteName = createReceiptDto.SiteName,
                PlotVillaNo = createReceiptDto.PlotVillaNo,
                PlotSize = plot.PlotSize,
                BasicRate = plot.BasicRate,
                Amount = createReceiptDto.Amount,
                Other = createReceiptDto.Other,
                CashChecked = createReceiptDto.CashChecked,
                ChequeChecked = createReceiptDto.ChequeChecked,
                RtgsChecked = createReceiptDto.RtgsChecked,
                ChequeNo = createReceiptDto.ChequeNo,
                RtgsNeft = createReceiptDto.RtgsNeft,
                AssociateRemarks = createReceiptDto.AssociateRemarks,
                AdminRemarks = createReceiptDto.AdminRemarks,
                CreatedByUserId = userId,
                PlotId = plot.Id,
                Status = userRole == "Admin" ? "Approved" : "Pending"
            };
            
            // Calculate TotalAmount for admin-created receipts (auto-approved)
            if (userRole == "Admin")
            {
                var otherAmount = 0m;
                if (!string.IsNullOrEmpty(receipt.Other))
                {
                    if (!decimal.TryParse(receipt.Other, out otherAmount))
                    {
                        var numbers = System.Text.RegularExpressions.Regex.Match(receipt.Other, @"\d+\.?\d*");
                        if (numbers.Success)
                        {
                            decimal.TryParse(numbers.Value, out otherAmount);
                        }
                    }
                }
                receipt.TotalAmount = receipt.Amount + otherAmount;
                receipt.ApprovedByUserId = userId;
                receipt.ApprovedAt = DateTime.UtcNow;
            }
            
            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();
            
            // Update plot status only if receipt is approved immediately (receipts created by admin)
            if (receipt.Status == "Approved")
            {
                await _plotStatusService.UpdatePlotStatusAsync(plot.Id, receiptType, receipt.TotalAmount);
            }
            
            // Update plot received amount after creating receipt
            await UpdatePlotReceivedAmountByPlotNumberAsync(createReceiptDto.SiteName, createReceiptDto.PlotVillaNo);
            
            return Ok(await GetReceiptResponse(receipt.Id));
        }
        
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<ReceiptResponseDto>>> GetReceipts([FromQuery] ReceiptFilterDto filter)
        {
            try
            {
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
                
                IQueryable<Receipt> query = _context.Receipts
                    .Include(r => r.CreatedBy);
            
            // Role-based filtering
            if (userRole == "Associate")
            {
                query = query.Where(r => r.CreatedByUserId == userId);
            }
            
            // Apply filters
            if (!string.IsNullOrEmpty(filter.CustomerName))
            {
                query = query.Where(r => r.FromName.Contains(filter.CustomerName));
            }
            
            if (!string.IsNullOrEmpty(filter.ReferenceName))
            {
                query = query.Where(r => r.ReferenceName.Contains(filter.ReferenceName));
            }
            
            if (!string.IsNullOrEmpty(filter.SiteName))
            {
                query = query.Where(r => r.SiteName.Contains(filter.SiteName));
            }
            
            if (!string.IsNullOrEmpty(filter.PlotNumber))
            {
                query = query.Where(r => r.PlotVillaNo.Contains(filter.PlotNumber));
            }
            
            if (!string.IsNullOrEmpty(filter.Mobile))
            {
                query = query.Where(r => r.Mobile.Contains(filter.Mobile));
            }
            
            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(r => r.Status == filter.Status);
            }
            
            if (!string.IsNullOrEmpty(filter.ReceiptType))
            {
                query = query.Where(r => r.ReceiptType == filter.ReceiptType);
            }
            
            if (!string.IsNullOrEmpty(filter.CompanyName))
            {
                query = query.Where(r => r.CompanyName == filter.CompanyName);
            }
            
            if (filter.FromDate.HasValue)
            {
                query = query.Where(r => r.Date >= filter.FromDate.Value);
            }
            
            if (filter.ToDate.HasValue)
            {
                query = query.Where(r => r.Date <= filter.ToDate.Value);
            }
            
            if (filter.TokenExpiryFromDate.HasValue)
            {
                query = query.Where(r => r.TokenExpiryDate >= filter.TokenExpiryFromDate.Value);
            }
            
            if (filter.TokenExpiryToDate.HasValue)
            {
                query = query.Where(r => r.TokenExpiryDate <= filter.TokenExpiryToDate.Value);
            }
            
            if (filter.MinAmount.HasValue)
            {
                query = query.Where(r => r.Amount >= filter.MinAmount.Value);
            }
            
            if (filter.MaxAmount.HasValue)
            {
                query = query.Where(r => r.Amount <= filter.MaxAmount.Value);
            }
            
            if (filter.CreatedByUserId.HasValue)
            {
                query = query.Where(r => r.CreatedByUserId == filter.CreatedByUserId.Value);
            }
            
            if (filter.CashPayment.HasValue)
            {
                query = query.Where(r => r.CashChecked == filter.CashPayment.Value);
            }
            
            if (filter.ChequePayment.HasValue)
            {
                query = query.Where(r => r.ChequeChecked == filter.ChequePayment.Value);
            }
            
            if (!string.IsNullOrEmpty(filter.ChequeNo))
            {
                query = query.Where(r => r.ChequeNo.Contains(filter.ChequeNo));
            }
            
            // Get total count before pagination
            var totalRecords = await query.CountAsync();
            
            // Apply sorting
            query = ApplyReceiptSorting(query, filter.SortBy, filter.SortOrder);
            
            // Apply pagination
            var receipts = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                ReceiptType = r.ReceiptType,
                Date = r.Date,
                FromName = r.FromName,
                RelationType = r.RelationType,
                RelationName = r.RelationName,
                Address = r.Address,
                Mobile = r.Mobile,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                TokenExpiryDate = r.TokenExpiryDate,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                PlotSize = r.PlotSize,
                BasicRate = r.BasicRate,
                Amount = r.Amount,
                Other = r.Other,
                TotalAmount = r.TotalAmount,
                CashChecked = r.CashChecked,
                ChequeChecked = r.ChequeChecked,
                RtgsChecked = r.RtgsChecked,
                ChequeNo = r.ChequeNo,
                RtgsNeft = r.RtgsNeft,
                Status = r.Status,
                AdminDiscount = r.AdminDiscount,
                AdminRemarks = r.AdminRemarks,
                AssociateRemarks = r.AssociateRemarks,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            var totalPages = (int)Math.Ceiling((double)totalRecords / filter.PageSize);
            
            return Ok(new PaginatedResult<ReceiptResponseDto>
            {
                Data = result,
                TotalRecords = totalRecords,
                Page = filter.Page,
                PageSize = filter.PageSize,
                TotalPages = totalPages,
                HasNextPage = filter.Page < totalPages,
                HasPreviousPage = filter.Page > 1
            });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetReceipts: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<ReceiptResponseDto>> GetReceipt(long id)
        {
            var receipt = await GetReceiptResponse(id);
            if (receipt == null)
            {
                return NotFound();
            }
            
            return Ok(receipt);
        }
        
        [HttpPost("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ApproveReceipt(long id, ApproveReceiptDto approveDto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Plot)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (receipt == null)
            {
                return NotFound();
            }
            
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            receipt.Status = "Approved";
            receipt.AdminDiscount = approveDto.Discount ?? 0;
            receipt.AdminRemarks = approveDto.Remarks;
            receipt.ApprovedByUserId = userId;
            receipt.ApprovedAt = DateTime.UtcNow;
            
            if (approveDto.ExtendedExpiryDate.HasValue)
            {
                receipt.TokenExpiryDate = approveDto.ExtendedExpiryDate;
            }
            
            // STEP 1: Handle receipt amount (NO DISCOUNT APPLIED HERE)
            // Keep the original receipt amount exactly as entered by the associate
            var originalReceiptAmount = receipt.Amount; // Always use the original Amount field
            
            // Parse Other field for additional charges only
            var otherAmount = 0m;
            if (!string.IsNullOrEmpty(receipt.Other))
            {
                if (!decimal.TryParse(receipt.Other, out otherAmount))
                {
                    var numbers = System.Text.RegularExpressions.Regex.Match(receipt.Other, @"\d+\.?\d*");
                    if (numbers.Success)
                    {
                        decimal.TryParse(numbers.Value, out otherAmount);
                    }
                }
            }
            
            // Set receipt TotalAmount = Original Amount + Other charges (NO DISCOUNT)
            receipt.TotalAmount = originalReceiptAmount + otherAmount;
            
            Console.WriteLine($"=== RECEIPT AMOUNT (NO DISCOUNT) ===");
            Console.WriteLine($"Original Receipt Amount: ₹{originalReceiptAmount}");
            Console.WriteLine($"Other Charges: ₹{otherAmount}");
            Console.WriteLine($"Final Receipt Amount: ₹{receipt.TotalAmount}");
            Console.WriteLine($"IMPORTANT: Receipt amount is NOT affected by discount");
            Console.WriteLine($"=== RECEIPT AMOUNT END ===");
            
            // STEP 2: Apply BASIC RATE DISCOUNT to PLOT ONLY (separate from receipt)
            if (receipt.Plot != null && approveDto.Discount.HasValue && approveDto.Discount.Value > 0)
            {
                Console.WriteLine($"=== PLOT DISCOUNT (SEPARATE FROM RECEIPT) ===");
                
                var plotSize = ParsePlotSize(receipt.Plot.PlotSize);
                var basicRateDiscount = approveDto.Discount.Value;
                
                // Get current plot values
                var currentBasicRate = receipt.Plot.BasicRate;
                var currentTotalPrice = receipt.Plot.TotalPrice > 0 ? receipt.Plot.TotalPrice : (plotSize * currentBasicRate);
                
                Console.WriteLine($"Plot: {receipt.Plot.SiteName} - {receipt.Plot.PlotNumber}");
                Console.WriteLine($"Plot Size: {plotSize} sq ft");
                Console.WriteLine($"Current Basic Rate: ₹{currentBasicRate}/sq ft");
                Console.WriteLine($"Current Total Price: ₹{currentTotalPrice}");
                Console.WriteLine($"Discount to Apply: ₹{basicRateDiscount}/sq ft");
                
                // Calculate new basic rate after discount
                var newBasicRate = Math.Max(0, currentBasicRate - basicRateDiscount);
                var newTotalPrice = plotSize * newBasicRate;
                var totalDiscountAmount = currentTotalPrice - newTotalPrice;
                
                // Update ONLY the plot (not the receipt)
                receipt.Plot.BasicRate = newBasicRate;
                receipt.Plot.TotalPrice = newTotalPrice;
                receipt.Plot.UpdatedAt = DateTime.UtcNow;
                
                Console.WriteLine($"NEW Basic Rate: ₹{newBasicRate}/sq ft");
                Console.WriteLine($"NEW Total Price: ₹{newTotalPrice}");
                Console.WriteLine($"Total Discount Applied: ₹{totalDiscountAmount}");
                Console.WriteLine($"Receipt Amount Unchanged: ₹{receipt.TotalAmount}");
                Console.WriteLine($"=== PLOT DISCOUNT END ===");
            }
            
            // Save changes to the existing receipt (no new receipt created)
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"=== AFTER SAVE - BEFORE UPDATE ===");
            Console.WriteLine($"Receipt TotalAmount after save: ₹{receipt.TotalAmount}");
            Console.WriteLine($"Plot TotalPrice after save: ₹{receipt.Plot?.TotalPrice}");
            Console.WriteLine($"=== CALLING UPDATE METHOD ===");
            
            // Update plot received amount after approval
            await UpdatePlotReceivedAmountByPlotNumberAsync(receipt.SiteName, receipt.PlotVillaNo);
            
            // Update plot status after approval using PlotStatusService
            if (receipt.Plot != null)
            {
                await _plotStatusService.UpdatePlotStatusAsync(receipt.Plot.Id, receipt.ReceiptType, receipt.TotalAmount);
            }
            
            // Check values after update
            var updatedReceipt = await _context.Receipts.FindAsync(receipt.Id);
            var updatedPlot = await _context.Plots.FindAsync(receipt.Plot?.Id);
            
            Console.WriteLine($"=== AFTER UPDATE METHOD ===");
            Console.WriteLine($"Receipt TotalAmount after update: ₹{updatedReceipt?.TotalAmount}");
            Console.WriteLine($"Plot TotalPrice after update: ₹{updatedPlot?.TotalPrice}");
            Console.WriteLine($"Plot ReceivedAmount after update: ₹{updatedPlot?.ReceivedAmount}");
            Console.WriteLine($"=== FINAL VALUES ===");
            
            return Ok();
        }
        
        [HttpPost("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RejectReceipt(long id, ApproveReceiptDto rejectDto)
        {
            var receipt = await _context.Receipts
                .Include(r => r.Plot)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (receipt == null)
            {
                return NotFound();
            }
            
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            receipt.Status = "Rejected";
            receipt.AdminRemarks = rejectDto.Remarks;
            receipt.ApprovedByUserId = userId;
            receipt.ApprovedAt = DateTime.UtcNow;
            

            
            await _context.SaveChangesAsync();
            
            // Update plot received amount after rejection
            await UpdatePlotReceivedAmountByPlotNumberAsync(receipt.SiteName, receipt.PlotVillaNo);
            
            // Recalculate plot status after rejection
            if (receipt.Plot != null)
            {
                var currentStatus = await _plotStatusService.CalculatePlotStatusAsync(receipt.Plot.Id);
                receipt.Plot.Status = currentStatus;
                receipt.Plot.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            
            return Ok();
        }
        
        [HttpGet("customer")]
        [Authorize(Roles = "Customer")]
        public async Task<ActionResult<IEnumerable<ReceiptResponseDto>>> GetCustomerReceipts()
        {
            var siteName = User.FindFirst("SiteName")?.Value;
            var plotNumber = User.FindFirst("PlotNumber")?.Value;
            
            if (string.IsNullOrEmpty(siteName) || string.IsNullOrEmpty(plotNumber))
            {
                return BadRequest("Invalid customer token");
            }
            
            var receipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Include(r => r.Payments)
                .Where(r => r.SiteName == siteName && r.PlotVillaNo == plotNumber)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                ReceiptType = r.ReceiptType,
                Date = r.Date,
                FromName = r.FromName,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                PlotSize = r.PlotSize,
                BasicRate = r.BasicRate,
                Amount = r.Amount,
                Other = r.Other,
                TotalAmount = r.TotalAmount,
                CashChecked = r.CashChecked,
                ChequeChecked = r.ChequeChecked,
                RtgsChecked = r.RtgsChecked,
                ChequeNo = r.ChequeNo,
                RtgsNeft = r.RtgsNeft,
                Status = r.Status,
                AdminDiscount = r.AdminDiscount,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            return Ok(result);
        }
        
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ReceiptResponseDto>>> SearchReceipts([FromQuery] string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
            {
                return BadRequest("Search term is required");
            }
            
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            IQueryable<Receipt> query = _context.Receipts
                .Include(r => r.CreatedBy)
                .Include(r => r.Plot);
            
            // Role-based filtering
            if (userRole == "Associate")
            {
                query = query.Where(r => r.CreatedByUserId == userId);
            }
            
            // Search across multiple fields
            query = query.Where(r => 
                r.ReceiptNo.Contains(searchTerm) ||
                r.FromName.Contains(searchTerm) ||
                r.Mobile.Contains(searchTerm) ||
                r.SiteName.Contains(searchTerm) ||
                r.PlotVillaNo.Contains(searchTerm) ||
                r.ReferenceName.Contains(searchTerm) ||
                r.ChequeNo.Contains(searchTerm) ||
                r.RtgsNeft.Contains(searchTerm)
            );
            
            var receipts = await query
                .OrderByDescending(r => r.CreatedAt)
                .Take(20) // Limit search results
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                ReceiptType = r.ReceiptType,
                Date = r.Date,
                FromName = r.FromName,
                Mobile = r.Mobile,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                Amount = r.Amount,
                Status = r.Status,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            return Ok(result);
        }
        
        [HttpGet("expiring-tokens")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ReceiptResponseDto>>> GetExpiringTokens([FromQuery] int days = 7)
        {
            var expiryDate = DateTime.UtcNow.AddDays(days);
            
            var receipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => r.ReceiptType == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate <= expiryDate)
                .OrderBy(r => r.TokenExpiryDate)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                FromName = r.FromName,
                Mobile = r.Mobile,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                TokenExpiryDate = r.TokenExpiryDate,
                Amount = r.Amount,
                Status = r.Status,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            return Ok(result);
        }

        [HttpGet("expired-tokens")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ReceiptResponseDto>>> GetExpiredTokens()
        {
            var receipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => r.ReceiptType == "token" && r.Status == "Expired")
                .OrderByDescending(r => r.TokenExpiryDate)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                FromName = r.FromName,
                Mobile = r.Mobile,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                TokenExpiryDate = r.TokenExpiryDate,
                Amount = r.Amount,
                Status = r.Status,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            return Ok(result);
        }

        [HttpPost("process-expired-tokens")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ProcessExpiredTokens()
        {
            try
            {
                await _plotStatusService.CheckAndUpdateExpiredTokensAsync();
                return Ok(new { message = "Expired tokens processed successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error processing expired tokens", error = ex.Message });
            }
        }

        [HttpGet("plot/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ReceiptResponseDto>>> GetReceiptsByPlot(int plotId)
        {
            var receipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => r.PlotId == plotId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                ReceiptType = r.ReceiptType,
                Date = r.Date,
                FromName = r.FromName,
                RelationType = r.RelationType,
                RelationName = r.RelationName,
                Address = r.Address,
                Mobile = r.Mobile,
                PanNumber = r.PanNumber,
                AadharNumber = r.AadharNumber,
                CompanyName = r.CompanyName,
                TokenExpiryDate = r.TokenExpiryDate,
                ReferenceName = r.ReferenceName,
                SiteName = r.SiteName,
                PlotVillaNo = r.PlotVillaNo,
                PlotSize = r.PlotSize,
                BasicRate = r.BasicRate,
                Amount = r.Amount,
                Other = r.Other,
                TotalAmount = r.TotalAmount,
                CashChecked = r.CashChecked,
                ChequeChecked = r.ChequeChecked,
                RtgsChecked = r.RtgsChecked,
                ChequeNo = r.ChequeNo,
                RtgsNeft = r.RtgsNeft,
                Status = r.Status,
                AdminDiscount = r.AdminDiscount,
                AdminRemarks = r.AdminRemarks,
                AssociateRemarks = r.AssociateRemarks,
                CreatedByName = r.CreatedBy.FullName,
                CreatedAt = r.CreatedAt
            });
            
            return Ok(result);
        }
        
        private async Task<ReceiptResponseDto?> GetReceiptResponse(long id)
        {
            var receipt = await _context.Receipts
                .Include(r => r.CreatedBy)
                .FirstOrDefaultAsync(r => r.Id == id);
                
            if (receipt == null) return null;
            
            return MapToReceiptResponseDto(receipt);
        }

        private static ReceiptResponseDto MapToReceiptResponseDto(Receipt receipt)
        {
            return new ReceiptResponseDto
            {
                Id = receipt.Id,
                ReceiptNo = receipt.ReceiptNo,
                ReceiptType = receipt.ReceiptType,
                Date = receipt.Date,
                FromName = receipt.FromName,
                RelationType = receipt.RelationType,
                RelationName = receipt.RelationName,
                Address = receipt.Address,
                Mobile = receipt.Mobile,
                PanNumber = receipt.PanNumber,
                AadharNumber = receipt.AadharNumber,
                CompanyName = receipt.CompanyName,
                TokenExpiryDate = receipt.TokenExpiryDate,
                ReferenceName = receipt.ReferenceName,
                SiteName = receipt.SiteName,
                PlotVillaNo = receipt.PlotVillaNo,
                PlotSize = receipt.PlotSize,
                BasicRate = receipt.BasicRate,
                Amount = receipt.Amount,
                Other = receipt.Other,
                TotalAmount = receipt.TotalAmount,
                CashChecked = receipt.CashChecked,
                ChequeChecked = receipt.ChequeChecked,
                RtgsChecked = receipt.RtgsChecked,
                ChequeNo = receipt.ChequeNo,
                RtgsNeft = receipt.RtgsNeft,
                Status = receipt.Status,
                AdminDiscount = receipt.AdminDiscount,
                AdminRemarks = receipt.AdminRemarks,
                AssociateRemarks = receipt.AssociateRemarks,
                CreatedByName = receipt.CreatedBy?.FullName ?? "",
                CreatedAt = receipt.CreatedAt
            };
        }
        
        /// <summary>
        /// Helper method to safely parse plot size from string
        /// </summary>
        private static decimal ParsePlotSize(string? plotSize)
        {
            if (string.IsNullOrEmpty(plotSize))
                return 0m;
                
            try
            {
                var parts = plotSize.Split(' ');
                if (parts.Length > 0 && decimal.TryParse(parts[0], out var size))
                {
                    return size;
                }
            }
            catch
            {
                // Ignore parsing errors and return 0
            }
            
            return 0m;
        }

        /// <summary>
        /// Helper method to update plot's received amount and status based on all approved receipts
        /// Uses plot number (SiteName + PlotNumber) for mapping instead of PlotId
        /// </summary>
        private async Task UpdatePlotReceivedAmountByPlotNumberAsync(string siteName, string plotNumber)
        {
            Console.WriteLine($"=== UPDATE PLOT RECEIVED AMOUNT START ===");
            Console.WriteLine($"Plot: {siteName} - {plotNumber}");
            
            var plot = await _context.Plots
                .FirstOrDefaultAsync(p => p.SiteName == siteName && p.PlotNumber == plotNumber);
            
            if (plot == null) 
            {
                Console.WriteLine($"Plot not found!");
                return;
            }

            Console.WriteLine($"Plot found - Current ReceivedAmount: ₹{plot.ReceivedAmount}");
            Console.WriteLine($"Plot found - Current TotalPrice: ₹{plot.TotalPrice}");

            // Get all receipts for debugging
            var allReceipts = await _context.Receipts
                .Where(r => r.SiteName == siteName && r.PlotVillaNo == plotNumber)
                .ToListAsync();

            Console.WriteLine($"Found {allReceipts.Count} receipts for this plot:");
            foreach (var r in allReceipts)
            {
                Console.WriteLine($"  Receipt {r.ReceiptNo}: Status={r.Status}, Amount=₹{r.Amount}, TotalAmount=₹{r.TotalAmount}");
            }

            // Calculate total received amount from APPROVED RECEIPTS ONLY
            // Only count approved receipts - pending receipts don't count as received money
            var totalReceivedAmount = await _context.Receipts
                .Where(r => r.SiteName == siteName && r.PlotVillaNo == plotNumber &&
                           r.Status == "Approved")
                .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

            Console.WriteLine($"Calculated total received amount: ₹{totalReceivedAmount}");

            // Update plot's received amount
            plot.ReceivedAmount = totalReceivedAmount;
            Console.WriteLine($"Updated plot ReceivedAmount to: ₹{plot.ReceivedAmount}");

            // Calculate total plot price ONLY if not set (don't override discounted prices)
            if (plot.TotalPrice <= 0)
            {
                var plotSize = ParsePlotSize(plot.PlotSize);
                plot.TotalPrice = plotSize * plot.BasicRate;
            }
            // Note: If TotalPrice is already set (e.g., after discount), we keep it as-is

            // Note: Plot status is now managed by PlotStatusService, not here
            // This method only updates the received amount

            plot.UpdatedAt = DateTime.UtcNow;
            
            Console.WriteLine($"Final plot state before save:");
            Console.WriteLine($"  ReceivedAmount: ₹{plot.ReceivedAmount}");
            Console.WriteLine($"  TotalPrice: ₹{plot.TotalPrice}");
            Console.WriteLine($"  BasicRate: ₹{plot.BasicRate}");
            Console.WriteLine($"=== UPDATE PLOT RECEIVED AMOUNT END ===");
            
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Legacy method for backward compatibility - converts PlotId to PlotNumber and calls the new method
        /// </summary>
        private async Task UpdatePlotReceivedAmountAsync(int plotId)
        {
            var plot = await _context.Plots.FindAsync(plotId);
            if (plot == null) return;
            
            await UpdatePlotReceivedAmountByPlotNumberAsync(plot.SiteName, plot.PlotNumber);
        }

        private static IQueryable<Receipt> ApplyReceiptSorting(IQueryable<Receipt> query, string? sortBy, string? sortOrder)
        {
            var isDescending = sortOrder?.ToLower() == "desc";
            
            return sortBy?.ToLower() switch
            {
                "receiptno" => isDescending ? query.OrderByDescending(r => r.ReceiptNo) : query.OrderBy(r => r.ReceiptNo),
                "customername" or "fromname" => isDescending ? query.OrderByDescending(r => r.FromName) : query.OrderBy(r => r.FromName),
                "sitename" => isDescending ? query.OrderByDescending(r => r.SiteName) : query.OrderBy(r => r.SiteName),
                "plotnumber" => isDescending ? query.OrderByDescending(r => r.PlotVillaNo) : query.OrderBy(r => r.PlotVillaNo),
                "amount" => isDescending ? query.OrderByDescending(r => r.Amount) : query.OrderBy(r => r.Amount),
                "totalamount" => isDescending ? query.OrderByDescending(r => r.TotalAmount) : query.OrderBy(r => r.TotalAmount),
                "status" => isDescending ? query.OrderByDescending(r => r.Status) : query.OrderBy(r => r.Status),
                "date" => isDescending ? query.OrderByDescending(r => r.Date) : query.OrderBy(r => r.Date),
                "tokenexpirydate" => isDescending ? query.OrderByDescending(r => r.TokenExpiryDate) : query.OrderBy(r => r.TokenExpiryDate),
                "referencename" => isDescending ? query.OrderByDescending(r => r.ReferenceName) : query.OrderBy(r => r.ReferenceName),
                _ => isDescending ? query.OrderByDescending(r => r.CreatedAt) : query.OrderBy(r => r.CreatedAt)
            };
        }
    }
}