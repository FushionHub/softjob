# API Reference

Comprehensive reference for all REST endpoints in the Emporium Capitals application.

---

## 1. Market Data & Pricing

### `GET /api/prices`
Fetches real-time crypto prices, 24-hour changes, and market ticker statistics.
- **Access**: Public
- **Headers**: `Cache-Control: no-store`
- **Response**:
```json
{
  "prices": {
    "BTC": 83699.99,
    "ETH": 2700.00,
    "SOL": 119.40,
    "USDT": 1
  },
  "changes": {
    "BTC": -0.068,
    "ETH": 0.431
  },
  "tickers": {
    "BTC": {
      "symbol": "BTCUSDT",
      "shortName": "BTC",
      "name": "Bitcoin",
      "price": 83699.99,
      "priceChangePercent": -0.068,
      "priceChange": -57.22,
      "highPrice": 84563.99,
      "lowPrice": 82775.94,
      "bidPrice": 83699.99,
      "askPrice": 83700.00,
      "spread": 0.01,
      "volume": 13460.33,
      "quoteVolume": 1125725263.01,
      "updatedAt": 1790708843039
    }
  },
  "source": "https://data-api.binance.vision",
  "timestamp": 1790708843039
}
```

---

## 2. Trading Operations

### `POST /api/trade`
Opens a new binary contract (Call or Put) on a supported asset.
- **Access**: Authenticated User (`user_token` cookie)
- **Body**:
```json
{
  "asset": "BTCUSD",
  "type": "call",
  "amount": 100,
  "duration": "1m",
  "idempotencyKey": "tr_1790708843000_abc12"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Trade opened successfully (live price)",
  "entryPrice": 83699.99
}
```

### `GET /api/trade`
Retrieves recent trades for the authenticated user and automatically settles any expired positions.
- **Access**: Authenticated User
- **Response**:
```json
{
  "trades": [
    {
      "id": 14,
      "user_id": 3,
      "asset": "BTCUSD",
      "type": "call",
      "amount": "100.00",
      "entry_price": "83650.00",
      "exit_price": "83710.20",
      "profit": "85.00",
      "status": "closed",
      "duration": "1m",
      "datetime": "2026-09-29T19:40:00.000Z",
      "closed_at": "2026-09-29T19:41:00.000Z"
    }
  ]
}
```

---

## 3. Instant Crypto Swap

### `POST /api/swap`
Converts one cryptocurrency or stablecoin to another using real-time market rates.
- **Access**: Authenticated User
- **Body**:
```json
{
  "fromAsset": "USDT",
  "toAsset": "BTC",
  "amount": 1000
}
```
- **Response**:
```json
{
  "success": true,
  "fromAsset": "USDT",
  "toAsset": "BTC",
  "amount": 1000,
  "rate": 0.00001194,
  "targetAmount": 0.01194743
}
```

---

## 4. Authentication

### `POST /api/auth/register`
Creates a new customer account.
- **Access**: Public
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!"
}
```
- **Responses**:
  - `201 Created`: Account created, session cookie set.
  - `409 Conflict`: Detailed error indicating whether email or username is taken.

### `POST /api/auth/login`
Authenticates user and issues a signed JWT in an `HttpOnly` cookie.
- **Access**: Public
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```
- **Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "redirect": "/dashboard"
}
```

### `GET /api/user/me`
Fetches current authenticated user profile and account balance.
- **Access**: Authenticated User
- **Response**:
```json
{
  "id": 3,
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "balance": "1250.00",
  "total_profit": "340.00",
  "role": "user"
}
```

---

## 5. Deposits & Wallets

### `GET /api/wallets`
Returns configured deposit wallet addresses and network protocols.
- **Access**: Public or Authenticated
- **Response**:
```json
{
  "wallets": [
    { "currency": "USDT", "network": "TRC20", "address": "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb" },
    { "currency": "BTC", "network": "Bitcoin", "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" },
    { "currency": "ETH", "network": "ERC20", "address": "0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2" }
  ]
}
```

### `POST /api/deposit/proof`
Submits deposit transaction proof (hash/receipt).
- **Access**: Authenticated User

---

## 6. Admin Desk (`/api/admin/*`)

All `/api/admin/*` endpoints require a valid `admin_token` signed JWT cookie.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Admin login |
| `POST` | `/api/admin/auth/logout` | Clears admin session |
| `GET` | `/api/admin/auth/me` | Current admin profile |
| `GET` | `/api/admin/users` | List all users with balances and KYC statuses |
| `PATCH` | `/api/admin/users/[id]/balance` | Manually credit/debit user balance |
| `GET` | `/api/admin/deposits` | Review pending deposits |
| `PATCH` | `/api/admin/deposits/[id]` | Approve or reject deposit |
| `GET` | `/api/admin/withdrawals` | Review pending withdrawals |
| `PATCH` | `/api/admin/withdrawals/[id]` | Approve or reject withdrawal |
| `GET` | `/api/admin/kyc` | Review submitted identity verifications |
| `PATCH` | `/api/admin/kyc/[id]` | Approve or reject KYC documents |
| `GET` | `/api/admin/trades` | Global trading log across all users |
| `GET` | `/api/admin/settings` | Platform global configuration |
