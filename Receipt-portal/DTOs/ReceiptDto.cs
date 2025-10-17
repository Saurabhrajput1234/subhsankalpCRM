using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.DTOs
{
    public class CreateReceiptDto
    {
        public string? ReceiptType { get; set; } = "token"; // token or booking
        
        [Required]
        public string FromName { get; set; } = string.Empty;
        
        public string RelationType { get; set; } = "S/O";
        
        public string RelationName { get; set; } = string.Empty;
        
        [Required]
        public string Address { get; set; } = string.Empty;
        
        [Required]
        public string Mobile { get; set; } = string.Empty;
        
        public DateTime? TokenExpiryDate { get; set; }
        
        public string ReceivedAmount { get; set; } = string.Empty;
        
        public string ReferenceName { get; set; } = string.Empty;
        
        [Required]
        public string SiteName { get; set; } = string.Empty;
        
        [Required]
        public string PlotVillaNo { get; set; } = string.Empty;
        
        public decimal Amount { get; set; }
        
        public string Other { get; set; } = string.Empty;
        
        public bool CashChecked { get; set; }
        
        public bool ChequeChecked { get; set; }
        
        public bool RtgsChecked { get; set; }
        
        public string ChequeNo { get; set; } = string.Empty;
        
        public string RtgsNeft { get; set; } = string.Empty;
        
        public string AssociateRemarks { get; set; } = string.Empty;
        
        public string AdminRemarks { get; set; } = string.Empty;
        
        public int? PlotId { get; set; } // For booking receipts
    }
    
    public class ReceiptResponseDto
    {
        public long Id { get; set; }
        public string ReceiptNo { get; set; } = string.Empty;
        public string ReceiptType { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string FromName { get; set; } = string.Empty;
        public string RelationType { get; set; } = string.Empty;
        public string RelationName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public DateTime? TokenExpiryDate { get; set; }
        public string ReferenceName { get; set; } = string.Empty;
        public string SiteName { get; set; } = string.Empty;
        public string PlotVillaNo { get; set; } = string.Empty;
        public string PlotSize { get; set; } = string.Empty;
        public decimal BasicRate { get; set; }
        public decimal Amount { get; set; }
        public string Other { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public bool CashChecked { get; set; }
        public bool ChequeChecked { get; set; }
        public bool RtgsChecked { get; set; }
        public string ChequeNo { get; set; } = string.Empty;
        public string RtgsNeft { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal? AdminDiscount { get; set; }
        public string AdminRemarks { get; set; } = string.Empty;
        public string AssociateRemarks { get; set; } = string.Empty;
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    
    public class ApproveReceiptDto
    {
        public decimal? Discount { get; set; }
        public string Remarks { get; set; } = string.Empty;
        public DateTime? ExtendedExpiryDate { get; set; }
    }
}