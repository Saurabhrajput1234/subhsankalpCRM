using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.DTOs
{
    public class ReceiptFilterDto
    {
        public string? CustomerName { get; set; }
        public string? ReferenceName { get; set; }
        public string? SiteName { get; set; }
        public string? PlotNumber { get; set; }
        public string? Mobile { get; set; }
        public string? Status { get; set; } // Pending, Approved, Rejected
        public string? ReceiptType { get; set; } // token, booking
        public string? CompanyName { get; set; } // Subhsankalp, Golden City
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public DateTime? TokenExpiryFromDate { get; set; }
        public DateTime? TokenExpiryToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public int? CreatedByUserId { get; set; }
        public bool? CashPayment { get; set; }
        public bool? ChequePayment { get; set; }
        public string? ChequeNo { get; set; }
        
        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        
        // Sorting
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "desc"; // asc, desc
    }
    
    public class PlotFilterDto
    {
        public string? SiteName { get; set; }
        public string? PlotNumber { get; set; }
        public string? Status { get; set; } // Available, Booked, Sold
        public string? PlotSize { get; set; }
        public decimal? MinBasicRate { get; set; }
        public decimal? MaxBasicRate { get; set; }
        public decimal? MinTotalPrice { get; set; }
        public decimal? MaxTotalPrice { get; set; }
        public string? CustomerName { get; set; }
        public string? AssociateName { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        
        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        
        // Sorting
        public string? SortBy { get; set; } = "CreatedAt";
        public string? SortOrder { get; set; } = "desc";
    }
    
    public class PaymentFilterDto
    {
        public string? PaymentMethod { get; set; } // Cash, Cheque, NEFT/RTGS, UPI
        public string? TransactionReference { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public long? ReceiptId { get; set; }
        public int? PlotId { get; set; }
        public string? CustomerName { get; set; }
        
        // Pagination
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        
        // Sorting
        public string? SortBy { get; set; } = "PaymentDate";
        public string? SortOrder { get; set; } = "desc";
    }
    
    public class PaginatedResult<T>
    {
        public IEnumerable<T> Data { get; set; } = new List<T>();
        public int TotalRecords { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}