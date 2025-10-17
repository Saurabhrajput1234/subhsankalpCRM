using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.DTOs;
using Subh_sankalp_estate.Models;
using System.Security.Claims;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaymentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public PaymentsController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        [HttpGet]
        public async Task<ActionResult<PaginatedResult<PaymentResponseDto>>> GetPayments([FromQuery] PaymentFilterDto filter)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            IQueryable<Payment> query = _context.Payments
                .Include(p => p.Receipt)
                .Include(p => p.Plot)
                .Include(p => p.CreatedBy);
            
            // Role-based filtering
            if (userRole == "Associate")
            {
                query = query.Where(p => p.CreatedByUserId == userId);
            }
            
            // Apply filters
            if (!string.IsNullOrEmpty(filter.PaymentMethod))
            {
                query = query.Where(p => p.PaymentMethod == filter.PaymentMethod);
            }
            
            if (!string.IsNullOrEmpty(filter.TransactionReference))
            {
                query = query.Where(p => p.TransactionReference.Contains(filter.TransactionReference));
            }
            
            if (filter.FromDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= filter.FromDate.Value);
            }
            
            if (filter.ToDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= filter.ToDate.Value);
            }
            
            if (filter.MinAmount.HasValue)
            {
                query = query.Where(p => p.Amount >= filter.MinAmount.Value);
            }
            
            if (filter.MaxAmount.HasValue)
            {
                query = query.Where(p => p.Amount <= filter.MaxAmount.Value);
            }
            
            if (filter.ReceiptId.HasValue)
            {
                query = query.Where(p => p.ReceiptId == filter.ReceiptId.Value);
            }
            
            if (filter.PlotId.HasValue)
            {
                query = query.Where(p => p.PlotId == filter.PlotId.Value);
            }
            
            if (!string.IsNullOrEmpty(filter.CustomerName))
            {
                query = query.Where(p => p.Receipt.FromName.Contains(filter.CustomerName));
            }
            
            // Get total count before pagination
            var totalRecords = await query.CountAsync();
            
            // Apply sorting
            query = ApplyPaymentSorting(query, filter.SortBy, filter.SortOrder);
            
            // Apply pagination
            var payments = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();
            
            var result = payments.Select(p => new PaymentResponseDto
            {
                Id = p.Id,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod,
                TransactionReference = p.TransactionReference,
                PaymentDate = p.PaymentDate,
                Remarks = p.Remarks,
                ReceiptId = p.ReceiptId,
                ReceiptNo = p.Receipt.ReceiptNo,
                CustomerName = p.Receipt.FromName,
                SiteName = p.Plot?.SiteName ?? p.Receipt.SiteName,
                PlotNumber = p.Plot?.PlotNumber ?? p.Receipt.PlotVillaNo,
                CreatedByName = p.CreatedBy.FullName,
                CreatedAt = p.CreatedAt
            });
            
            var totalPages = (int)Math.Ceiling((double)totalRecords / filter.PageSize);
            
            return Ok(new PaginatedResult<PaymentResponseDto>
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
        
        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentResponseDto>> GetPayment(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Receipt)
                .Include(p => p.Plot)
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (payment == null)
            {
                return NotFound();
            }
            
            var result = new PaymentResponseDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                TransactionReference = payment.TransactionReference,
                PaymentDate = payment.PaymentDate,
                Remarks = payment.Remarks,
                ReceiptId = payment.ReceiptId,
                ReceiptNo = payment.Receipt.ReceiptNo,
                CustomerName = payment.Receipt.FromName,
                SiteName = payment.Plot?.SiteName ?? payment.Receipt.SiteName,
                PlotNumber = payment.Plot?.PlotNumber ?? payment.Receipt.PlotVillaNo,
                CreatedByName = payment.CreatedBy.FullName,
                CreatedAt = payment.CreatedAt
            };
            
            return Ok(result);
        }
        
        [HttpPost]
        [Authorize(Roles = "Admin,Associate")]
        public async Task<ActionResult<PaymentResponseDto>> CreatePayment(CreatePaymentDto createPaymentDto)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            
            // Verify receipt exists
            var receipt = await _context.Receipts
                .Include(r => r.Plot)
                .FirstOrDefaultAsync(r => r.Id == createPaymentDto.ReceiptId);
                
            if (receipt == null)
            {
                return BadRequest("Receipt not found");
            }
            
            var payment = new Payment
            {
                Amount = createPaymentDto.Amount,
                PaymentMethod = createPaymentDto.PaymentMethod,
                TransactionReference = createPaymentDto.TransactionReference,
                PaymentDate = createPaymentDto.PaymentDate,
                Remarks = createPaymentDto.Remarks,
                ReceiptId = createPaymentDto.ReceiptId,
                PlotId = receipt.PlotId,
                CreatedByUserId = userId
            };
            
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetPayment), new { id = payment.Id }, 
                await GetPaymentResponse(payment.Id));
        }
        
        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetPaymentSummary([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var query = _context.Payments.AsQueryable();
            
            if (fromDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate >= fromDate.Value);
            }
            
            if (toDate.HasValue)
            {
                query = query.Where(p => p.PaymentDate <= toDate.Value);
            }
            
            var summary = await query
                .GroupBy(p => p.PaymentMethod)
                .Select(g => new
                {
                    PaymentMethod = g.Key,
                    TotalAmount = g.Sum(p => p.Amount),
                    Count = g.Count()
                })
                .ToListAsync();
            
            var totalAmount = summary.Sum(s => s.TotalAmount);
            var totalCount = summary.Sum(s => s.Count);
            
            return Ok(new
            {
                Summary = summary,
                TotalAmount = totalAmount,
                TotalCount = totalCount,
                FromDate = fromDate,
                ToDate = toDate
            });
        }
        
        private async Task<PaymentResponseDto?> GetPaymentResponse(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Receipt)
                .Include(p => p.Plot)
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id);
                
            if (payment == null) return null;
            
            return new PaymentResponseDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                TransactionReference = payment.TransactionReference,
                PaymentDate = payment.PaymentDate,
                Remarks = payment.Remarks,
                ReceiptId = payment.ReceiptId,
                ReceiptNo = payment.Receipt.ReceiptNo,
                CustomerName = payment.Receipt.FromName,
                SiteName = payment.Plot?.SiteName ?? payment.Receipt.SiteName,
                PlotNumber = payment.Plot?.PlotNumber ?? payment.Receipt.PlotVillaNo,
                CreatedByName = payment.CreatedBy.FullName,
                CreatedAt = payment.CreatedAt
            };
        }
        
        private static IQueryable<Payment> ApplyPaymentSorting(IQueryable<Payment> query, string? sortBy, string? sortOrder)
        {
            var isDescending = sortOrder?.ToLower() == "desc";
            
            return sortBy?.ToLower() switch
            {
                "amount" => isDescending ? query.OrderByDescending(p => p.Amount) : query.OrderBy(p => p.Amount),
                "paymentmethod" => isDescending ? query.OrderByDescending(p => p.PaymentMethod) : query.OrderBy(p => p.PaymentMethod),
                "transactionreference" => isDescending ? query.OrderByDescending(p => p.TransactionReference) : query.OrderBy(p => p.TransactionReference),
                "customername" => isDescending ? query.OrderByDescending(p => p.Receipt.FromName) : query.OrderBy(p => p.Receipt.FromName),
                _ => isDescending ? query.OrderByDescending(p => p.PaymentDate) : query.OrderBy(p => p.PaymentDate)
            };
        }
    }
    
    public class PaymentResponseDto
    {
        public int Id { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string TransactionReference { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public long ReceiptId { get; set; }
        public string ReceiptNo { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string PlotNumber { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    
    public class CreatePaymentDto
    {
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public string TransactionReference { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        public string Remarks { get; set; } = string.Empty;
        public long ReceiptId { get; set; }
    }
}