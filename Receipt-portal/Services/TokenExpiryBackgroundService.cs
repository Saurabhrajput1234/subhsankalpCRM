using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;

namespace Subh_sankalp_estate.Services
{
    public class TokenExpiryBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TokenExpiryBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(1); // Check every hour

        public TokenExpiryBackgroundService(IServiceProvider serviceProvider, ILogger<TokenExpiryBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessExpiredTokensAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while processing expired tokens");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessExpiredTokensAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            
            var currentDate = DateTime.UtcNow;
            
            _logger.LogInformation("Starting token expiry check at {CurrentDate}", currentDate);

            // Find all approved token receipts that have expired
            var expiredTokenReceipts = await context.Receipts
                .Include(r => r.Plot)
                .Where(r => r.ReceiptType.ToLower() == "token" && 
                           r.Status == "Approved" &&
                           r.TokenExpiryDate.HasValue && 
                           r.TokenExpiryDate.Value < currentDate)
                .ToListAsync();

            if (!expiredTokenReceipts.Any())
            {
                _logger.LogInformation("No expired tokens found");
                return;
            }

            _logger.LogInformation("Found {Count} expired token receipts", expiredTokenReceipts.Count);

            foreach (var tokenReceipt in expiredTokenReceipts)
            {
                try
                {
                    await ProcessExpiredTokenReceiptAsync(context, tokenReceipt);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing expired token receipt {ReceiptId}", tokenReceipt.Id);
                }
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Token expiry processing completed");
        }

        private async Task ProcessExpiredTokenReceiptAsync(ApplicationDbContext context, Models.Receipt tokenReceipt)
        {
            if (tokenReceipt.Plot == null)
            {
                _logger.LogWarning("Token receipt {ReceiptId} has no associated plot", tokenReceipt.Id);
                return;
            }

            var plot = tokenReceipt.Plot;
            
            // Check if there are any booking receipts for this plot after the token was created
            var hasBookingAfterToken = await context.Receipts
                .AnyAsync(r => r.PlotId == plot.Id && 
                              r.ReceiptType.ToLower() == "booking" && 
                              r.Status == "Approved" &&
                              r.CreatedAt > tokenReceipt.CreatedAt);

            if (hasBookingAfterToken)
            {
                // Token should not expire because booking receipt exists
                _logger.LogInformation("Token receipt {ReceiptId} for plot {PlotNumber} will not expire - booking receipt exists", 
                    tokenReceipt.Id, plot.PlotNumber);
                return;
            }

            // Mark token receipt as expired
            tokenReceipt.Status = "Expired";
            tokenReceipt.UpdatedAt = DateTime.UtcNow;
            
            _logger.LogInformation("Token receipt {ReceiptId} for plot {PlotNumber} marked as expired", 
                tokenReceipt.Id, plot.PlotNumber);

            // Update plot status back to Available if it was Tokened
            if (plot.Status == "Tokened")
            {
                // Double-check: ensure no other active tokens exist for this plot
                var hasOtherActiveTokens = await context.Receipts
                    .AnyAsync(r => r.PlotId == plot.Id && 
                                  r.ReceiptType.ToLower() == "token" && 
                                  r.Status == "Approved" &&
                                  r.Id != tokenReceipt.Id &&
                                  r.TokenExpiryDate.HasValue && 
                                  r.TokenExpiryDate.Value > DateTime.UtcNow);

                if (!hasOtherActiveTokens)
                {
                    plot.Status = "Available";
                    plot.UpdatedAt = DateTime.UtcNow;
                    
                    _logger.LogInformation("Plot {PlotNumber} status changed from Tokened to Available due to token expiry", 
                        plot.PlotNumber);
                }
            }

            // Recalculate plot received amount (expired receipts don't count)
            await RecalculatePlotReceivedAmountAsync(context, plot);
        }

        private async Task RecalculatePlotReceivedAmountAsync(ApplicationDbContext context, Models.Plot plot)
        {
            // Calculate total received amount from APPROVED receipts only (excluding expired)
            var totalReceivedAmount = await context.Receipts
                .Where(r => r.PlotId == plot.Id && r.Status == "Approved")
                .SumAsync(r => r.TotalAmount > 0 ? r.TotalAmount : r.Amount);

            plot.ReceivedAmount = totalReceivedAmount;
            
            _logger.LogInformation("Plot {PlotNumber} received amount recalculated to {Amount}", 
                plot.PlotNumber, totalReceivedAmount);
        }
    }
}