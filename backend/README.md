# Taxi SMS Backend

This backend service provides a lightweight SMS relay for the Taxi app using an STPL SMS gateway.
It exposes a small HTTP API for sending messages and OTP codes.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your STPL credentials and optional sender configuration.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the server:

```bash
npm start
```

## API Endpoints

### Health check
GET `/health`

### Send SMS
POST `/sms/send`

Body:
```json
{
  "to": "919876543210",
  "message": "Hello from Taxi backend",
  "senderId": "YOURSR"
}
```

### Send OTP
POST `/sms/otp`

Body:
```json
{
  "to": "919876543210"
}
```

### Verify OTP
POST `/sms/verify`

Body:
```json
{
  "to": "919876543210",
  "otp": "123456"
}
```

## STPL Integration

The backend is configured through environment variables in `.env`.
The default `STPL_API_URL` points to a common STPL send endpoint.
If your STPL API uses different parameter names, adjust the `STPL_API_QUERY_*` values.

## Notes

- OTP storage is in-memory and suitable for development or small deployments only.
- Use HTTPS/SSL and secure network configuration for production.
- If STPL requires a POST body rather than query parameters, update `services/stplSmsService.js` accordingly.
