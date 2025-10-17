namespace Subh_sankalp_estate.Services
{
    public interface IReceiptService
    {
        Task<string> GenerateReceiptNumberAsync(string receiptType = "token");
    }
}