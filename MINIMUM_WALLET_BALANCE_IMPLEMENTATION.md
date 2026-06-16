# Driver Minimum Wallet Balance (₹500) Implementation

## Task Completed
Enforced minimum wallet balance of ₹500 for drivers. Before accepting a trip, the system verifies that the driver has at least ₹500 balance in their wallet (reserved for potential cancellation fees). Commission is paid via PhonePe gateway, NOT deducted from wallet.

## Payment Flow

### Commission Payment
- **Paid via**: PhonePe gateway (UPI)
- **Wallet deduction**: NO deduction from wallet
- **When**: Only when commission amount > 0

### Cancellation Fee
- **Paid via**: Wallet deduction
- **When**: Driver cancels a trip
- **Minimum required**: ₹500 must remain in wallet

## How It Works

### Pre-Acceptance Check
1. Driver views trip details and clicks "Accept Trip" or "Pay Commission & Accept Trip"
2. System checks if: `currentBalance >= ₹500`
3. If YES: Proceeds with PhonePe payment for commission (if needed) and trip acceptance
4. If NO: Shows warning alert to add funds to wallet, trip NOT accepted

### Balance Calculation
```javascript
const MIN_WALLET_BALANCE = 500;
const hasMinimumBalance = (wallet?.balance || 0) >= MIN_WALLET_BALANCE;
```

## Files Modified

### 1. **TripDetailScreen.js** (Main Implementation)
Location: `src/screens/driver/TripDetailScreen.js`

**Changes:**
- Added `MIN_WALLET_BALANCE = 500` constant
- Removed all wallet deduction logic for commission
- Updated `acceptTripAfterPayment()`: Only marks commission as paid, does NOT deduct from wallet
- Updated `handlePayCommission()`: Checks if wallet has minimum ₹500 before accepting
- Updated `handlePayWithGateway()`: Checks minimum balance before initiating PhonePe payment
- Alert messages explain that minimum balance is for cancellation fees

**Key Logic:**
```javascript
// Accept trip - commission is paid via PhonePe, not wallet
async function acceptTripAfterPayment() {
  // Mark commission as paid (payment happened via gateway, not wallet)
  const { error: markErr } = await supabase
    .from('trips')
    .update({ commission_paid: true })
    .eq('id', trip.id);
  
  // Accept trip using atomic RPC function
  const result = await acceptTrip(trip.id, user.id);
  return result;
}

// Check minimum balance before accepting
if (!hasMinimumBalance) {
  Alert.alert(
    '⚠️ Minimum Balance Required',
    `Your wallet must have at least ₹${MIN_WALLET_BALANCE} balance (for potential cancellation fees). Current: ₹${(wallet?.balance || 0).toFixed(2)}. Please add funds first.`,
    [{ text: 'OK' }]
  );
  return;
}
```

### 2. **tripService.js** (No Change)
Location: `src/services/tripService.js`

**Status:** Already correct
- Passes `p_min_balance: 0` because balance check is done in TripDetailScreen before calling
- Commission NOT deducted from wallet

### 3. **constants.js** (Already Set)
Location: `packages/shared/src/constants.js`

**Status:** Already correct
- `MIN_WALLET_BALANCE = 500` is defined

### 4. **WalletScreen.js** (Already Implemented)
Location: `src/screens/driver/WalletScreen.js`

**Status:** Already has minimum balance warning
- Shows warning message when balance < ₹500
- Displays current balance with orange warning color

## User Experience Examples

### Scenario 1: Trip with Commission (Balance OK)
- Current wallet: ₹800
- Commission: ₹200 (paid via PhonePe)
- Result: ✅ ACCEPTED
  - Commission paid via UPI payment app
  - Wallet balance remains ₹800
  - Trip accepted and customer details unlocked

### Scenario 2: Trip with Commission (Balance Below Minimum)
- Current wallet: ₹400
- Commission: ₹200 (would be paid via PhonePe)
- Result: ❌ REJECTED
  - Alert: "Your wallet must have at least ₹500 balance (for potential cancellation fees). Current: ₹400.00. Please add funds first."
  - Trip NOT accepted
  - Commission NOT charged yet

### Scenario 3: Trip with No Commission (Sufficient Balance)
- Current wallet: ₹600
- Commission: ₹0
- Result: ✅ ACCEPTED
  - Confirmation dialog shown
  - Trip accepted, customer details unlocked

### Scenario 4: Trip with No Commission (Low Balance)
- Current wallet: ₹400
- Commission: ₹0
- Result: ❌ REJECTED
  - Alert shown when clicking "Accept Trip"
  - Wallet must reach ₹500 minimum

## Cancellation Fee Logic (Future)
- When driver cancels: Check wallet has enough for cancellation fee
- If sufficient: Deduct from wallet
- If insufficient: Show error, don't allow cancellation (driver must add funds)
- Wallet balance must never fall below ₹0

## Testing Checklist
- [ ] Driver with ₹400 balance tries to accept trip → rejected with minimum balance alert
- [ ] Driver with ₹600 balance accepts trip with ₹200 commission → accepted, wallet stays ₹600
- [ ] Driver with ₹500 balance accepts trip with ₹0 commission → accepted
- [ ] Driver with ₹400 balance tries to accept trip with ₹0 commission → rejected
- [ ] WalletScreen shows warning when balance < ₹500
- [ ] Commission displayed correctly in trip cards (shows earnings, not affected by ₹500 check)

## Key Points
- **Commission paid via**: PhonePe gateway UPI only
- **Wallet deduction**: Only for cancellation fees (when driver cancels)
- **Minimum balance check**: Before accepting trip to ensure ₹500 available for cancellation fees
- **Wallet balance change**: Only happens when:
  1. Driver cancels trip (cancellation fee deducted)
  2. Driver gets earnings from completed trip (if implemented)
  3. Driver manually deposits funds
  4. System refunds or adjusts balance

