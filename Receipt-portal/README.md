# Real Estate CRM Management System - Backend API

This is the ASP.NET Core Web API backend for the Real Estate CRM Management System.

## Features

- **User Authentication & Authorization** with JWT tokens
- **Role-based Access Control** (Admin, Associate, Customer)
- **Token Receipt Management** - Associates can create token receipts
- **Admin Approval Workflow** - Admins can approve/reject tokens with discounts and remarks
- **Plot Management** - Complete CRUD operations for plots
- **Payment Tracking** - Track payments by method (Cash, Cheque, NEFT/RTGS, UPI)
- **Dashboard Analytics** - Revenue tracking, site-wise statistics
- **Customer Portal** - Customers can view their booking details

## Technology Stack

- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server with Entity Framework Core
- **Authentication**: JWT Bearer tokens
- **Password Hashing**: BCrypt
- **API Documentation**: Swagger/OpenAPI

## Project Structure

```
Receipt portal/
├── Controllers/           # API Controllers
│   ├── AuthController.cs     # Authentication endpoints
│   ├── ReceiptsController.cs # Receipt management
│   ├── PlotsController.cs    # Plot management
│   ├── UsersController.cs    # User management (Admin only)
│   └── DashboardController.cs # Analytics & dashboard
├── Models/               # Data models
│   ├── User.cs
│   ├── Receipt.cs
│   ├── Plot.cs
│   └── Payment.cs
├── DTOs/                 # Data Transfer Objects
├── Data/                 # Database context
├── Services/             # Business logic services
└── Program.cs           # Application startup
```

## Setup Instructions

### 1. Prerequisites
- .NET 8.0 SDK
- SQL Server (LocalDB or full SQL Server)
- Visual Studio 2022 or VS Code

### 2. Database Setup

1. Update the connection string in `appsettings.json` if needed:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=RealEstateCRM;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

2. Run Entity Framework migrations:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 3. Run the Application

```bash
dotnet restore
dotnet run
```

The API will be available at:
- HTTP: `http://localhost:5000`
- HTTPS: `https://localhost:5001`
- Swagger UI: `https://localhost:5001/swagger`

## Default Admin Account

- **Username**: `admin`
- **Password**: `Admin@123`
- **Role**: Admin

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (Admin/Associate)
- `POST /api/auth/customer-login` - Customer login (Site + Plot + Password)

### Receipts
- `GET /api/receipts` - Get receipts (filtered by user role)
- `POST /api/receipts` - Create token receipt (Associate only)
- `GET /api/receipts/{id}` - Get specific receipt
- `POST /api/receipts/{id}/approve` - Approve receipt (Admin only)
- `POST /api/receipts/{id}/reject` - Reject receipt (Admin only)
- `GET /api/receipts/customer` - Get customer receipts (Customer only)

### Plots
- `GET /api/plots` - Get all plots
- `POST /api/plots` - Create plot (Admin only)
- `GET /api/plots/{id}` - Get specific plot
- `PUT /api/plots/{id}` - Update plot (Admin only)
- `DELETE /api/plots/{id}` - Delete plot (Admin only)
- `GET /api/plots/available` - Get available plots

### Users (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/{id}` - Get specific user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Dashboard (Admin Only)
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/revenue-by-month` - Get monthly revenue data
- `GET /api/dashboard/site-wise-stats` - Get site-wise statistics

## User Roles & Permissions

### Admin
- Full access to all endpoints
- Can approve/reject token receipts
- Can manage plots and users
- Access to dashboard and analytics

### Associate
- Can create token receipts
- Can view their own receipts
- Can view available plots
- Cannot approve receipts or manage users

### Customer
- Can view their own booking details
- Can download receipts
- Login using Site Name + Plot Number + Password

## Customer Login System

Customers login using:
- **Site Name**: The site where their plot is located
- **Plot Number**: Their specific plot number
- **Password**: Format `Plot{PlotNumber}` (e.g., for Plot A-101, password is "PlotA-101")

## Security Features

- JWT token-based authentication
- Role-based authorization
- Password hashing with BCrypt
- CORS configuration for frontend integration
- Secure API endpoints with proper validation

## Database Schema

The system uses Entity Framework Code First approach with the following main entities:

- **Users**: System users (Admin, Associates)
- **Receipts**: Token and booking receipts
- **Plots**: Property plots with details
- **Payments**: Payment tracking records

## Development Notes

- The API includes comprehensive error handling
- All endpoints return appropriate HTTP status codes
- Swagger documentation is available for API testing
- CORS is configured to allow requests from React frontend
- Entity relationships are properly configured with foreign keys

## Next Steps

1. Run the database migrations
2. Test the API endpoints using Swagger UI
3. Create some sample plots and users
4. Integrate with the React frontend
5. Configure production database connection
6. Set up proper logging and monitoring