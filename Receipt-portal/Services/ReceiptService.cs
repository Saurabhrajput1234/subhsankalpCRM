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
            
            // Format: Simple 4-digit format starting from 0001
            return sequenceNumber.ToString("D4");
        }
    }
}