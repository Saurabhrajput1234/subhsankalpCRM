using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Subh_sankalp_estate.Models
{
    public class Plot
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(255)]
        public string SiteName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string PlotNumber { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string PlotSize { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasicRate { get; set; } = 0;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; } = 0;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal ReceivedAmount { get; set; } = 0;
        
        public string Status { get; set; } = "Available"; // Available, Tokened, Booked, Sold
        
        public string Description { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}