using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        
        public DbSet<User> Users { get; set; }
        public DbSet<Receipt> Receipts { get; set; }
        public DbSet<Plot> Plots { get; set; }
        public DbSet<Payment> Payments { get; set; }
        
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Configure relationships
            modelBuilder.Entity<Receipt>()
                .HasOne(r => r.CreatedBy)
                .WithMany(u => u.Receipts)
                .HasForeignKey(r => r.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Receipt>()
                .HasOne(r => r.ApprovedBy)
                .WithMany()
                .HasForeignKey(r => r.ApprovedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
                
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Receipt)
                .WithMany(r => r.Payments)
                .HasForeignKey(p => p.ReceiptId)
                .OnDelete(DeleteBehavior.Cascade);
                
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Plot)
                .WithMany(pl => pl.Payments)
                .HasForeignKey(p => p.PlotId)
                .OnDelete(DeleteBehavior.SetNull);
                
            // Seed default admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@realestate.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = "Admin",
                    FullName = "System Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }
    }
}