using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.DTOs;
using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlotsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public PlotsController(ApplicationDbContext context)
        {
            _context = context;
        }
        

        [HttpGet("test")]
        public async Task<ActionResult> TestPlots()
        {
            try
            {
                var count = await _context.Plots.CountAsync();
                return Ok(new { message = "Plots API is working", plotCount = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResult<PlotResponseDto>>> GetPlots([FromQuery] PlotFilterDto filter)
        {
            try
            {
                // Add logging to debug the issue
                Console.WriteLine($"GetPlots called with PageSize: {filter.PageSize}, Page: {filter.Page}");
                
                IQueryable<Plot> query = _context.Plots;
            
            // Apply filters
            if (!string.IsNullOrEmpty(filter.SiteName))
            {
                query = query.Where(p => p.SiteName.Contains(filter.SiteName));
            }
            
            if (!string.IsNullOrEmpty(filter.PlotNumber))
            {
                query = query.Where(p => p.PlotNumber.Contains(filter.PlotNumber));
            }
            
            if (!string.IsNullOrEmpty(filter.Status))
            {
                query = query.Where(p => p.Status == filter.Status);
            }
            
            if (!string.IsNullOrEmpty(filter.PlotSize))
            {
                query = query.Where(p => p.PlotSize.Contains(filter.PlotSize));
            }
            
            if (filter.MinBasicRate.HasValue)
            {
                query = query.Where(p => p.BasicRate >= filter.MinBasicRate.Value);
            }
            
            if (filter.MaxBasicRate.HasValue)
            {
                query = query.Where(p => p.BasicRate <= filter.MaxBasicRate.Value);
            }
            
            if (filter.MinTotalPrice.HasValue)
            {
                query = query.Where(p => p.TotalPrice >= filter.MinTotalPrice.Value);
            }
            
            if (filter.MaxTotalPrice.HasValue)
            {
                query = query.Where(p => p.TotalPrice <= filter.MaxTotalPrice.Value);
            }
            
            if (!string.IsNullOrEmpty(filter.CustomerName))
            {
                query = query.Where(p => p.Receipts.Any(r => r.Status == "Approved" && r.FromName.Contains(filter.CustomerName)));
            }
            
            if (!string.IsNullOrEmpty(filter.AssociateName))
            {
                query = query.Where(p => p.Receipts.Any(r => r.CreatedBy.FullName.Contains(filter.AssociateName)));
            }
            
            if (filter.FromDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt >= filter.FromDate.Value);
            }
            
            if (filter.ToDate.HasValue)
            {
                query = query.Where(p => p.CreatedAt <= filter.ToDate.Value);
            }
            
            // Get total count before pagination
            var totalRecords = await query.CountAsync();
            Console.WriteLine($"Total records found: {totalRecords}");
            
            // Apply sorting
            query = ApplyPlotSorting(query, filter.SortBy, filter.SortOrder);
            
            // Apply pagination
            var plots = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();
            
            Console.WriteLine($"Plots retrieved: {plots.Count}");
            
            // Load receipts using plot numbers (SiteName + PlotNumber) instead of PlotIds
            var plotNumbers = plots.Select(p => new { p.SiteName, p.PlotNumber }).ToList();
            Console.WriteLine($"Loading receipts for {plotNumbers.Count} plot combinations");
            
            List<Receipt> allReceipts = new List<Receipt>();
            try 
            {
                // Get all receipts that match any of the plot combinations
                var siteNames = plotNumbers.Select(p => p.SiteName).Distinct().ToList();
                var plotNums = plotNumbers.Select(p => p.PlotNumber).Distinct().ToList();
                
                allReceipts = await _context.Receipts
                    .Include(r => r.CreatedBy)
                    .Where(r => siteNames.Contains(r.SiteName) && plotNums.Contains(r.PlotVillaNo))
                    .ToListAsync();
                    
                // Filter to exact matches
                allReceipts = allReceipts
                    .Where(r => plotNumbers.Any(p => p.SiteName == r.SiteName && p.PlotNumber == r.PlotVillaNo))
                    .ToList();
                    
                Console.WriteLine($"Receipts loaded: {allReceipts.Count}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading receipts: {ex.Message}");
                // Continue without receipts for now
            }
            
            var result = plots.Select(p => {
                // Find matching receipts for this plot using ONLY SiteName+PlotNumber
                var matchingReceipts = allReceipts
                    .Where(r => r.SiteName == p.SiteName && r.PlotVillaNo == p.PlotNumber)
                    .ToList();
                
                // Get the best receipt for customer info based on plot status
                Receipt receipt = null;
                if (p.Status == "Tokened")
                {
                    // For tokened plots, get the approved token receipt
                    receipt = matchingReceipts
                        .Where(r => r.ReceiptType.ToLower() == "token" && r.Status == "Approved")
                        .OrderByDescending(r => r.CreatedAt)
                        .FirstOrDefault();
                }
                else
                {
                    // For other plots, get the best receipt (approved first, then most recent)
                    receipt = matchingReceipts
                        .OrderByDescending(r => r.Status == "Approved" ? 1 : 0)
                        .ThenByDescending(r => r.CreatedAt)
                        .FirstOrDefault();
                }
                
                // Calculate total price
                var plotSize = ParsePlotSize(p.PlotSize);
                var calculatedTotalPrice = p.TotalPrice > 0 ? p.TotalPrice : (plotSize * p.BasicRate);
                
                // Calculate received amount based on plot status
                decimal calculatedReceivedAmount = 0;
                if (p.Status == "Tokened")
                {
                    // For tokened plots, only count approved receipts
                    calculatedReceivedAmount = matchingReceipts
                        .Where(r => r.Status == "Approved")
                        .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                }
                else
                {
                    // For other plots, use the original logic
                    calculatedReceivedAmount = matchingReceipts
                        .Where(r => r.Status == "Approved" || 
                                   (r.Status == "Pending" && r.ReceiptType == "token"))
                        .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                }
                
                var storedReceivedAmount = calculatedReceivedAmount;
                
                var remainingBalance = calculatedTotalPrice - storedReceivedAmount;
                
                // Get token expiry information if plot is tokened
                DateTime? tokenExpiryDate = null;
                if (p.Status == "Tokened")
                {
                    var latestTokenReceipt = matchingReceipts
                        .Where(r => r.ReceiptType.ToLower() == "token" && r.Status == "Approved")
                        .OrderByDescending(r => r.CreatedAt)
                        .FirstOrDefault();
                    tokenExpiryDate = latestTokenReceipt?.TokenExpiryDate;
                }
                
                return new PlotResponseDto
                {
                    Id = p.Id,
                    SiteName = p.SiteName,
                    PlotNumber = p.PlotNumber,
                    PlotSize = p.PlotSize,
                    BasicRate = p.BasicRate,
                    TotalPrice = calculatedTotalPrice,
                    Status = p.Status ?? "Available", // Use stored status (updated when receipts approved)
                    Description = p.Description ?? string.Empty,
                    TotalPaid = storedReceivedAmount, // Use stored received amount
                    RemainingBalance = remainingBalance,
                    CustomerName = receipt?.FromName ?? string.Empty,
                    AssociateName = receipt?.CreatedBy?.FullName ?? string.Empty,
                    ReferenceName = receipt?.ReferenceName ?? string.Empty,
                    ReceivedAmount = storedReceivedAmount, // Use stored received amount
                    CreatedAt = p.CreatedAt,
                    TokenExpiryDate = tokenExpiryDate
                };
            }).ToList();
            
            var totalPages = (int)Math.Ceiling((double)totalRecords / filter.PageSize);
            
            return Ok(new PaginatedResult<PlotResponseDto>
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
                Console.WriteLine($"Error in GetPlots: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { 
                    message = "An error occurred while retrieving plots",
                    error = ex.Message,
                    details = ex.InnerException?.Message
                });
            }
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<PlotResponseDto>> GetPlot(int id)
        {
            var plot = await _context.Plots
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (plot == null)
            {
                return NotFound();
            }
            
            // Find receipts for this plot using ONLY SiteName+PlotNumber
            var receipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                .ToListAsync();
            
            var receipt = receipts
                .OrderByDescending(r => r.Status == "Approved" ? 1 : 0)
                .ThenByDescending(r => r.CreatedAt)
                .FirstOrDefault();
            
            // Calculate total received amount from receipts
            // Include: Approved receipts (all types) + Pending token receipts (actual money received)
            var totalReceived = receipts
                .Where(r => r.Status == "Approved" || 
                           (r.Status == "Pending" && r.ReceiptType == "token"))
                .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
            
            // Calculate total plot price (PlotSize × BasicRate if TotalPrice not set)
            var plotSize = ParsePlotSize(plot.PlotSize);
            var calculatedTotalPrice = plot.TotalPrice > 0 ? plot.TotalPrice : (plotSize * plot.BasicRate);
            
            // Get token expiry information if plot is tokened
            DateTime? tokenExpiryDate = null;
            if (plot.Status == "Tokened")
            {
                var latestTokenReceipt = receipts
                    .Where(r => r.ReceiptType.ToLower() == "token" && r.Status == "Approved")
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefault();
                tokenExpiryDate = latestTokenReceipt?.TokenExpiryDate;
            }
            
            var result = new PlotResponseDto
            {
                Id = plot.Id,
                SiteName = plot.SiteName,
                PlotNumber = plot.PlotNumber,
                PlotSize = plot.PlotSize,
                BasicRate = plot.BasicRate,
                TotalPrice = calculatedTotalPrice,
                Status = plot.Status,
                Description = plot.Description,
                TotalPaid = totalReceived,
                RemainingBalance = calculatedTotalPrice - totalReceived,
                CustomerName = receipt?.FromName ?? string.Empty,
                AssociateName = receipt?.CreatedBy?.FullName ?? string.Empty,
                ReferenceName = receipt?.ReferenceName ?? string.Empty,
                ReceivedAmount = totalReceived,
                CreatedAt = plot.CreatedAt,
                TokenExpiryDate = tokenExpiryDate
            };
            
            return Ok(result);
        }
        
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PlotResponseDto>> CreatePlot(CreatePlotDto createPlotDto)
        {
            // Check if plot already exists
            var existingPlot = await _context.Plots
                .FirstOrDefaultAsync(p => p.SiteName == createPlotDto.SiteName && 
                                        p.PlotNumber == createPlotDto.PlotNumber);
                                        
            if (existingPlot != null)
            {
                return BadRequest("Plot already exists");
            }
            
            var plot = new Plot
            {
                SiteName = createPlotDto.SiteName,
                PlotNumber = createPlotDto.PlotNumber,
                PlotSize = createPlotDto.PlotSize,
                BasicRate = createPlotDto.BasicRate,
                Description = createPlotDto.Description,
                Status = "Available"
            };
            
            _context.Plots.Add(plot);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetPlot), new { id = plot.Id }, new PlotResponseDto
            {
                Id = plot.Id,
                SiteName = plot.SiteName,
                PlotNumber = plot.PlotNumber,
                PlotSize = plot.PlotSize,
                BasicRate = plot.BasicRate,
                TotalPrice = plot.TotalPrice,
                Status = plot.Status,
                Description = plot.Description,
                CreatedAt = plot.CreatedAt
            });
        }
        
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdatePlot(int id, UpdatePlotDto updatePlotDto)
        {
            var plot = await _context.Plots.FindAsync(id);
            if (plot == null)
            {
                return NotFound();
            }
            
            if (!string.IsNullOrEmpty(updatePlotDto.PlotSize))
                plot.PlotSize = updatePlotDto.PlotSize;
                
            if (updatePlotDto.BasicRate.HasValue)
                plot.BasicRate = updatePlotDto.BasicRate.Value;
                
            if (!string.IsNullOrEmpty(updatePlotDto.Description))
                plot.Description = updatePlotDto.Description;
                
            if (!string.IsNullOrEmpty(updatePlotDto.Status))
                plot.Status = updatePlotDto.Status;
                
            plot.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
        
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DeletePlot(int id)
        {
            var plot = await _context.Plots
                .Include(p => p.Receipts)
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (plot == null)
            {
                return NotFound();
            }
            
            if (plot.Receipts.Any())
            {
                return BadRequest("Cannot delete plot with existing receipts");
            }
            
            _context.Plots.Remove(plot);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
        
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<PlotResponseDto>>> GetAvailablePlots([FromQuery] string? siteName, [FromQuery] string? plotSize)
        {
            IQueryable<Plot> query = _context.Plots
                .Where(p => p.Status == "Available");
            
            if (!string.IsNullOrEmpty(siteName))
            {
                query = query.Where(p => p.SiteName.Contains(siteName));
            }
            
            if (!string.IsNullOrEmpty(plotSize))
            {
                query = query.Where(p => p.PlotSize.Contains(plotSize));
            }
            
            var plots = await query
                .OrderBy(p => p.SiteName)
                .ThenBy(p => p.PlotNumber)
                .ToListAsync();
            
            var result = plots.Select(p => new PlotResponseDto
            {
                Id = p.Id,
                SiteName = p.SiteName,
                PlotNumber = p.PlotNumber,
                PlotSize = p.PlotSize,
                BasicRate = p.BasicRate,
                Status = p.Status,
                Description = p.Description,
                CreatedAt = p.CreatedAt
            });
            
            return Ok(result);
        }

        [HttpGet("tokened")]
        public async Task<ActionResult<IEnumerable<PlotResponseDto>>> GetTokenedPlots([FromQuery] string? siteName, [FromQuery] string? plotSize)
        {
            IQueryable<Plot> query = _context.Plots
                .Where(p => p.Status == "Tokened");
            
            if (!string.IsNullOrEmpty(siteName))
            {
                query = query.Where(p => p.SiteName.Contains(siteName));
            }
            
            if (!string.IsNullOrEmpty(plotSize))
            {
                query = query.Where(p => p.PlotSize.Contains(plotSize));
            }
            
            var plots = await query
                .OrderBy(p => p.SiteName)
                .ThenBy(p => p.PlotNumber)
                .ToListAsync();
            
            // Get token information and customer details for each plot
            var plotNumbers = plots.Select(p => new { p.SiteName, p.PlotNumber }).ToList();
            
            // Get all receipts for these plots using SiteName+PlotNumber matching
            var allReceipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => plotNumbers.Any(p => p.SiteName == r.SiteName && p.PlotNumber == r.PlotVillaNo))
                .ToListAsync();
            
            var result = plots.Select(p => {
                // Find receipts for this specific plot
                var plotReceipts = allReceipts
                    .Where(r => r.SiteName == p.SiteName && r.PlotVillaNo == p.PlotNumber)
                    .ToList();
                
                // Get the latest approved token receipt
                var latestTokenReceipt = plotReceipts
                    .Where(r => r.ReceiptType.ToLower() == "token" && r.Status == "Approved")
                    .OrderByDescending(r => r.CreatedAt)
                    .FirstOrDefault();
                
                // Calculate total price
                var plotSize = ParsePlotSize(p.PlotSize);
                var calculatedTotalPrice = p.TotalPrice > 0 ? p.TotalPrice : (plotSize * p.BasicRate);
                
                // Get received amount from approved receipts
                var receivedAmount = plotReceipts
                    .Where(r => r.Status == "Approved")
                    .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                
                return new PlotResponseDto
                {
                    Id = p.Id,
                    SiteName = p.SiteName,
                    PlotNumber = p.PlotNumber,
                    PlotSize = p.PlotSize,
                    BasicRate = p.BasicRate,
                    TotalPrice = calculatedTotalPrice,
                    Status = p.Status,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    TokenExpiryDate = latestTokenReceipt?.TokenExpiryDate,
                    CustomerName = latestTokenReceipt?.FromName ?? string.Empty,
                    AssociateName = latestTokenReceipt?.CreatedBy?.FullName ?? string.Empty,
                    ReferenceName = latestTokenReceipt?.ReferenceName ?? string.Empty,
                    ReceivedAmount = receivedAmount,
                    TotalPaid = receivedAmount,
                    RemainingBalance = calculatedTotalPrice - receivedAmount
                };
            });
            
            return Ok(result);
        }

        [HttpGet("expired-tokens")]
        public async Task<ActionResult<IEnumerable<PlotResponseDto>>> GetExpiredTokenPlots([FromQuery] string? siteName, [FromQuery] string? plotSize)
        {
            var currentDate = DateTime.UtcNow;
            
            // Find plots that have expired tokens
            var expiredTokenPlots = await _context.Plots
                .Where(p => p.Receipts.Any(r => 
                    r.ReceiptType.ToLower() == "token" && 
                    r.Status == "Approved" &&
                    r.TokenExpiryDate.HasValue && 
                    r.TokenExpiryDate.Value < currentDate))
                .ToListAsync();

            if (!string.IsNullOrEmpty(siteName))
            {
                expiredTokenPlots = expiredTokenPlots.Where(p => p.SiteName.Contains(siteName)).ToList();
            }
            
            if (!string.IsNullOrEmpty(plotSize))
            {
                expiredTokenPlots = expiredTokenPlots.Where(p => p.PlotSize.Contains(plotSize)).ToList();
            }
            
            // Get token expiry information for each plot
            var plotIds = expiredTokenPlots.Select(p => p.Id).ToList();
            var expiredTokenReceipts = await _context.Receipts
                .Where(r => r.ReceiptType.ToLower() == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate.HasValue && 
                           r.TokenExpiryDate.Value < currentDate &&
                           plotIds.Contains(r.PlotId ?? 0))
                .GroupBy(r => r.PlotId)
                .Select(g => new {
                    PlotId = g.Key,
                    LatestTokenExpiry = g.OrderByDescending(r => r.CreatedAt).First().TokenExpiryDate,
                    CustomerName = g.OrderByDescending(r => r.CreatedAt).First().FromName,
                    TokenAmount = g.OrderByDescending(r => r.CreatedAt).First().TotalAmount > 0 
                        ? g.OrderByDescending(r => r.CreatedAt).First().TotalAmount 
                        : g.OrderByDescending(r => r.CreatedAt).First().Amount
                })
                .ToListAsync();
            
            var result = expiredTokenPlots.Select(p => {
                var tokenInfo = expiredTokenReceipts.FirstOrDefault(t => t.PlotId == p.Id);
                return new PlotResponseDto
                {
                    Id = p.Id,
                    SiteName = p.SiteName,
                    PlotNumber = p.PlotNumber,
                    PlotSize = p.PlotSize,
                    BasicRate = p.BasicRate,
                    TotalPrice = p.TotalPrice > 0 ? p.TotalPrice : (ParsePlotSize(p.PlotSize) * p.BasicRate),
                    Status = p.Status,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    TokenExpiryDate = tokenInfo?.LatestTokenExpiry,
                    CustomerName = tokenInfo?.CustomerName ?? string.Empty,
                    ReceivedAmount = tokenInfo?.TokenAmount ?? 0
                };
            }).OrderBy(p => p.TokenExpiryDate);
            
            return Ok(result);
        }

        [HttpGet("dashboard/expired-tokens")]
        public async Task<ActionResult> GetExpiredTokensDashboard()
        {
            var currentDate = DateTime.UtcNow;
            
            // Get expired tokens count
            var expiredTokensCount = await _context.Receipts
                .Where(r => r.ReceiptType.ToLower() == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate.HasValue && 
                           r.TokenExpiryDate.Value < currentDate)
                .CountAsync();
            
            // Get tokens expiring in next 7 days
            var expiringIn7Days = await _context.Receipts
                .Where(r => r.ReceiptType.ToLower() == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate.HasValue && 
                           r.TokenExpiryDate.Value >= currentDate &&
                           r.TokenExpiryDate.Value <= currentDate.AddDays(7))
                .CountAsync();
            
            // Get total expired token amount
            var expiredTokenAmount = await _context.Receipts
                .Where(r => r.ReceiptType.ToLower() == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate.HasValue && 
                           r.TokenExpiryDate.Value < currentDate)
                .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
            
            return Ok(new {
                ExpiredTokensCount = expiredTokensCount,
                ExpiringIn7Days = expiringIn7Days,
                ExpiredTokenAmount = expiredTokenAmount,
                Message = expiredTokensCount > 0 ? $"{expiredTokensCount} tokens have expired" : "No expired tokens"
            });
        }
        
        [HttpPost("bulk")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> BulkCreatePlots(BulkCreatePlotsDto bulkCreateDto)
        {
            var createdPlots = new List<Plot>();
            var errors = new List<string>();
            
            foreach (var plotData in bulkCreateDto.Plots)
            {
                try
                {
                    // Check if plot already exists
                    var existingPlot = await _context.Plots
                        .FirstOrDefaultAsync(p => p.SiteName == bulkCreateDto.SiteName && 
                                                p.PlotNumber == plotData.PlotNumber);
                                                
                    if (existingPlot != null)
                    {
                        errors.Add($"Plot {plotData.PlotNumber} already exists");
                        continue;
                    }
                    
                    var plot = new Plot
                    {
                        SiteName = bulkCreateDto.SiteName,
                        PlotNumber = plotData.PlotNumber,
                        PlotSize = plotData.PlotSize,
                        BasicRate = plotData.BasicRate,
                        Description = bulkCreateDto.Description ?? $"Plot in {bulkCreateDto.SiteName}",
                        Status = "Available"
                    };
                    
                    _context.Plots.Add(plot);
                    createdPlots.Add(plot);
                }
                catch (Exception ex)
                {
                    errors.Add($"Error creating plot {plotData.PlotNumber}: {ex.Message}");
                }
            }
            
            try
            {
                await _context.SaveChangesAsync();
                
                var response = new
                {
                    Message = $"Successfully created {createdPlots.Count} plots",
                    CreatedCount = createdPlots.Count,
                    ErrorCount = errors.Count,
                    Errors = errors
                };
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest($"Failed to save plots: {ex.Message}");
            }
        }

        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> UpdatePlotStatus(int id, [FromBody] UpdatePlotStatusDto statusDto)
        {
            var plot = await _context.Plots.FindAsync(id);
            if (plot == null)
            {
                return NotFound();
            }
            
            plot.Status = statusDto.Status;
            plot.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            return Ok(new { message = $"Plot status updated to {statusDto.Status}" });
        }

        [HttpPost("initialize-received-amounts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> InitializeReceivedAmounts()
        {
            try
            {
                var plots = await _context.Plots.ToListAsync();
                var updatedCount = 0;

                foreach (var plot in plots)
                {
                    // Calculate received amount using plot number matching
                    // Include: Approved receipts (all types) + Pending token receipts (actual money received)
                    var receivedAmount = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber &&
                                   (r.Status == "Approved" || 
                                    (r.Status == "Pending" && r.ReceiptType == "token")))
                        .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

                    // Calculate total price if not set
                    if (plot.TotalPrice <= 0)
                    {
                        var plotSize = 0m;
                        if (!string.IsNullOrEmpty(plot.PlotSize) && decimal.TryParse(plot.PlotSize.Split(' ')[0], out var size))
                        {
                            plotSize = size;
                        }
                        plot.TotalPrice = plotSize * plot.BasicRate;
                    }

                    // Update received amount and status
                    plot.ReceivedAmount = receivedAmount;
                    
                    if (receivedAmount >= plot.TotalPrice)
                    {
                        plot.Status = "Sold";
                    }
                    else if (receivedAmount > 0)
                    {
                        plot.Status = "Booked";
                    }
                    else
                    {
                        plot.Status = "Available";
                    }

                    plot.UpdatedAt = DateTime.UtcNow;
                    updatedCount++;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = $"Initialized received amounts for {updatedCount} plots" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("{id}/debug-received-amount")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DebugReceivedAmount(int id)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(id);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                // Get all receipts for this plot using ONLY SiteName+PlotNumber
                var allReceipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        r.Amount,
                        r.TotalAmount,
                        r.PlotId,
                        r.SiteName,
                        r.PlotVillaNo,
                        UsedAmount = r.TotalAmount > 0 ? r.TotalAmount : r.Amount,
                        MatchedBy = "SiteName+PlotNumber"
                    })
                    .ToListAsync();

                var approvedReceipts = allReceipts.Where(r => r.Status == "Approved").ToList();
                var calculatedReceivedAmount = approvedReceipts.Sum(r => r.UsedAmount);

                return Ok(new {
                    PlotId = plot.Id,
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    StoredReceivedAmount = plot.ReceivedAmount,
                    CalculatedReceivedAmount = calculatedReceivedAmount,
                    TotalPrice = plot.TotalPrice,
                    TotalReceiptsFound = allReceipts.Count,
                    ApprovedReceiptsCount = approvedReceipts.Count,
                    AllReceipts = allReceipts,
                    ApprovedReceipts = approvedReceipts,
                    IsCorrect = plot.ReceivedAmount == calculatedReceivedAmount,
                    ShouldUpdate = plot.ReceivedAmount != calculatedReceivedAmount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("sync-plot-data-from-receipts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> SyncPlotDataFromReceipts()
        {
            try
            {
                // Get all unique plot combinations from receipts
                var receiptPlots = await _context.Receipts
                    .Where(r => !string.IsNullOrEmpty(r.SiteName) && !string.IsNullOrEmpty(r.PlotVillaNo))
                    .GroupBy(r => new { r.SiteName, r.PlotVillaNo })
                    .Select(g => new { 
                        SiteName = g.Key.SiteName, 
                        PlotNumber = g.Key.PlotVillaNo,
                        ReceiptCount = g.Count(),
                        ApprovedReceiptCount = g.Count(r => r.Status == "Approved"),
                        TotalApprovedAmount = g.Where(r => r.Status == "Approved" || 
                                                              (r.Status == "Pending" && r.ReceiptType == "token"))
                                               .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount)
                    })
                    .ToListAsync();

                var updatedPlots = 0;
                var results = new List<object>();

                foreach (var receiptPlot in receiptPlots)
                {
                    // Find matching plot
                    var plot = await _context.Plots
                        .FirstOrDefaultAsync(p => p.SiteName == receiptPlot.SiteName && 
                                                 p.PlotNumber == receiptPlot.PlotNumber);

                    if (plot != null)
                    {
                        var oldReceivedAmount = plot.ReceivedAmount;
                        var oldStatus = plot.Status;

                        // Update received amount
                        plot.ReceivedAmount = receiptPlot.TotalApprovedAmount;

                        // Calculate total plot price if not set
                        if (plot.TotalPrice <= 0)
                        {
                            var plotSize = 0m;
                            if (!string.IsNullOrEmpty(plot.PlotSize) && decimal.TryParse(plot.PlotSize.Split(' ')[0], out var size))
                            {
                                plotSize = size;
                            }
                            plot.TotalPrice = plotSize * plot.BasicRate;
                        }

                        // Update status based on received amount
                        if (plot.TotalPrice > 0)
                        {
                            if (plot.ReceivedAmount >= plot.TotalPrice)
                            {
                                plot.Status = "Sold";
                            }
                            else if (plot.ReceivedAmount > 0)
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
                            plot.Status = plot.ReceivedAmount > 0 ? "Booked" : "Available";
                        }

                        plot.UpdatedAt = DateTime.UtcNow;
                        updatedPlots++;

                        results.Add(new {
                            PlotId = plot.Id,
                            SiteName = plot.SiteName,
                            PlotNumber = plot.PlotNumber,
                            ReceiptCount = receiptPlot.ReceiptCount,
                            ApprovedReceiptCount = receiptPlot.ApprovedReceiptCount,
                            OldReceivedAmount = oldReceivedAmount,
                            NewReceivedAmount = plot.ReceivedAmount,
                            OldStatus = oldStatus,
                            NewStatus = plot.Status,
                            TotalPrice = plot.TotalPrice
                        });
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new {
                    message = $"Successfully synced data for {updatedPlots} plots from receipts",
                    totalPlotCombinations = receiptPlots.Count,
                    updatedPlots = updatedPlots,
                    details = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("recalculate-all-received-amounts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RecalculateAllReceivedAmounts()
        {
            try
            {
                var plots = await _context.Plots.ToListAsync();
                var updatedCount = 0;
                var results = new List<object>();

                foreach (var plot in plots)
                {
                    // Calculate received amount using plot number matching
                    // Include: Approved receipts (all types) + Pending token receipts (actual money received)
                    var receivedAmount = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber &&
                                   (r.Status == "Approved" || 
                                    (r.Status == "Pending" && r.ReceiptType == "token")))
                        .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

                    var oldAmount = plot.ReceivedAmount;
                    plot.ReceivedAmount = receivedAmount;
                    
                    // Update status based on received amount
                    if (receivedAmount >= plot.TotalPrice && plot.TotalPrice > 0)
                    {
                        plot.Status = "Sold";
                    }
                    else if (receivedAmount > 0)
                    {
                        plot.Status = "Booked";
                    }
                    else
                    {
                        plot.Status = "Available";
                    }

                    plot.UpdatedAt = DateTime.UtcNow;
                    
                    if (oldAmount != receivedAmount)
                    {
                        updatedCount++;
                        results.Add(new {
                            PlotId = plot.Id,
                            PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                            OldAmount = oldAmount,
                            NewAmount = receivedAmount,
                            Status = plot.Status
                        });
                    }
                }

                await _context.SaveChangesAsync();
                
                return Ok(new { 
                    message = $"Recalculated received amounts for {updatedCount} plots",
                    totalPlotsChecked = plots.Count,
                    updatedPlots = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("verify-receipt-calculation/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> VerifyReceiptCalculation(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                // Get all receipts for this plot with detailed breakdown
                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        OriginalAmount = r.Amount,           // Amount entered by associate
                        FinalAmount = r.TotalAmount,         // Amount after admin approval
                        UsedInCalculation = r.TotalAmount > 0 ? r.TotalAmount : r.Amount, // What we actually use
                        IncludedInTotal = (r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token")),
                        r.CreatedAt
                    })
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                // Calculate step by step
                var includedReceipts = receipts.Where(r => r.IncludedInTotal).ToList();
                var calculatedTotal = includedReceipts.Sum(r => r.UsedInCalculation);

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    PlotTotalPrice = plot.TotalPrice,
                    CurrentReceivedAmount = plot.ReceivedAmount,
                    CalculatedFromReceipts = calculatedTotal,
                    IsCorrect = plot.ReceivedAmount == calculatedTotal,
                    
                    Calculation = new {
                        Formula = "Sum of (Approved Receipts + Pending Token Receipts)",
                        Note = "Uses TotalAmount if set (after approval), otherwise uses original Amount",
                        IncludedReceiptsCount = includedReceipts.Count,
                        ExcludedReceiptsCount = receipts.Count - includedReceipts.Count
                    },
                    
                    AllReceipts = receipts,
                    IncludedReceipts = includedReceipts,
                    ExcludedReceipts = receipts.Where(r => !r.IncludedInTotal).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("test-receipt-amounts/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> TestReceiptAmounts(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                // Get all receipts for this plot
                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        r.Amount,
                        r.TotalAmount,
                        UsedAmount = r.TotalAmount > 0 ? r.TotalAmount : r.Amount,
                        r.CreatedAt
                    })
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                // Calculate what the received amount should be
                var calculatedReceived = receipts
                    .Where(r => r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token"))
                    .Sum(r => r.UsedAmount);

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    PlotTotalPrice = plot.TotalPrice,
                    CurrentReceivedAmount = plot.ReceivedAmount,
                    CalculatedReceivedAmount = calculatedReceived,
                    IsCorrect = plot.ReceivedAmount == calculatedReceived,
                    Receipts = receipts,
                    Summary = new {
                        TotalReceipts = receipts.Count,
                        ApprovedReceipts = receipts.Count(r => r.Status == "Approved"),
                        PendingTokenReceipts = receipts.Count(r => r.Status == "Pending" && r.ReceiptType == "token"),
                        PendingBookingReceipts = receipts.Count(r => r.Status == "Pending" && r.ReceiptType == "booking")
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("explain-received-amount/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ExplainReceivedAmount(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .ToListAsync();

                var calculation = new List<object>();
                decimal runningTotal = 0;

                foreach (var receipt in receipts.OrderBy(r => r.CreatedAt))
                {
                    var receiptAmount = receipt.TotalAmount > 0 ? receipt.TotalAmount : receipt.Amount;
                    var isIncluded = receipt.Status == "Approved" || (receipt.Status == "Pending" && receipt.ReceiptType == "token");
                    
                    if (isIncluded)
                    {
                        runningTotal += receiptAmount;
                    }

                    calculation.Add(new {
                        Step = calculation.Count + 1,
                        ReceiptNo = receipt.ReceiptNo,
                        ReceiptType = receipt.ReceiptType,
                        Status = receipt.Status,
                        OriginalAmount = receipt.Amount,
                        FinalAmount = receipt.TotalAmount > 0 ? receipt.TotalAmount : receipt.Amount,
                        IsIncluded = isIncluded,
                        Reason = isIncluded ? 
                            (receipt.Status == "Approved" ? "Approved receipt" : "Pending token receipt") :
                            (receipt.Status == "Pending" ? "Pending booking receipt (not counted)" : "Rejected receipt"),
                        RunningTotal = isIncluded ? runningTotal : (decimal?)null
                    });
                }

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    PlotTotalPrice = plot.TotalPrice,
                    CurrentReceivedAmount = plot.ReceivedAmount,
                    CalculatedReceivedAmount = runningTotal,
                    
                    Explanation = "Received Amount = Sum of individual receipt amounts (NOT plot total price)",
                    Rules = new[] {
                        "✅ Approved receipts (all types) - counted immediately",
                        "✅ Pending token receipts - counted (actual money received)",
                        "❌ Pending booking receipts - not counted until approved",
                        "❌ Rejected receipts - never counted"
                    },
                    
                    StepByStepCalculation = calculation
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("basic-rate-discount-analysis/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> AnalyzeBasicRateDiscounts(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                // Get all receipts with discount information
                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        r.Amount,
                        r.TotalAmount,
                        r.AdminDiscount,
                        r.AdminRemarks,
                        r.ApprovedAt,
                        r.BasicRate
                    })
                    .OrderBy(r => r.ApprovedAt ?? DateTime.MinValue).ThenBy(r => r.Id)
                    .ToListAsync();

                var plotSize = ParsePlotSize(plot.PlotSize);
                
                // Find the original basic rate (from the first receipt or plot creation)
                var firstReceipt = receipts.OrderBy(r => r.Id).FirstOrDefault();
                var originalBasicRate = firstReceipt?.BasicRate ?? plot.BasicRate;
                
                // Calculate total basic rate discount applied
                var totalBasicRateDiscount = receipts
                    .Where(r => r.Status == "Approved" && r.AdminDiscount.HasValue)
                    .Sum(r => r.AdminDiscount!.Value);

                // Calculate prices
                var originalTotalPrice = plotSize * originalBasicRate;
                var currentBasicRate = plot.BasicRate;
                var currentTotalPrice = plot.TotalPrice;
                var calculatedTotalPrice = plotSize * currentBasicRate;

                // Calculate received amount
                var totalReceived = receipts
                    .Where(r => r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token"))
                    .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber} ({plotSize} sq ft)",
                    
                    BasicRateBreakdown = new {
                        OriginalBasicRate = originalBasicRate,
                        CurrentBasicRate = currentBasicRate,
                        TotalBasicRateDiscount = totalBasicRateDiscount,
                        CalculatedBasicRate = originalBasicRate - totalBasicRateDiscount,
                        IsBasicRateCorrect = currentBasicRate == (originalBasicRate - totalBasicRateDiscount)
                    },
                    
                    PriceBreakdown = new {
                        PlotSize = plotSize,
                        OriginalTotalPrice = originalTotalPrice,
                        CurrentTotalPrice = currentTotalPrice,
                        CalculatedTotalPrice = calculatedTotalPrice,
                        TotalDiscountAmount = originalTotalPrice - calculatedTotalPrice,
                        IsTotalPriceCorrect = currentTotalPrice == calculatedTotalPrice
                    },
                    
                    PaymentBreakdown = new {
                        TotalReceived = totalReceived,
                        RemainingBalance = currentTotalPrice - totalReceived,
                        PaymentPercentage = currentTotalPrice > 0 ? (totalReceived / currentTotalPrice * 100) : 0
                    },
                    
                    DiscountHistory = receipts
                        .Where(r => r.AdminDiscount.HasValue && r.AdminDiscount > 0)
                        .Select(r => new {
                            r.ReceiptNo,
                            r.ReceiptType,
                            BasicRateDiscount = r.AdminDiscount,
                            DiscountAmount = r.AdminDiscount * plotSize,
                            r.AdminRemarks,
                            r.ApprovedAt
                        }),
                    
                    AllReceipts = receipts
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("force-update-plot-amounts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> ForceUpdatePlotAmounts()
        {
            try
            {
                var plots = await _context.Plots.ToListAsync();
                var results = new List<object>();

                foreach (var plot in plots)
                {
                    var oldAmount = plot.ReceivedAmount;
                    
                    // Force recalculate from receipts using the exact same logic as the helper method
                    var newAmount = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber &&
                                   (r.Status == "Approved" || 
                                    (r.Status == "Pending" && r.ReceiptType == "token")))
                        .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

                    plot.ReceivedAmount = newAmount;
                    plot.UpdatedAt = DateTime.UtcNow;

                    // Get receipt details for this plot
                    var receiptDetails = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                        .Select(r => new {
                            r.ReceiptNo,
                            r.ReceiptType,
                            r.Status,
                            OriginalAmount = r.Amount,
                            FinalAmount = r.TotalAmount > 0 ? r.TotalAmount : r.Amount,
                            IsIncluded = (r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token"))
                        })
                        .ToListAsync();

                    results.Add(new {
                        PlotId = plot.Id,
                        PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                        OldReceivedAmount = oldAmount,
                        NewReceivedAmount = newAmount,
                        Changed = oldAmount != newAmount,
                        ReceiptCount = receiptDetails.Count,
                        IncludedReceiptCount = receiptDetails.Count(r => r.IsIncluded),
                        ReceiptDetails = receiptDetails
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new {
                    message = "Force updated all plot received amounts from receipt amounts",
                    totalPlots = plots.Count,
                    changedPlots = results.Count(r => (bool)r.GetType().GetProperty("Changed")?.GetValue(r)!),
                    results = results.Where(r => (bool)r.GetType().GetProperty("Changed")?.GetValue(r)!).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("test-approval-with-discount")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> TestApprovalWithDiscount([FromBody] TestApprovalDto testDto)
        {
            try
            {
                var receipt = await _context.Receipts
                    .Include(r => r.Plot)
                    .FirstOrDefaultAsync(r => r.Id == testDto.ReceiptId);

                if (receipt == null)
                {
                    return NotFound("Receipt not found");
                }

                // Capture before state
                var beforeState = new {
                    ReceiptAmount = receipt.Amount,
                    ReceiptTotalAmount = receipt.TotalAmount,
                    PlotBasicRate = receipt.Plot?.BasicRate,
                    PlotTotalPrice = receipt.Plot?.TotalPrice,
                    PlotReceivedAmount = receipt.Plot?.ReceivedAmount
                };

                // Simulate the approval process
                var approveDto = new ApproveReceiptDto
                {
                    Discount = testDto.BasicRateDiscount,
                    Remarks = "Test approval with discount"
                };

                // Call the actual approval method logic
                receipt.Status = "Approved";
                receipt.AdminDiscount = approveDto.Discount ?? 0;
                receipt.AdminRemarks = approveDto.Remarks;
                receipt.ApprovedAt = DateTime.UtcNow;

                // Apply our fixed logic
                var originalReceiptAmount = receipt.Amount;
                receipt.TotalAmount = originalReceiptAmount; // Keep original amount

                // Apply discount to plot only
                if (receipt.Plot != null && approveDto.Discount.HasValue && approveDto.Discount.Value > 0)
                {
                    var plotSize = ParsePlotSize(receipt.Plot.PlotSize);
                    var basicRateDiscount = approveDto.Discount.Value;
                    var currentBasicRate = receipt.Plot.BasicRate;
                    var newBasicRate = Math.Max(0, currentBasicRate - basicRateDiscount);
                    var newTotalPrice = plotSize * newBasicRate;

                    receipt.Plot.BasicRate = newBasicRate;
                    receipt.Plot.TotalPrice = newTotalPrice;
                    receipt.Plot.UpdatedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // Capture after state
                var afterState = new {
                    ReceiptAmount = receipt.Amount,
                    ReceiptTotalAmount = receipt.TotalAmount,
                    PlotBasicRate = receipt.Plot?.BasicRate,
                    PlotTotalPrice = receipt.Plot?.TotalPrice,
                    PlotReceivedAmount = receipt.Plot?.ReceivedAmount
                };

                return Ok(new {
                    message = "Test approval completed",
                    receiptId = receipt.Id,
                    beforeState = beforeState,
                    afterState = afterState,
                    changes = new {
                        ReceiptAmountChanged = beforeState.ReceiptTotalAmount != afterState.ReceiptTotalAmount,
                        PlotPriceChanged = beforeState.PlotTotalPrice != afterState.PlotTotalPrice,
                        BasicRateChanged = beforeState.PlotBasicRate != afterState.PlotBasicRate
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("verify-discount-separation/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> VerifyDiscountSeparation(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                var plotSize = ParsePlotSize(plot.PlotSize);

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber} ({plotSize} sq ft)",
                    
                    CurrentState = new {
                        PlotBasicRate = plot.BasicRate,
                        PlotTotalPrice = plot.TotalPrice,
                        PlotReceivedAmount = plot.ReceivedAmount
                    },
                    
                    ReceiptAmounts = receipts.Select(r => new {
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        OriginalAmount = r.Amount,
                        FinalAmount = r.TotalAmount,
                        AdminDiscount = r.AdminDiscount,
                        Note = "Receipt amounts should NEVER be affected by plot discounts"
                    }),
                    
                    CalculatedValues = new {
                        TotalReceivedFromReceipts = receipts
                            .Where(r => r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token"))
                            .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount),
                        
                        ExpectedTotalPrice = plotSize * plot.BasicRate,
                        
                        TotalDiscountsApplied = receipts
                            .Where(r => r.AdminDiscount.HasValue)
                            .Sum(r => r.AdminDiscount!.Value)
                    },
                    
                    DiscountRule = "Discount should reduce PLOT TOTAL PRICE, not RECEIPT AMOUNTS",
                    
                    ExpectedBehavior = new {
                        ReceiptAmounts = "Should remain exactly as entered by associate",
                        PlotTotalPrice = "Should be reduced by (discount per sq ft × plot size)",
                        ReceivedAmount = "Should be sum of actual receipt amounts (unchanged)"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("check-receipt-amounts/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> CheckReceiptAmounts(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                // Get all receipts with detailed amount information
                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        OriginalAmount = r.Amount,
                        FinalTotalAmount = r.TotalAmount,
                        AdminDiscount = r.AdminDiscount,
                        Other = r.Other,
                        UsedInCalculation = r.TotalAmount > 0 ? r.TotalAmount : r.Amount,
                        IsIncluded = (r.Status == "Approved" || (r.Status == "Pending" && r.ReceiptType == "token")),
                        r.CreatedAt,
                        r.ApprovedAt
                    })
                    .OrderBy(r => r.CreatedAt)
                    .ToListAsync();

                var totalReceived = receipts
                    .Where(r => r.IsIncluded)
                    .Sum(r => r.UsedInCalculation);

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    PlotReceivedAmount = plot.ReceivedAmount,
                    CalculatedReceivedAmount = totalReceived,
                    PlotTotalPrice = plot.TotalPrice,
                    PlotBasicRate = plot.BasicRate,
                    
                    ReceiptBreakdown = receipts.Select(r => new {
                        r.ReceiptNo,
                        r.ReceiptType,
                        r.Status,
                        r.OriginalAmount,
                        r.FinalTotalAmount,
                        r.AdminDiscount,
                        r.Other,
                        r.UsedInCalculation,
                        r.IsIncluded,
                        Note = r.IsIncluded ? "Counted in received amount" : "Not counted"
                    }),
                    
                    Summary = new {
                        TotalReceipts = receipts.Count,
                        IncludedReceipts = receipts.Count(r => r.IsIncluded),
                        TotalOriginalAmount = receipts.Where(r => r.IsIncluded).Sum(r => r.OriginalAmount),
                        TotalFinalAmount = receipts.Where(r => r.IsIncluded).Sum(r => r.UsedInCalculation),
                        TotalDiscounts = receipts.Where(r => r.AdminDiscount.HasValue).Sum(r => r.AdminDiscount!.Value)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("test-discount-calculation")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> TestDiscountCalculation([FromBody] TestDiscountDto testDto)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(testDto.PlotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                var plotSize = ParsePlotSize(plot.PlotSize);
                var originalBasicRate = plot.BasicRate;
                var originalTotalPrice = plot.TotalPrice > 0 ? plot.TotalPrice : (plotSize * originalBasicRate);
                
                var basicRateDiscount = testDto.BasicRateDiscount;
                var newBasicRate = Math.Max(0, originalBasicRate - basicRateDiscount);
                var newTotalPrice = plotSize * newBasicRate;
                var totalDiscountAmount = originalTotalPrice - newTotalPrice;

                return Ok(new {
                    PlotInfo = $"{plot.SiteName} - {plot.PlotNumber}",
                    PlotSizeString = plot.PlotSize,
                    ParsedPlotSize = plotSize,
                    
                    OriginalValues = new {
                        BasicRate = originalBasicRate,
                        TotalPrice = originalTotalPrice
                    },
                    
                    DiscountCalculation = new {
                        BasicRateDiscount = basicRateDiscount,
                        NewBasicRate = newBasicRate,
                        NewTotalPrice = newTotalPrice,
                        TotalDiscountAmount = totalDiscountAmount
                    },
                    
                    Formula = new {
                        Step1 = $"Original: {plotSize} sq ft × ₹{originalBasicRate} = ₹{originalTotalPrice:N0}",
                        Step2 = $"Discount: ₹{originalBasicRate} - ₹{basicRateDiscount} = ₹{newBasicRate} per sq ft",
                        Step3 = $"New Total: {plotSize} sq ft × ₹{newBasicRate} = ₹{newTotalPrice:N0}",
                        Step4 = $"Total Discount: ₹{originalTotalPrice:N0} - ₹{newTotalPrice:N0} = ₹{totalDiscountAmount:N0}"
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("debug-plot-calculation/{plotId}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> DebugPlotCalculation(int plotId)
        {
            try
            {
                var plot = await _context.Plots.FindAsync(plotId);
                if (plot == null)
                {
                    return NotFound("Plot not found");
                }

                var plotSize = ParsePlotSize(plot.PlotSize);
                var calculatedTotalPrice = plotSize * plot.BasicRate;

                // Get all receipts for debugging
                var receipts = await _context.Receipts
                    .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                    .Select(r => new {
                        r.Id,
                        r.ReceiptNo,
                        r.Status,
                        r.Amount,
                        r.TotalAmount,
                        r.AdminDiscount,
                        r.BasicRate,
                        r.PlotSize,
                        r.ApprovedAt
                    })
                    .OrderBy(r => r.Id)
                    .ToListAsync();

                return Ok(new {
                    PlotInfo = new {
                        PlotId = plot.Id,
                        SiteName = plot.SiteName,
                        PlotNumber = plot.PlotNumber,
                        PlotSizeString = plot.PlotSize,
                        ParsedPlotSize = plotSize,
                        CurrentBasicRate = plot.BasicRate,
                        StoredTotalPrice = plot.TotalPrice,
                        CalculatedTotalPrice = calculatedTotalPrice,
                        ReceivedAmount = plot.ReceivedAmount
                    },
                    
                    Calculation = new {
                        Formula = "Total Price = Plot Size × Basic Rate",
                        PlotSize = plotSize,
                        BasicRate = plot.BasicRate,
                        Result = calculatedTotalPrice,
                        IsConsistent = plot.TotalPrice == calculatedTotalPrice
                    },
                    
                    ReceiptHistory = receipts,
                    
                    DiscountHistory = receipts
                        .Where(r => r.AdminDiscount.HasValue && r.AdminDiscount > 0)
                        .Select(r => new {
                            r.ReceiptNo,
                            BasicRateDiscount = r.AdminDiscount,
                            TotalDiscountAmount = r.AdminDiscount * plotSize,
                            r.ApprovedAt
                        })
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("fix-basic-rate-discounts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> FixBasicRateDiscounts()
        {
            try
            {
                var plots = await _context.Plots.ToListAsync();
                var results = new List<object>();

                foreach (var plot in plots)
                {
                    var plotSize = ParsePlotSize(plot.PlotSize);
                    
                    // Get all approved receipts with discounts for this plot
                    var discountedReceipts = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber && 
                                   r.Status == "Approved" && r.AdminDiscount.HasValue && r.AdminDiscount > 0)
                        .OrderBy(r => r.ApprovedAt)
                        .ToListAsync();

                    if (discountedReceipts.Any())
                    {
                        // Find original basic rate (from first receipt or current if no receipts)
                        var firstReceipt = await _context.Receipts
                            .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber)
                            .OrderBy(r => r.Id)
                            .FirstOrDefaultAsync();
                        
                        var originalBasicRate = firstReceipt?.BasicRate ?? plot.BasicRate;
                        
                        // Calculate total basic rate discount
                        var totalBasicRateDiscount = discountedReceipts.Sum(r => r.AdminDiscount!.Value);
                        
                        // Calculate correct basic rate and total price
                        var correctBasicRate = Math.Max(0, originalBasicRate - totalBasicRateDiscount);
                        var correctTotalPrice = plotSize * correctBasicRate;

                        var oldBasicRate = plot.BasicRate;
                        var oldTotalPrice = plot.TotalPrice;
                        var changed = false;

                        // Update basic rate if different
                        if (plot.BasicRate != correctBasicRate)
                        {
                            plot.BasicRate = correctBasicRate;
                            changed = true;
                        }

                        // Update total price if different
                        if (plot.TotalPrice != correctTotalPrice)
                        {
                            plot.TotalPrice = correctTotalPrice;
                            changed = true;
                        }

                        if (changed)
                        {
                            plot.UpdatedAt = DateTime.UtcNow;
                        }

                        results.Add(new {
                            PlotId = plot.Id,
                            PlotInfo = $"{plot.SiteName} - {plot.PlotNumber} ({plotSize} sq ft)",
                            OriginalBasicRate = originalBasicRate,
                            TotalBasicRateDiscount = totalBasicRateDiscount,
                            OldBasicRate = oldBasicRate,
                            NewBasicRate = correctBasicRate,
                            OldTotalPrice = oldTotalPrice,
                            NewTotalPrice = correctTotalPrice,
                            Changed = changed,
                            DiscountedReceipts = discountedReceipts.Select(r => new {
                                r.ReceiptNo,
                                BasicRateDiscount = r.AdminDiscount,
                                r.ApprovedAt
                            })
                        });
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new {
                    message = "Fixed basic rate discount logic for all plots",
                    totalPlotsChecked = plots.Count,
                    plotsWithDiscounts = results.Count,
                    plotsChanged = results.Count(r => (bool)r.GetType().GetProperty("Changed")?.GetValue(r)!),
                    results = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost("refresh-plot-received-amounts")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> RefreshPlotReceivedAmounts()
        {
            try
            {
                // Get all plots that have receipts
                var plotsWithReceipts = await _context.Plots
                    .Where(p => _context.Receipts.Any(r => r.SiteName == p.SiteName && r.PlotVillaNo == p.PlotNumber))
                    .ToListAsync();

                var updatedCount = 0;
                var results = new List<object>();

                foreach (var plot in plotsWithReceipts)
                {
                    var oldAmount = plot.ReceivedAmount;
                    
                    // Calculate new received amount including pending token receipts
                    var newAmount = await _context.Receipts
                        .Where(r => r.SiteName == plot.SiteName && r.PlotVillaNo == plot.PlotNumber &&
                                   (r.Status == "Approved" || 
                                    (r.Status == "Pending" && r.ReceiptType == "token")))
                        .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

                    plot.ReceivedAmount = newAmount;
                    
                    // Update status
                    if (plot.TotalPrice > 0)
                    {
                        if (newAmount >= plot.TotalPrice)
                        {
                            plot.Status = "Sold";
                        }
                        else if (newAmount > 0)
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
                        plot.Status = newAmount > 0 ? "Booked" : "Available";
                    }

                    plot.UpdatedAt = DateTime.UtcNow;
                    updatedCount++;

                    results.Add(new {
                        PlotId = plot.Id,
                        SiteName = plot.SiteName,
                        PlotNumber = plot.PlotNumber,
                        OldAmount = oldAmount,
                        NewAmount = newAmount,
                        Status = plot.Status,
                        Changed = oldAmount != newAmount
                    });
                }

                await _context.SaveChangesAsync();

                return Ok(new {
                    message = $"Refreshed received amounts for {updatedCount} plots",
                    updatedPlots = results.Where(r => (bool)r.GetType().GetProperty("Changed")?.GetValue(r)!).ToList(),
                    allPlots = results
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("plot-receipt-mapping-analysis")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetPlotReceiptMappingAnalysis()
        {
            try
            {
                // Get all plots
                var totalPlots = await _context.Plots.CountAsync();
                
                // Get all receipts
                var totalReceipts = await _context.Receipts.CountAsync();
                
                // Get unique plot combinations from receipts
                var receiptPlotCombinations = await _context.Receipts
                    .Where(r => !string.IsNullOrEmpty(r.SiteName) && !string.IsNullOrEmpty(r.PlotVillaNo))
                    .GroupBy(r => new { r.SiteName, r.PlotVillaNo })
                    .Select(g => new {
                        SiteName = g.Key.SiteName,
                        PlotNumber = g.Key.PlotVillaNo,
                        ReceiptCount = g.Count(),
                        ApprovedCount = g.Count(r => r.Status == "Approved"),
                        PendingCount = g.Count(r => r.Status == "Pending"),
                        RejectedCount = g.Count(r => r.Status == "Rejected"),
                        TotalAmount = g.Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount),
                        ApprovedAmount = g.Where(r => r.Status == "Approved" || 
                                                        (r.Status == "Pending" && r.ReceiptType == "token"))
                                          .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount)
                    })
                    .ToListAsync();

                // Check which receipt combinations have matching plots
                var mappedCombinations = new List<object>();
                var unmappedCombinations = new List<object>();

                foreach (var combo in receiptPlotCombinations)
                {
                    var matchingPlot = await _context.Plots
                        .FirstOrDefaultAsync(p => p.SiteName == combo.SiteName && p.PlotNumber == combo.PlotNumber);

                    if (matchingPlot != null)
                    {
                        mappedCombinations.Add(new {
                            combo.SiteName,
                            combo.PlotNumber,
                            PlotId = matchingPlot.Id,
                            combo.ReceiptCount,
                            combo.ApprovedCount,
                            combo.ApprovedAmount,
                            PlotReceivedAmount = matchingPlot.ReceivedAmount,
                            IsInSync = matchingPlot.ReceivedAmount == combo.ApprovedAmount
                        });
                    }
                    else
                    {
                        unmappedCombinations.Add(new {
                            combo.SiteName,
                            combo.PlotNumber,
                            combo.ReceiptCount,
                            combo.ApprovedAmount,
                            Reason = "No matching plot found"
                        });
                    }
                }

                return Ok(new {
                    totalPlots = totalPlots,
                    totalReceipts = totalReceipts,
                    totalReceiptPlotCombinations = receiptPlotCombinations.Count,
                    mappedCombinations = mappedCombinations.Count,
                    unmappedCombinations = unmappedCombinations.Count,
                    mappingPercentage = receiptPlotCombinations.Count > 0 ? 
                        (mappedCombinations.Count * 100.0 / receiptPlotCombinations.Count) : 100,
                    plotsWithReceipts = mappedCombinations,
                    plotsWithoutMatchingReceipts = unmappedCombinations.Take(10),
                    outOfSyncPlots = mappedCombinations.Where(m => {
                        var isInSyncProperty = m.GetType().GetProperty("IsInSync");
                        var isInSyncValue = isInSyncProperty?.GetValue(m);
                        return isInSyncValue != null && !(bool)isInSyncValue;
                    }).Take(10)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
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

        private static IQueryable<Plot> ApplyPlotSorting(IQueryable<Plot> query, string? sortBy, string? sortOrder)
        {
            var isDescending = sortOrder?.ToLower() == "desc";
            
            return sortBy?.ToLower() switch
            {
                "sitename" => isDescending ? query.OrderByDescending(p => p.SiteName) : query.OrderBy(p => p.SiteName),
                "plotnumber" => isDescending ? query.OrderByDescending(p => p.PlotNumber) : query.OrderBy(p => p.PlotNumber),
                "plotsize" => isDescending ? query.OrderByDescending(p => p.PlotSize) : query.OrderBy(p => p.PlotSize),
                "basicrate" => isDescending ? query.OrderByDescending(p => p.BasicRate) : query.OrderBy(p => p.BasicRate),
                "totalprice" => isDescending ? query.OrderByDescending(p => p.TotalPrice) : query.OrderBy(p => p.TotalPrice),
                "status" => isDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
                _ => isDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt)
            };
        }
    }

    public class TestDiscountDto
    {
        public int PlotId { get; set; }
        public decimal BasicRateDiscount { get; set; }
    }

    public class TestApprovalDto
    {
        public long ReceiptId { get; set; }
        public decimal BasicRateDiscount { get; set; }
    }
}