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
        
        [StringLength(50)]
        public string Block { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string PlotNumber { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Length { get; set; } = 0;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Width { get; set; } = 0;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Area { get; set; } = 0;
        
        [StringLength(100)]
        public string PlotSize { get; set; } = string.Empty; // Keeping for backward compatibility
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal BasicRate { get; set; } = 0;
        
        [StringLength(100)]
        public string Road { get; set; } = string.Empty;
        
        public bool PLCApplicable { get; set; } = false;
        
        [StringLength(100)]
        public string TypeofPLC { get; set; } = string.Empty;
        
        [StringLength(50)]
        public string Facing { get; set; } = string.Empty;
        
        [StringLength(255)]
        public string RegisteredCompany { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string GataKhesraNo { get; set; } = string.Empty;
        
        public bool AvailablePlot { get; set; } = true;
        
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