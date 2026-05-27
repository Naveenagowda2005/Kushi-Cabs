# 🌐 Remote Access Guide for NewTaxi Apps

## Current Running Apps
- **Vendor App**: Port 8081
- **Driver App**: Port 8082  
- **Super Admin**: Port 8085

## Method 1: Mobile Hotspot (Recommended)
1. **Create hotspot** on your computer
2. **Connect remote phone** to the hotspot
3. **Use Expo Go** with: `exp://192.168.1.115:8081`

## Method 2: Port Forwarding
1. **Access router settings** (usually 192.168.1.1)
2. **Forward ports**:
   - 8081 → 192.168.1.115:8081 (Vendor)
   - 8082 → 192.168.1.115:8082 (Driver)
   - 8085 → 192.168.1.115:8085 (Super Admin)
3. **Find public IP**: whatismyipaddress.com
4. **Use**: `exp://YOUR_PUBLIC_IP:8081`

## Method 3: TeamViewer/AnyDesk
1. **Install TeamViewer** on both devices
2. **Remote control** your computer
3. **Use Expo Go** on the computer

## Method 4: Cloud Deployment
- Deploy to Vercel/Netlify for web access
- Use EAS Build for native app distribution

## Current Status
✅ All apps running locally
✅ Mobile responsive
✅ Database connected
✅ Authentication working

## Quick Test URLs
- Vendor: exp://192.168.1.115:8081
- Driver: exp://192.168.1.115:8082
- Super Admin: exp://192.168.1.115:8085