using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.DTOs;
using Subh_sankalp_estate.Models;
using Subh_sankalp_estate.Services;
using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IConfiguration _configuration;
        
        public AuthController(ApplicationDbContext context, IJwtService jwtService, IConfiguration configuration)
        {
            _context = context;
            _jwtService = jwtService;
            _configuration = configuration;
        }
        
        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginDto loginDto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);
                
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials");
            }
            
            var token = _jwtService.GenerateToken(user);
            
            return Ok(new LoginResponseDto
            {
                Token = token,
                Role = user.Role,
                FullName = user.FullName,
                UserId = user.Id
            });
        }
        
        [HttpPost("customer-login")]
        public async Task<ActionResult<LoginResponseDto>> CustomerLogin(CustomerLoginDto loginDto)
        {
            // Find receipt with matching site name and plot number
            var receipt = await _context.Receipts
                .Include(r => r.CreatedBy)
                .FirstOrDefaultAsync(r => 
                    r.SiteName == loginDto.SiteName && 
                    r.PlotVillaNo == loginDto.PlotNumber &&
                    r.Status == "Approved");
                    
            if (receipt == null)
            {
                return Unauthorized("No approved booking found for this site and plot");
            }
            
            // For demo purposes, using a simple password format: Plot{PlotNumber}
            // In production, you'd want a more secure approach
            var expectedPassword = $"Plot{loginDto.PlotNumber}";
            
            if (loginDto.Password != expectedPassword)
            {
                return Unauthorized("Invalid password");
            }
            
            var token = _jwtService.GenerateCustomerToken(
                loginDto.SiteName, 
                loginDto.PlotNumber, 
                receipt.FromName
            );
            
            return Ok(new LoginResponseDto
            {
                Token = token,
                Role = "Customer",
                FullName = receipt.FromName,
                UserId = 0 // Customer doesn't have a user ID
            });
        }
        
        [HttpPost("signup")]
        public async Task<ActionResult<LoginResponseDto>> Signup(SignupDto signupDto)
        {
            try
            {
                // Log the incoming request for debugging
                Console.WriteLine($"Signup request received:");
                Console.WriteLine($"  Username: {signupDto.Username}");
                Console.WriteLine($"  Email: {signupDto.Email}");
                Console.WriteLine($"  Mobile: {signupDto.Mobile}");
                Console.WriteLine($"  Role: {signupDto.Role}");
                Console.WriteLine($"  FullName: {signupDto.FullName}");
                Console.WriteLine($"  CompanySecretKey: {signupDto.CompanySecretKey}");
                
                // Validate model state
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    Console.WriteLine($"Validation errors: {string.Join(", ", errors)}");
                    return BadRequest(new { message = "Validation failed", errors = errors });
                }

                // Verify company secret key
                var companySecretKey = _configuration.GetValue<string>("CompanySettings:SecretKey");
                Console.WriteLine($"Expected secret key: '{companySecretKey}'");
                Console.WriteLine($"Received secret key: '{signupDto.CompanySecretKey}'");
                Console.WriteLine($"Keys match: {signupDto.CompanySecretKey == companySecretKey}");
                
                if (string.IsNullOrEmpty(companySecretKey))
                {
                    return BadRequest(new { message = "Company secret key not configured" });
                }
                
                if (signupDto.CompanySecretKey != companySecretKey)
                {
                    return BadRequest(new { message = $"Invalid company secret key. Expected: '{companySecretKey}', Received: '{signupDto.CompanySecretKey}'" });
                }
                
                // Check if username already exists
                if (await _context.Users.AnyAsync(u => u.Username == signupDto.Username))
                {
                    return BadRequest(new { message = "Username already exists" });
                }
                
                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == signupDto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }
                
                // Validate role
                if (signupDto.Role != "Associate" && signupDto.Role != "Admin")
                {
                    return BadRequest(new { message = "Invalid role. Only Associate and Admin roles are allowed for signup." });
                }
            
            // Create new user
            var user = new User
            {
                Username = signupDto.Username,
                Email = signupDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(signupDto.Password),
                FullName = signupDto.FullName,
                Mobile = signupDto.Mobile,
                Role = signupDto.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
                // Generate token for the new user
                var token = _jwtService.GenerateToken(user);
                
                return Ok(new LoginResponseDto
                {
                    Token = token,
                    Role = user.Role,
                    FullName = user.FullName,
                    UserId = user.Id
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Signup failed", error = ex.Message });
            }
        }
    }
}