using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Data
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Check if data already exists
            if (await context.Plots.AnyAsync())
            {
                return; // Data already seeded
            }

            // Seed sample plots
            var plots = new List<Plot>
            {
                new Plot
                {
                    SiteName = "Green Valley",
                    PlotNumber = "A-101",
                    PlotSize = "1200 sq ft",
                    BasicRate = 2500,
                    Status = "Available",
                    Description = "Corner plot with good ventilation",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Plot
                {
                    SiteName = "Green Valley",
                    PlotNumber = "A-102",
                    PlotSize = "1000 sq ft",
                    BasicRate = 2500,
                    Status = "Available",
                    Description = "East facing plot",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Plot
                {
                    SiteName = "Green Valley",
                    PlotNumber = "A-103",
                    PlotSize = "1500 sq ft",
                    BasicRate = 2500,
                    Status = "Available",
                    Description = "Large plot with garden space",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Plot
                {
                    SiteName = "Sunrise Heights",
                    PlotNumber = "B-201",
                    PlotSize = "800 sq ft",
                    BasicRate = 3000,
                    Status = "Available",
                    Description = "Compact plot suitable for small family",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Plot
                {
                    SiteName = "Sunrise Heights",
                    PlotNumber = "B-202",
                    PlotSize = "1100 sq ft",
                    BasicRate = 3000,
                    Status = "Available",
                    Description = "Well-ventilated plot with parking",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Plot
                {
                    SiteName = "Royal Gardens",
                    PlotNumber = "C-301",
                    PlotSize = "2000 sq ft",
                    BasicRate = 3500,
                    Status = "Available",
                    Description = "Premium large plot with garden view",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            context.Plots.AddRange(plots);

            // Seed sample associate user
            var associateUser = new User
            {
                Username = "associate1",
                Email = "associate1@realestate.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Associate@123"),
                Role = "Associate",
                FullName = "John Associate",
                Mobile = "9876543210",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            context.Users.Add(associateUser);
            await context.SaveChangesAsync();
        }
    }
}