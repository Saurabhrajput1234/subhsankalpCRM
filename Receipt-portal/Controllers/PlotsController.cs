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
                
                // Get the best receipt for customer info (approved first, then most recent)
                var receipt = matchingReceipts
                    .OrderByDescending(r => r.Status == "Approved" ? 1 : 0)
                    .ThenByDescending(r => r.CreatedAt)
                    .FirstOrDefault();
                
                // Calculate total price
                var plotSize = ParsePlotSize(p.PlotSize);
                var calculatedTotalPrice = p.TotalPrice > 0 ? p.TotalPrice : (plotSize * p.BasicRate);
                
                // Always calculate received amount from receipts to ensure accuracy
                // Sum receipts: Approved (all types) + Pending token receipts (actual money received)
                var calculatedReceivedAmount = matchingReceipts
                    .Where(r => r.Status == "Approved" || 
                               (r.Status == "Pending" && r.ReceiptType == "token"))
                    .Sum(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);
                
                // Use calculated amount (this ensures we always show the sum of receipt amounts)
                var storedReceivedAmount = calculatedReceivedAmount;
                
                var remainingBalance = calculatedTotalPrice - storedReceivedAmount;
                
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
                    CreatedAt = p.CreatedAt
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
                CreatedAt = plot.CreatedAt
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
}