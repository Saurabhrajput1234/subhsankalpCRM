using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.DTOs
{
    public class LoginDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
    
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int UserId { get; set; }
    }
    
    public class CustomerLoginDto
    {
        [Required]
        public string SiteName { get; set; } = string.Empty;
        
        [Required]
        public string PlotNumber { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
    
    public class SignupDto
    {
        [Required]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Please enter a valid 10-digit mobile number")]
        public string Mobile { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = "Associate"; // Associate or Admin
        
        [Required]
        public string CompanySecretKey { get; set; } = string.Empty;
    }
}