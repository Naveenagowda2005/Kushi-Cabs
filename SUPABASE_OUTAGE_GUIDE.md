# Supabase Technical Issue - Troubleshooting Guide

## Current Status
Supabase cloud service is experiencing technical difficulties. The app cannot connect to the database (profile fetch timeout).

---

## Quick Fixes (Try These First)

### Option 1: Wait & Retry (5-10 minutes)
Supabase outages are usually temporary. 

1. Stop both servers (Ctrl+C)
2. Wait 5-10 minutes
3. Restart both servers
4. Try again

---

### Option 2: Check Supabase Status Page
Visit: **https://status.supabase.com/**

Look for:
- ✅ All Green = Service is OK (issue is elsewhere)
- ⚠️ Yellow/Red = There's an ongoing incident

---

### Option 3: Switch to Render Backend (Temporary)
The Render backend also uses the same Supabase cloud, so this won't help immediately. But you can try:

1. Change `.env`:
   ```
   EXPO_PUBLIC_SMS_API_URL='https://kushi-cabs.onrender.com'
   ```

2. Restart Expo: Press `q`, then `npm start -- --clear`

This uses the cloud Render backend instead, but database queries still go to Supabase cloud.

---

## Long-Term Solutions

### Option A: Local Supabase (Recommended for Development)
Set up Supabase locally using Docker:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase init

# Start local Supabase
supabase start

# Update .env to use local Supabase
EXPO_PUBLIC_SUPABASE_URL='http://localhost:54321'
```

**Pros**: 
- No external dependency
- Faster development
- Can work offline

**Cons**: 
- Requires Docker setup
- Initial setup time

---

### Option B: Supabase Regional Failover
If Supabase has regional issues:

1. Check your region: https://supabase.com/docs/guides/platform/performance#regions
2. Contact Supabase support if outage is prolonged
3. Consider backup database for production

---

## Error Analysis

### "Profile fetch timed out"
```
ERROR  fetchUserProfile: Exception: Profile fetch timed out
```

**Cause**: 
- Supabase server not responding
- Network connectivity issue
- Database query hanging

**Affected**:
- User login
- Profile fetching
- Any Supabase queries

---

## Workaround: Test Locally Without Database

If you need to continue development without Supabase:

### 1. Mock Data Approach
Create mock user/trip data in AuthContext:

```javascript
// In AuthContext.js - Temporary mock
const mockUser = {
  id: 'test-user-123',
  email: 'driver@test.com',
  full_name: 'Test Driver',
  phone: '9876543210',
  roles: { name: 'driver' }
};

// Use mock instead of fetching from Supabase
```

### 2. Offline Mode
- Skip authentication
- Use local AsyncStorage for state
- Test UI without backend

---

## Monitoring Supabase

### Check Service Health
```bash
# Test connection
curl https://vofupwsnbcidjnifaihm.supabase.co/rest/v1/

# Expected: Auth error (which means service is up)
# Not expected: Connection timeout or 503
```

### View Supabase Logs
1. Go to: https://app.supabase.com/
2. Project: Look for incident notifications
3. Check Status page for updates

---

## Communication

### Notify Your Team
- Create status channel message
- "Supabase experiencing technical issues, ETA: [time]"
- Switch testing to local/mock data

### Check Incident Timeline
Supabase status: https://status.supabase.com/

---

## Temporary Workaround Code

If you want to continue testing UI without database:

**Create mock user in AuthContext.js**:
```javascript
const mockUser = {
  id: 'mock-driver',
  email: 'test@example.com',
  full_name: 'Test Driver',
  phone: '+919876543210',
  roles: { name: 'driver' },
  is_active: true
};

// In fetchUserProfile catch block:
if (error) {
  console.warn('Using mock user due to Supabase outage');
  setUser(mockUser);
  setSelectedRole('driver');
  setLoading(false);
}
```

This allows UI testing while database is down.

---

## Prevention for Future

### 1. Add Retry Logic
```javascript
// Retry fetch with exponential backoff
const retryFetch = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
};
```

### 2. Monitor Health Endpoint
```javascript
const checkSupabaseHealth = async () => {
  try {
    const response = await fetch('https://vofupwsnbcidjnifaihm.supabase.co/rest/v1/');
    return response.status < 500;
  } catch {
    return false;
  }
};
```

### 3. Graceful Degradation
- Show "Offline" mode banner
- Enable limited functionality
- Queue requests for later

---

## Timeline

| Time | Action |
|------|--------|
| Now | Check Supabase status page |
| +5 min | If not resolved, try restart |
| +15 min | If still down, switch to mock data |
| +30 min | Contact Supabase support if critical |
| +60 min | Consider local Supabase setup |

---

## Next Steps

1. ✅ Check https://status.supabase.com/
2. ✅ Wait 5-10 minutes for automatic recovery
3. ⏳ If still down, restart servers
4. 🔄 If persists, implement local Supabase or mock data

**This is temporary.** Supabase typically recovers within 15 minutes.

---

## Resources

- Supabase Status: https://status.supabase.com/
- Supabase Docs: https://supabase.com/docs
- Local Supabase: https://supabase.com/docs/guides/local-development
- Support: https://supabase.com/support

---

**Last Updated**: July 5, 2026  
**Status**: Awaiting Supabase Recovery  
**Action**: Check status page and wait ~10 minutes
