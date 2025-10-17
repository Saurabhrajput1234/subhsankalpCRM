using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;
using Subh_sankalp_estate.Models;
using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        
        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetUsers()
        {
            var users = await _context.Users
                .Where(u => u.Role != "Admin") // Don't show admin users
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.Email,
                    u.FullName,
                    u.Mobile,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt,
                    ReceiptCount = u.Receipts.Count()
                })
                .ToListAsync();
                
            return Ok(users);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Receipts)
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
            {
                return NotFound();
            }
            
            return Ok(new
            {
                user.Id,
                user.Username,
                user.Email,
                user.FullName,
                user.Mobile,
                user.Role,
                user.IsActive,
                user.CreatedAt,
                ReceiptCount = user.Receipts.Count(),
                TotalSales = user.Receipts.Where(r => r.Status == "Approved").Sum(r => r.TotalAmount)
            });
        }
        
        [HttpPost]
        public async Task<ActionResult<object>> CreateUser(CreateUserDto createUserDto)
        {
            // Check if username already exists
            if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
            {
                return BadRequest("Username already exists");
            }
            
            // Check if email already exists
            if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
            {
                return BadRequest("Email already exists");
            }
            
            var user = new User
            {
                Username = createUserDto.Username,
                Email = createUserDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(createUserDto.Password),
                FullName = createUserDto.FullName,
                Mobile = createUserDto.Mobile,
                Role = createUserDto.Role,
                IsActive = true
            };
            
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new
            {
                user.Id,
                user.Username,
                user.Email,
                user.FullName,
                user.Mobile,
                user.Role,
                user.IsActive,
                user.CreatedAt
            });
        }
        
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }
            
            if (!string.IsNullOrEmpty(updateUserDto.Email) && 
                await _context.Users.AnyAsync(u => u.Email == updateUserDto.Email && u.Id != id))
            {
                return BadRequest("Email already exists");
            }
            
            if (!string.IsNullOrEmpty(updateUserDto.Email))
                user.Email = updateUserDto.Email;
                
            if (!string.IsNullOrEmpty(updateUserDto.FullName))
                user.FullName = updateUserDto.FullName;
                
            if (!string.IsNullOrEmpty(updateUserDto.Mobile))
                user.Mobile = updateUserDto.Mobile;
                
            if (updateUserDto.IsActive.HasValue)
                user.IsActive = updateUserDto.IsActive.Value;
                
            if (!string.IsNullOrEmpty(updateUserDto.Password))
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateUserDto.Password);
                
            user.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
        
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Receipts)
                .FirstOrDefaultAsync(u => u.Id == id);
                
            if (user == null)
            {
                return NotFound();
            }
            
            if (user.Receipts.Any())
            {
                return BadRequest("Cannot delete user with existing receipts. Deactivate instead.");
            }
            
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            
            return NoContent();
        }
    }
    
    public class CreateUserDto
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
        
        public string Mobile { get; set; } = string.Empty;
        
        [Required]
        public string Role { get; set; } = "Associate";
    }
    
    public class UpdateUserDto
    {
        [EmailAddress]
        public string? Email { get; set; }
        
        public string? FullName { get; set; }
        
        public string? Mobile { get; set; }
        
        public bool? IsActive { get; set; }
        
        [MinLength(6)]
        public string? Password { get; set; }
    }
}