# Plot Status Management System

## Overview
The Receipt Portal now includes a comprehensive plot status management system that handles token receipts, booking receipts, and automatic status transitions based on payment percentages and token expiry.

## Plot Status Flow

### 1. **Available** → **Tokened**
- **Trigger**: Token receipt is created
- **Condition**: Any token receipt (regardless of approval status)
- **Description**: Plot is reserved with a token payment

### 2. **Tokened** → **Available** 
- **Trigger**: Token expires without booking receipt
- **Condition**: Token expiry date has passed AND no booking receipts exist
- **Description**: Token expired, plot becomes available again

### 3. **Tokened** → **Booked**
- **Trigger**: Booking receipt is created
- **Condition**: Any booking receipt with payment < 60% of total price
- **Description**: Customer made part payment after token

### 4. **Booked** → **Sold**
- **Trigger**: Payment reaches 60% threshold
- **Condition**: Total approved payments ≥ 60% of plot total price
- **Description**: Sufficient payment received, plot is sold

## Status Definitions

| Status | Description | Color Code | Conditions |
|--------|-------------|------------|------------|
| **Available** | Plot is available for sale | Green | No active receipts or expired tokens |
| **Tokened** | Plot is reserved with token | Orange | Active token receipt with future expiry |
| **Booked** | Plot is booked with part payment | Blue | Booking receipt with < 60% payment |
| **Sold** | Plot is fully sold | Red | Total payments ≥ 60% of plot price |

## Key Features

### 🔄 **Automatic Status Updates**
- Status updates automatically when receipts are created
- Background service checks for expired tokens every hour
- Real-time calculation of payment percentages

### 📅 **Token Management**
- Token receipts include expiry dates
- Automatic status reversion when tokens expire
- Prevents double-booking of plots

### 💰 **Payment Tracking**
- Tracks total payments across all receipt types
- Calculates payment percentage against plot total price
- Supports both token and booking receipts

### 🔍 **Enhanced Filtering**
- Filter plots by status (Available, Tokened, Booked, Sold)
- View token expiry dates for tokened plots
- Payment percentage display

## API Endpoints

### Plot Status Endpoints
```
GET /api/plots/available     - Get available plots
GET /api/plots/tokened       - Get tokened plots with expiry info
GET /api/plots?status=Booked - Filter plots by status
GET /api/plots?status=Sold   - Get sold plots
```

### Status Information
- **TokenExpiryDate**: Shows when token expires (for tokened plots)
- **PaymentPercentage**: Shows payment completion percentage
- **RemainingBalance**: Shows amount still due

## Business Rules

### Token Receipts
1. **Purpose**: Reserve plot temporarily
2. **Status Change**: Available → Tokened
3. **Expiry**: Automatic reversion to Available if no booking follows
4. **Amount**: Any amount (typically small token amount)

### Booking Receipts  
1. **Purpose**: Confirm plot purchase with substantial payment
2. **Status Change**: Tokened/Available → Booked → Sold (at 60%)
3. **Amount**: Significant payment towards plot price
4. **Threshold**: 60% payment = Sold status

### Payment Calculation
- **Approved receipts**: All types count towards payment
- **Pending token receipts**: Count as received (money already collected)
- **Pending booking receipts**: Don't count until approved

## Background Services

### Token Expiry Service
- **Frequency**: Runs every hour
- **Function**: Checks for expired tokens
- **Action**: Reverts Tokened plots to Available if no booking exists

## Database Changes

### Plot Model Updates
- Status field now supports: "Available", "Tokened", "Booked", "Sold"
- Enhanced with automatic status management

### New Services
- **PlotStatusService**: Handles all status logic
- **TokenExpiryBackgroundService**: Manages token expiry

## Usage Examples

### Creating Token Receipt
```csharp
// Token receipt automatically sets plot to "Tokened"
var tokenReceipt = new Receipt {
    ReceiptType = "token",
    TokenExpiryDate = DateTime.UtcNow.AddDays(30),
    Amount = 10000
};
```

### Creating Booking Receipt
```csharp
// Booking receipt moves plot to "Booked" or "Sold" based on payment %
var bookingReceipt = new Receipt {
    ReceiptType = "booking", 
    Amount = 500000 // If this reaches 60% of plot price, status = "Sold"
};
```

### Checking Plot Status
```csharp
// Get payment percentage
var percentage = await plotStatusService.GetPlotPaymentPercentageAsync(plotId);

// Calculate current status
var status = await plotStatusService.CalculatePlotStatusAsync(plotId);
```

## Benefits

1. **Automated Management**: No manual status updates needed
2. **Accurate Tracking**: Real-time payment and status tracking  
3. **Token Protection**: Prevents overbooking with token system
4. **Business Logic**: Enforces 60% payment rule for sold status
5. **Audit Trail**: Complete history of status changes

This system ensures accurate plot status management while automating the complex business rules around tokens, bookings, and sales completion.