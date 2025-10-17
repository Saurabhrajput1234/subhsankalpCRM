# Real Estate CRM - Setup Guide

## Port Configuration

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5007
- **Swagger UI**: http://localhost:5007/swagger

## Quick Start

### 1. Start Backend (Port 5007)
```bash
cd "Receipt-portal"
dotnet run
```

### 2. Start Frontend (Port 5000)
```bash
cd Frontend
npm run dev
```

## Environment Configuration

The frontend is configured to connect to the backend on port 5007:

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5007/api
```

### Backend CORS
The backend allows requests from:
- http://localhost:5000 (your frontend)
- http://localhost:3000
- http://localhost:5173

## Testing Connection

1. **Open Frontend**: http://localhost:5000
2. **Check Connection**: Look for the connection test widget in the bottom-right corner
3. **Test API**: Click "Test" to verify backend connectivity
4. **Swagger UI**: http://localhost:5007/swagger

## Login Credentials

### Admin
- Username: `admin`
- Password: `Admin@123`

### Associate
- Username: `associate1`
- Password: `Associate@123`

### Customer
- Site Name: `Green Valley`
- Plot Number: `A-101`
- Password: `PlotA-101`

## Troubleshooting

### Backend Not Starting on Port 5007
1. Check if port 5007 is available
2. Update `launchSettings.json` if needed
3. Verify SQL Server connection

### Frontend Can't Connect to Backend
1. Ensure backend is running on port 5007
2. Check CORS configuration
3. Try HTTP instead of HTTPS if certificate issues
4. Verify .env file configuration

### CORS Issues
If you see CORS errors, make sure the backend Program.cs includes:
```csharp
policy.WithOrigins("http://localhost:5000")
```

## Development Workflow

1. Start backend first (port 5007)
2. Wait for "Now listening on: https://localhost:5007"
3. Start frontend (port 5000)
4. Open http://localhost:5000 in browser
5. Use connection test widget to verify connectivity

## API Endpoints

Base URL: `http://localhost:5007/api`

- `POST /auth/login` - Admin/Associate login
- `POST /auth/customer-login` - Customer login
- `GET /receipts` - Get receipts with filtering
- `POST /receipts` - Create receipt
- `GET /plots` - Get plots
- `GET /dashboard/stats` - Dashboard statistics

## Sample Data

The system includes:
- 6 sample plots across 3 sites
- Admin and Associate users
- Various plot sizes and rates for testing