using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        [StringLength(50)]
        public string Role { get; set; } = "Associate"; // Admin, Associate, Customer
        
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string Mobile { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<Receipt> Receipts { get; set; } = new List<Receipt>();
    }
}