using System.ComponentModel.DataAnnotations;

namespace Subh_sankalp_estate.DTOs
{
    public class CreatePlotDto
    {
        [Required]
        public string SiteName { get; set; } = string.Empty;
        
        public string Block { get; set; } = string.Empty;
        
        [Required]
        public string PlotNumber { get; set; } = string.Empty;
        
        public decimal Length { get; set; }
        
        public decimal Width { get; set; }
        
        public decimal Area { get; set; }
        
        public string PlotSize { get; set; } = string.Empty;
        
        public decimal BasicRate { get; set; }
        
        public string Road { get; set; } = string.Empty;
        
        public bool PLCApplicable { get; set; } = false;
        
        public string TypeofPLC { get; set; } = string.Empty;
        
        public string Facing { get; set; } = string.Empty;
        
        public string RegisteredCompany { get; set; } = string.Empty;
        
        public string GataKhesraNo { get; set; } = string.Empty;
        
        public bool AvailablePlot { get; set; } = true;
        
        public string Description { get; set; } = string.Empty;
    }
    
    public class PlotResponseDto
    {
        public int Id { get; set; }
        public string SiteName { get; set; } = string.Empty;
        public string Block { get; set; } = string.Empty;
        public string PlotNumber { get; set; } = string.Empty;
        public decimal Length { get; set; }
        public decimal Width { get; set; }
        public decimal Area { get; set; }
        public string PlotSize { get; set; } = string.Empty;
        public decimal BasicRate { get; set; }
        public string Road { get; set; } = string.Empty;
        public bool PLCApplicable { get; set; }
        public string TypeofPLC { get; set; } = string.Empty;
        public string Facing { get; set; } = string.Empty;
        public string RegisteredCompany { get; set; } = string.Empty;
        public string GataKhesraNo { get; set; } = string.Empty;
        public bool AvailablePlot { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal TotalPaid { get; set; }
        public decimal RemainingBalance { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string AssociateName { get; set; } = string.Empty;
        public string ReferenceName { get; set; } = string.Empty;
        public decimal ReceivedAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? TokenExpiryDate { get; set; }
        public decimal PaymentPercentage { get; set; }
    }
    
    public class UpdatePlotDto
    {
        public string? Block { get; set; }
        public decimal? Length { get; set; }
        public decimal? Width { get; set; }
        public decimal? Area { get; set; }
        public string? PlotSize { get; set; }
        public decimal? BasicRate { get; set; }
        public string? Road { get; set; }
        public bool? PLCApplicable { get; set; }
        public string? TypeofPLC { get; set; }
        public string? Facing { get; set; }
        public string? RegisteredCompany { get; set; }
        public string? GataKhesraNo { get; set; }
        public bool? AvailablePlot { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
    }
    
    public class BulkPlotDataDto
    {
        public string Block { get; set; } = string.Empty;
        
        [Required]
        public string PlotNumber { get; set; } = string.Empty;
        
        public decimal Length { get; set; }
        
        public decimal Width { get; set; }
        
        public decimal Area { get; set; }
        
        public string PlotSize { get; set; } = string.Empty;
        
        [Required]
        public decimal BasicRate { get; set; }
        
        public string Road { get; set; } = string.Empty;
        
        public bool PLCApplicable { get; set; } = false;
        
        public string TypeofPLC { get; set; } = string.Empty;
        
        public string Facing { get; set; } = string.Empty;
        
        public string RegisteredCompany { get; set; } = string.Empty;
        
        public string GataKhesraNo { get; set; } = string.Empty;
        
        public bool AvailablePlot { get; set; } = true;
    }
    
    public class BulkCreatePlotsDto
    {
        [Required]
        public string SiteName { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public List<BulkPlotDataDto> Plots { get; set; } = new List<BulkPlotDataDto>();
    }

    public class UpdatePlotStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}