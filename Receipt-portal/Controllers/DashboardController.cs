using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        [HttpGet("stats")]
        public async Task<ActionResult<object>> GetDashboardStats()
        {
            var totalPlots = await _context.Plots.CountAsync();
            var availablePlots = await _context.Plots.CountAsync(p => p.Status == "Available");
            var bookedPlots = await _context.Plots.CountAsync(p => p.Status == "Booked");
            var soldPlots = await _context.Plots.CountAsync(p => p.Status == "Sold");
            
            var totalReceipts = await _context.Receipts.CountAsync();
            var pendingReceipts = await _context.Receipts.CountAsync(r => r.Status == "Pending");
            var approvedReceipts = await _context.Receipts.CountAsync(r => r.Status == "Approved");
            
            var totalRevenue = await _context.Receipts
                .Where(r => r.Status == "Approved")
                .SumAsync(r => r.TotalAmount);
                
            var totalPayments = await _context.Payments.SumAsync(p => p.Amount);
            
            var monthlyRevenue = await _context.Receipts
                .Where(r => r.Status == "Approved" && r.ApprovedAt.HasValue && 
                           r.ApprovedAt.Value.Month == DateTime.Now.Month &&
                           r.ApprovedAt.Value.Year == DateTime.Now.Year)
                .SumAsync(r => r.TotalAmount);
            
            var recentReceipts = await _context.Receipts
                .Include(r => r.CreatedBy)
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .Select(r => new
                {
                    r.Id,
                    r.ReceiptNo,
                    r.FromName,
                    r.SiteName,
                    r.PlotVillaNo,
                    r.Amount,
                    r.Status,
                    CreatedBy = r.CreatedBy.FullName,
                    r.CreatedAt
                })
                .ToListAsync();
            
            return Ok(new
            {
                Plots = new
                {
                    Total = totalPlots,
                    Available = availablePlots,
                    Booked = bookedPlots,
                    Sold = soldPlots
                },
                Receipts = new
                {
                    Total = totalReceipts,
                    Pending = pendingReceipts,
                    Approved = approvedReceipts
                },
                Revenue = new
                {
                    Total = totalRevenue,
                    Monthly = monthlyRevenue,
                    TotalPayments = totalPayments,
                    Outstanding = totalRevenue - totalPayments
                },
                RecentReceipts = recentReceipts
            });
        }
        
        [HttpGet("revenue-by-month")]
        public async Task<ActionResult<object>> GetRevenueByMonth()
        {
            var currentYear = DateTime.Now.Year;
            var monthlyRevenue = new List<object>();
            
            for (int month = 1; month <= 12; month++)
            {
                var revenue = await _context.Receipts
                    .Where(r => r.Status == "Approved" && 
                               r.ApprovedAt.HasValue &&
                               r.ApprovedAt.Value.Year == currentYear &&
                               r.ApprovedAt.Value.Month == month)
                    .SumAsync(r => r.TotalAmount);
                    
                monthlyRevenue.Add(new
                {
                    Month = month,
                    MonthName = new DateTime(currentYear, month, 1).ToString("MMMM"),
                    Revenue = revenue
                });
            }
            
            return Ok(monthlyRevenue);
        }
        
        [HttpGet("site-wise-stats")]
        public async Task<ActionResult<object>> GetSiteWiseStats([FromQuery] string? siteName)
        {
            IQueryable<Plot> query = _context.Plots;
            
            if (!string.IsNullOrEmpty(siteName))
            {
                query = query.Where(p => p.SiteName.Contains(siteName));
            }
            
            var siteStats = await query
                .GroupBy(p => p.SiteName)
                .Select(g => new
                {
                    SiteName = g.Key,
                    TotalPlots = g.Count(),
                    AvailablePlots = g.Count(p => p.Status == "Available"),
                    BookedPlots = g.Count(p => p.Status == "Booked"),
                    SoldPlots = g.Count(p => p.Status == "Sold"),
                    TotalRevenue = g.Sum(p => p.TotalPrice),
                    AverageRate = g.Average(p => p.BasicRate)
                })
                .OrderByDescending(s => s.TotalRevenue)
                .ToListAsync();
                
            return Ok(siteStats);
        }
        
        [HttpGet("associate-performance")]
        public async Task<ActionResult<object>> GetAssociatePerformance([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            IQueryable<Receipt> query = _context.Receipts
                .Include(r => r.CreatedBy)
                .Where(r => r.CreatedBy.Role == "Associate");
            
            if (fromDate.HasValue)
            {
                query = query.Where(r => r.CreatedAt >= fromDate.Value);
            }
            
            if (toDate.HasValue)
            {
                query = query.Where(r => r.CreatedAt <= toDate.Value);
            }
            
            var performance = await query
                .GroupBy(r => new { r.CreatedByUserId, r.CreatedBy.FullName })
                .Select(g => new
                {
                    AssociateId = g.Key.CreatedByUserId,
                    AssociateName = g.Key.FullName,
                    TotalReceipts = g.Count(),
                    ApprovedReceipts = g.Count(r => r.Status == "Approved"),
                    PendingReceipts = g.Count(r => r.Status == "Pending"),
                    RejectedReceipts = g.Count(r => r.Status == "Rejected"),
                    TotalSales = g.Where(r => r.Status == "Approved").Sum(r => r.TotalAmount),
                    AverageReceiptValue = g.Average(r => r.Amount),
                    ApprovalRate = g.Count() > 0 ? (double)g.Count(r => r.Status == "Approved") / g.Count() * 100 : 0
                })
                .OrderByDescending(p => p.TotalSales)
                .ToListAsync();
                
            return Ok(performance);
        }
        
        [HttpGet("payment-method-stats")]
        public async Task<ActionResult<object>> GetPaymentMethodStats([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            IQueryable<Payment> query = _context.Payments;
            
            if (fromDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= fromDate.Value);
            }
            
            if (toDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= toDate.Value);
            }
            
            var stats = await query
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new
                {
                    PaymentMethod = g.Key,
                    TotalAmount = g.Sum(p => p.Amount),
                    Count = g.Count(),
                    AverageAmount = g.Average(p => p.Amount),
                    Percentage = 0.0 // Will calculate after getting total
                })
                .ToListAsync();
            
            var totalAmount = stats.Sum(s => s.TotalAmount);
            
            var result = stats.Select(s => new
            {
                s.PaymentMethod,
                s.TotalAmount,
                s.Count,
                s.AverageAmount,
                Percentage = totalAmount > 0 ? (double)s.TotalAmount / (double)totalAmount * 100 : 0
            }).OrderByDescending(s => s.TotalAmount).ToList();
            
            return Ok(result);
        }
    }
}