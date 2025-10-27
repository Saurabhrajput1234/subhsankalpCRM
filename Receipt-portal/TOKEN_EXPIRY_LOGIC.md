# Token Expiry Logic Implementation

## Overview
This document describes the automatic token expiry system implemented in the real estate management system.

## Business Logic

### Token Lifecycle
1. **Token Creation**: Associate creates a token receipt with expiry date
2. **Token Approval**: Admin approves the token → Plot status becomes "Tokened"
3. **Token Expiry Check**: System automatically checks for expired tokens every hour
4. **Token Expiry**: If token expires without booking → Receipt status becomes "Expired", Plot status becomes "Available"

### Key Rules
- **Token Never Expires if Booking Exists**: If a booking receipt is created after token approval, the token will never expire
- **Only Approved Tokens Can Expire**: Pending or rejected tokens are not processed for expiry
- **Plot Status Update**: When token expires, plot automatically moves from "Tokened" to "Available"
- **Received Amount Recalculation**: Expired receipts are excluded from plot's received amount calculation

## Implementation Components

### 1. Background Service
- **File**: `Services/TokenExpiryBackgroundService.cs`
- **Frequency**: Runs every hour
- **Function**: Automatically processes expired tokens

### 2. Manual Processing
- **Endpoint**: `POST /api/receipts/process-expired-tokens`
- **Access**: Admin only
- **Function**: Manually trigger token expiry processing

### 3. API Endpoints
- `GET /api/receipts/expired-tokens` - Get all expired token receipts
- `GET /api/receipts/expiring-tokens?days=7` - Get tokens expiring in next N days
- `POST /api/receipts/process-expired-tokens` - Manually process expired tokens

### 4. Frontend Features
- **Dashboard Alert**: Shows expired token count with manual processing button
- **Status Filter**: "Expired" option in receipts filter
- **Status Badge**: Red "Expired" badge for expired token receipts

## Database Changes
- **Receipt.Status**: New "Expired" status added
- **Automatic Updates**: Background service updates receipt status and plot status

## Logging
- All token expiry operations are logged with INFO level
- Includes receipt IDs, plot numbers, and status changes
- Error handling with detailed error logging

## Testing Scenarios

### Scenario 1: Token Expires Normally
1. Create token receipt → Approve → Wait for expiry date
2. **Expected**: Receipt status = "Expired", Plot status = "Available"

### Scenario 2: Token with Booking (Should Not Expire)
1. Create token receipt → Approve → Create booking receipt → Wait for token expiry date
2. **Expected**: Token remains "Approved", Plot status = "Booked"/"Sold"

### Scenario 3: Manual Processing
1. Admin clicks "Process Expired Tokens" button
2. **Expected**: All eligible expired tokens processed immediately

## Configuration
- **Check Interval**: 1 hour (configurable in `TokenExpiryBackgroundService.cs`)
- **Grace Period**: None (expires exactly at expiry date/time)
- **Time Zone**: UTC (all dates stored in UTC)