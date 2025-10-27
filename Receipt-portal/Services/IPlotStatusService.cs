using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Services
{
    public interface IPlotStatusService
    {
        Task UpdatePlotStatusAsync(int plotId, string receiptType, decimal amount);
        Task CheckAndUpdateExpiredTokensAsync();
        Task<string> CalculatePlotStatusAsync(int plotId);
        Task<decimal> GetPlotPaymentPercentageAsync(int plotId);
    }
}