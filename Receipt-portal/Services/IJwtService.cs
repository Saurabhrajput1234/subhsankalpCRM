using Subh_sankalp_estate.Models;

namespace Subh_sankalp_estate.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        string GenerateCustomerToken(string siteName, string plotNumber, string customerName);
    }
}