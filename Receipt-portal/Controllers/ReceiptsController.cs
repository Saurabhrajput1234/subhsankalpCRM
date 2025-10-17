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
        
        public ReceiptsController(ApplicationDbContext context, IReceiptService receiptService)
        {
            _context = context;
            _receiptService = receiptService;
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
                Status = receiptType == "booking" && userRole == "Admin" ? "Approved" : "Pending"
            };
            
            _context.Receipts.Add(receipt);
            await _context.SaveChangesAsync();
            
            // Update plot received amount and status after creating receipt
            await UpdatePlotReceivedAmountByPlotNumberAsync(createReceiptDto.SiteName, createReceiptDto.PlotVillaNo);
            
            // Update plot status based on receipt type
            if (receiptType == "token")
            {
                plot.Status = "Booked";
            }
            // For booking receipts, check if total received amount reaches 60% of total price
            else if (receiptType == "booking")
            {
                // Calculate total received amount including this payment
                // Include ALL approved receipts + pending token receipts
                var approvedReceiptsTotal = await _context.Receipts
                    .Where(r => r.PlotId == plot.Id && r.Status == "Approved")
                    .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                
                var pendingTokenReceiptsTotal = await _context.Receipts
                    .Where(r => r.PlotId == plot.Id && r.Status == "Pending" && r.ReceiptType == "token")
                    .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                
                var totalReceived = approvedReceiptsTotal + pendingTokenReceiptsTotal;
                
                var percentage = plot.TotalPrice > 0 ? (totalReceived / plot.TotalPrice) * 100 : 0;
                
                // Only mark as "Sold" when 100% payment is reached
                if (percentage >= 100)
                {
                    plot.Status = "Sold";
                }
                else if (percentage > 0)
                {
                    plot.Status = "Booked"; // Keep as "Booked" until fully paid
                }
            }
            
            plot.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            
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
            
            // FIXED LOGIC: Keep the original receipt amount and apply discount if provided
            var originalAmount = receipt.TotalAmount > 0 ? receipt.TotalAmount : receipt.Amount;
            var discountAmount = approveDto.Discount ?? 0;
            
            // Apply discount to the receipt amount (not to calculate full plot price)
            var finalAmount = Math.Max(0, originalAmount - discountAmount);
            
            // Parse Other field - try to extract numeric value, default to 0 if not numeric
            var otherAmount = 0m;
            if (!string.IsNullOrEmpty(receipt.Other))
            {
                // Try to parse as decimal, if fails, try to extract numbers from string
                if (!decimal.TryParse(receipt.Other, out otherAmount))
                {
                    // Extract numbers from string (e.g., "Registration Fee 5000" -> 5000)
                    var numbers = System.Text.RegularExpressions.Regex.Match(receipt.Other, @"\d+\.?\d*");
                    if (numbers.Success)
                    {
                        decimal.TryParse(numbers.Value, out otherAmount);
                    }
                }
            }
            
            // Set the final receipt amount (original amount - discount + other charges)
            receipt.TotalAmount = finalAmount + otherAmount;
            
            // Note: We don't change the plot's basic rate - discount is applied only to this receipt
            
            // Save changes to the existing receipt (no new receipt created)
            await _context.SaveChangesAsync();
            
            // Update plot received amount after approval
            await UpdatePlotReceivedAmountByPlotNumberAsync(receipt.SiteName, receipt.PlotVillaNo);
            
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
                           r.Status == "Pending" &&
                           r.TokenExpiryDate <= expiryDate)
                .OrderBy(r => r.TokenExpiryDate)
                .ToListAsync();
            
            var result = receipts.Select(r => new ReceiptResponseDto
            {
                Id = r.Id,
                ReceiptNo = r.ReceiptNo,
                FromName = r.FromName,
                Mobile = r.Mobile,
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
                CreatedByName = receipt.CreatedBy.FullName,
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
            var plot = await _context.Plots
                .FirstOrDefaultAsync(p => p.SiteName == siteName && p.PlotNumber == plotNumber);
            
            if (plot == null) return;

            // Calculate total received amount from RECEIPT AMOUNTS (not plot price)
            // Include: Approved receipts (all types) + Pending token receipts (actual money received)
            var totalReceivedAmount = await _context.Receipts
                .Where(r => r.SiteName == siteName && r.PlotVillaNo == plotNumber &&
                           (r.Status == "Approved" || 
                            (r.Status == "Pending" && r.ReceiptType == "token")))
                .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount); // Use receipt amounts only

            // Update plot's received amount
            plot.ReceivedAmount = totalReceivedAmount;

            // Calculate total plot price if not set
            if (plot.TotalPrice <= 0)
            {
                var plotSize = ParsePlotSize(plot.PlotSize);
                plot.TotalPrice = plotSize * plot.BasicRate;
            }

            // Update status based on received amount vs total price
            if (plot.TotalPrice > 0)
            {
                if (totalReceivedAmount >= plot.TotalPrice)
                {
                    plot.Status = "Sold";
                }
                else if (totalReceivedAmount > 0)
                {
                    plot.Status = "Booked";
                }
                else
                {
                    plot.Status = "Available";
                }
            }
            else
            {
                // If total price is not set, use simple logic
                plot.Status = totalReceivedAmount > 0 ? "Booked" : "Available";
            }

            plot.UpdatedAt = DateTime.UtcNow;
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