using Microsoft.EntityFrameworkCore;
using Subh_sankalp_estate.Data;

namespace Subh_sankalp_estate.Services
{
    public class ReceiptService : IReceiptService
    {
        private readonly ApplicationDbContext _context;
        
        public ReceiptService(ApplicationDbContext context)
        {
            _context = context;
        }
        
        public async Task<string> GenerateReceiptNumberAsync(string receiptType = "token")
        {
            // Get the total count of all receipts to generate sequential 4-digit numbers
            var totalCount = await _context.Receipts.CountAsync();
            var sequenceNumber = totalCount + 1;
            
            // Format: BR/25-26/0001 (BR for Booking Receipt, 25-26 for financial year 2025-26)
            var paddedNumber = sequenceNumber.ToString("D4");
            return $"BR/25-26/{paddedNumber}";
        }
    }
}