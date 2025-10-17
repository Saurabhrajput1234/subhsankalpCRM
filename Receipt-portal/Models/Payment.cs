using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Subh_sankalp_estate.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; } = 0;
        
        [Required]
        [StringLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // Cash, Cheque, NEFT/RTGS, UPI
        
        [StringLength(100)]
        public string TransactionReference { get; set; } = string.Empty;
        
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
        
        public string Remarks { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Foreign Keys
        public long ReceiptId { get; set; }
        public int? PlotId { get; set; }
        public int CreatedByUserId { get; set; }
        
        // Navigation properties
        [ForeignKey("ReceiptId")]
        public virtual Receipt Receipt { get; set; } = null!;
        
        [ForeignKey("PlotId")]
        public virtual Plot? Plot { get; set; }
        
        [ForeignKey("CreatedByUserId")]
        public virtual User CreatedBy { get; set; } = null!;
    }
}