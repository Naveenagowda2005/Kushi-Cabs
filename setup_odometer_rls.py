#!/usr/bin/env python3
"""
Setup Odometer RLS Policies via Supabase Management API

This script creates the 4 required RLS policies for the odometer-images storage bucket.

Usage:
  python3 setup_odometer_rls.py <access_token>

Get access token from: https://app.supabase.com/account/tokens
"""

import requests
import json
import sys

# Configuration
SUPABASE_URL = 'https://cqfsirfjwfxvwggjkrvd.supabase.co'
PROJECT_ID = 'cqfsirfjwfxvwggjkrvd'
API_BASE = 'https://api.supabase.com/v1'
BUCKET_ID = 'odometer-images'

# Policies to create
POLICIES = [
    {
        'name': 'Authenticated users can upload odometer images',
        'action': 'INSERT',
        'roles': ['authenticated'],
        'definition': "bucket_id = 'odometer-images'"
    },
    {
        'name': 'Anyone can view odometer images',
        'action': 'SELECT',
        'roles': ['public'],
        'definition': "bucket_id = 'odometer-images'"
    },
    {
        'name': 'Authenticated users can view odometer images',
        'action': 'SELECT',
        'roles': ['authenticated'],
        'definition': "bucket_id = 'odometer-images'"
    },
    {
        'name': 'Users can delete their own odometer images',
        'action': 'DELETE',
        'roles': ['authenticated'],
        'definition': "bucket_id = 'odometer-images' AND owner_id = auth.uid()"
    }
]

def create_policy(access_token, policy):
    """Create a single RLS policy"""
    url = f"{API_BASE}/projects/{PROJECT_ID}/storage/policies"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'name': policy['name'],
        'definition': policy['definition'],
        'bucket_id': BUCKET_ID,
        'action': policy['action'],
        'roles': policy['roles']
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 201 or response.status_code == 200:
            print(f"✅ Created: {policy['name']}")
            return True
        else:
            print(f"❌ Failed: {policy['name']}")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating policy: {str(e)}")
        return False

def list_policies(access_token):
    """List existing policies for the bucket"""
    url = f"{API_BASE}/projects/{PROJECT_ID}/storage/policies"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    params = {'bucket_id': BUCKET_ID}
    
    try:
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            policies = response.json()
            print(f"\n📋 Existing policies: {len(policies)}")
            for p in policies:
                print(f"  - {p['name']} ({p['action']})")
            return policies
        else:
            print(f"❌ Failed to list policies: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error listing policies: {str(e)}")
        return []

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 setup_odometer_rls.py <access_token>")
        print("\nHow to get access token:")
        print("  1. Go to: https://app.supabase.com/account/tokens")
        print("  2. Create a Personal Access Token")
        print("  3. Copy the token")
        print("  4. Run: python3 setup_odometer_rls.py <token>")
        sys.exit(1)
    
    access_token = sys.argv[1]
    
    print(f"🔧 Odometer RLS Policies Setup")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"Project: {PROJECT_ID}")
    print(f"Bucket: {BUCKET_ID}")
    print(f"API: {API_BASE}\n")
    
    # Check existing policies
    print("📋 Checking existing policies...")
    existing = list_policies(access_token)
    
    # Create new policies
    print(f"\n📝 Creating {len(POLICIES)} policies...\n")
    
    success_count = 0
    for i, policy in enumerate(POLICIES, 1):
        print(f"  [{i}/{len(POLICIES)}] {policy['name']}")
        if create_policy(access_token, policy):
            success_count += 1
        print()
    
    # Summary
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"✅ Result: {success_count}/{len(POLICIES)} policies created")
    
    if success_count == len(POLICIES):
        print("\n🎉 All policies created successfully!")
        print("\n📋 Next steps:")
        print("  1. Verify policies in Dashboard: https://app.supabase.com/")
        print("  2. Storage → odometer-images → Policies tab")
        print("  3. Restart backend: npm start (in backend folder)")
        print("  4. Restart frontend: npm start (in apps/unified)")
        print("  5. Test driver upload in app")
    else:
        print(f"\n⚠️  Only {success_count}/{len(POLICIES)} policies created")
        print("   Check error messages above")
        sys.exit(1)

if __name__ == '__main__':
    main()
