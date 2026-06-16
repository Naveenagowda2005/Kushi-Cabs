# Wallet Deposit Feature - Driver Guide

## How Driver Adds Funds to Wallet

### Step-by-Step Process

1. **Open Wallet Screen**
   - Navigate to "Wallet" tab from driver dashboard
   - See current wallet balance prominently displayed

2. **Click "Add Funds" Button**
   - Button appears in the balance card
   - Opens a deposit modal

3. **Select Deposit Amount**
   - **Option A**: Enter custom amount in text field
     - Minimum: ₹100
     - Maximum: No limit
   - **Option B**: Tap quick amount buttons
     - ₹100
     - ₹200
     - ₹500
     - ₹1000

4. **Confirm Payment Method**
   - Currently supports: **PhonePe** (UPI)
   - Future support: Razorpay, Bank Transfer, etc.

5. **Click "Deposit" Button**
   - Initiates payment
   - PhonePe app opens automatically

6. **Complete Payment**
   - PhonePe UPI app opens with amount pre-filled
   - Complete payment as usual using bank account
   - Return to taxi app after payment

7. **Confirmation**
   - Success message shown
   - Wallet balance updated immediately
   - Transaction recorded in history

## Implementation Details

### Files Modified
- **src/screens/driver/WalletScreen.js** - Main deposit UI and logic

### Key Features

#### "Add Funds" Button
```javascript
<TouchableOpacity 
  style={styles.actionBtn}
  onPress={() => setDepositModalVisible(true)}
>
  <Ionicons name="add-circle-outline" size={18} color="#4caf50" />
  <Text style={styles.actionBtnText}>Add Funds</Text>
</TouchableOpacity>
```

#### Deposit Modal
- Bottom sheet overlay with dark theme
- Amount input field (decimal keyboard)
- Quick amount buttons for common deposits
- PhonePe payment method selection
- Deposit button with loading state

#### Payment Flow
```javascript
async function handleDeposit() {
  // 1. Validate amount (min ₹100)
  // 2. Call initiateDeposit() with PhonePe gateway
  // 3. PhonePe app opens automatically
  // 4. User completes payment
  // 5. Wallet balance updates
  // 6. Transaction recorded
}
```

### Payment Gateways

#### PhonePe (Primary)
- Uses UPI deep link
- Opens any UPI app installed on device
- Pre-fills amount and merchant details
- Supports all UPI-compatible banks
- No additional authentication needed (user's existing UPI setup)

#### Razorpay (Future)
- Fallback option if implemented
- Handles various payment methods

### User Experience

#### Success Flow
1. Driver enters amount
2. Clicks "Deposit ₹XXX"
3. PhonePe app opens
4. Driver completes payment
5. Returns to app
6. Success alert: "✅ Deposit Successful - ₹XXX added to your wallet!"
7. Balance updates immediately

#### Error Handling
- Invalid amount: Alert "Invalid Amount"
- Below minimum: Alert "Minimum deposit is ₹100"
- Payment cancelled: Alert "Deposit Failed - Please try again"
- No UPI app: Alert "No UPI app found. Please install PhonePe, Google Pay, Paytm, etc."

### Transaction Recording

Each deposit creates:
- **Payment Order** record in `payment_orders` table
  - user_id
  - type: 'deposit'
  - amount: deposit amount
  - status: 'pending' → 'success'
  - gateway: 'phonepe'
  - phonepe_order_id: auto-generated

- **Transaction** record in `transactions` table (via RPC)
  - wallet_id
  - type: 'credit'
  - amount: deposit amount
  - description: 'Wallet deposit'

- **Wallet** update
  - balance increases by deposit amount

### Minimum Balance Requirement

The ₹500 minimum wallet balance works with deposits:

**Scenario 1**: Driver has ₹300 balance
- Cannot accept trips (requires ₹500 minimum)
- Deposits ₹200 via "Add Funds"
- New balance: ₹500
- Can now accept trips

**Scenario 2**: Driver has ₹0 balance
- Cannot accept trips
- Taps "Add Funds" 
- Deposits ₹500
- Can immediately accept trips

## Testing Checklist

- [ ] "Add Funds" button visible in wallet balance card
- [ ] Deposit modal opens when button tapped
- [ ] Custom amount input works (accepts decimals)
- [ ] Quick amount buttons populate amount field
- [ ] Amount validation: rejects values < ₹100
- [ ] PhonePe payment opens when "Deposit" tapped
- [ ] PhonePe UPI link has correct amount pre-filled
- [ ] After payment completion, wallet balance updates
- [ ] Transaction appears in history
- [ ] Low balance warning still shows if balance < ₹500
- [ ] Driver can accept trips after balance reaches ₹500
- [ ] Modal closes after successful deposit
- [ ] Modal closes after cancelling
- [ ] Loading state shows during payment initiation

## Security Notes

- PhonePe uses standard UPI protocol
- All transactions recorded in database
- User's bank credentials handled by PhonePe app, not our app
- Each transaction has unique order ID for verification
- Wallet balance only updates after successful payment

## Future Enhancements

1. **Razorpay Support** - Alternative payment gateway
2. **Bank Transfer** - Direct bank account linking for faster deposits
3. **Recurring Deposits** - Auto-top-up when balance falls below threshold
4. **Deposit History** - Detailed view of all deposits
5. **Instant Settlement** - Immediate balance update without manual verification
6. **Transaction Receipt** - Download/share receipt of deposit

