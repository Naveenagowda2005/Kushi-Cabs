import { supabase } from '../lib/supabase';

export const seedSampleData = async () => {
  try {
    console.log('Starting to seed sample data...');

    const vendorUsers = [
      { id: '11111111-1111-1111-1111-111111111111', phone: '1234567890', full_name: 'ABC Taxi Company', role_id: 2, is_active: true, email: 'abc@taxi.com' },
      { id: '22222222-2222-2222-2222-222222222222', phone: '1234567891', full_name: 'XYZ Transport', role_id: 2, is_active: true, email: 'xyz@transport.com' },
      { id: '33333333-3333-3333-3333-333333333333', phone: '1234567892', full_name: 'City Cabs', role_id: 2, is_active: false, email: 'city@cabs.com' }
    ];

    const driverUsers = [
      { id: '44444444-4444-4444-4444-444444444444', phone: '1234567893', full_name: 'John Driver', role_id: 3, is_active: true, email: 'john@driver.com' },
      { id: '55555555-5555-5555-5555-555555555555', phone: '1234567894', full_name: 'Mike Smith', role_id: 3, is_active: true, email: 'mike@driver.com' },
      { id: '66666666-6666-6666-6666-666666666666', phone: '1234567895', full_name: 'Sarah Johnson', role_id: 3, is_active: false, email: 'sarah@driver.com' },
      { id: '77777777-7777-7777-7777-777777777777', phone: '1234567896', full_name: 'David Wilson', role_id: 3, is_active: true, email: 'david@driver.com' },
      { id: '88888888-8888-8888-8888-888888888888', phone: '1234567897', full_name: 'Lisa Brown', role_id: 3, is_active: true, email: 'lisa@driver.com' }
    ];

    const allUsers = [...vendorUsers, ...driverUsers];
    for (const user of allUsers) {
      const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
      if (error) console.log(`User ${user.full_name} might already exist:`, error.message);
      else console.log(`Created user: ${user.full_name}`);
    }

    const vendors = [
      { user_id: '11111111-1111-1111-1111-111111111111', company_name: 'ABC Taxi Company', commission_pct: 12.00 },
      { user_id: '22222222-2222-2222-2222-222222222222', company_name: 'XYZ Transport', commission_pct: 10.00 },
      { user_id: '33333333-3333-3333-3333-333333333333', company_name: 'City Cabs', commission_pct: 15.00 }
    ];

    for (const vendor of vendors) {
      const { error } = await supabase.from('vendors').upsert(vendor, { onConflict: 'user_id' });
      if (error) console.log(`Vendor ${vendor.company_name} might already exist:`, error.message);
      else console.log(`Created vendor: ${vendor.company_name}`);
    }

    const drivers = [
      { user_id: '44444444-4444-4444-4444-444444444444', license_number: 'DL123456789', vehicle_number: 'MH01AB1234', is_available: true },
      { user_id: '55555555-5555-5555-5555-555555555555', license_number: 'DL987654321', vehicle_number: 'MH01CD5678', is_available: true },
      { user_id: '66666666-6666-6666-6666-666666666666', license_number: 'DL456789123', vehicle_number: 'MH01EF9012', is_available: false },
      { user_id: '77777777-7777-7777-7777-777777777777', license_number: 'DL789123456', vehicle_number: 'MH01GH3456', is_available: true },
      { user_id: '88888888-8888-8888-8888-888888888888', license_number: 'DL321654987', vehicle_number: 'MH01IJ7890', is_available: true }
    ];

    for (const driver of drivers) {
      const { error } = await supabase.from('drivers').upsert(driver, { onConflict: 'user_id' });
      if (error) console.log(`Driver profile might already exist:`, error.message);
      else console.log(`Created driver profile for: ${driver.license_number}`);
    }

    const trips = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        driver_id: '44444444-4444-4444-4444-444444444444',
        vendor_id: '11111111-1111-1111-1111-111111111111',
        pickup_location: 'Airport', dropoff_location: 'City Center',
        fare_amount: 250.00, status: 'completed',
        scheduled_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        driver_id: '55555555-5555-5555-5555-555555555555',
        vendor_id: '11111111-1111-1111-1111-111111111111',
        pickup_location: 'Mall', dropoff_location: 'Railway Station',
        fare_amount: 180.00, status: 'completed',
        scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        driver_id: '77777777-7777-7777-7777-777777777777',
        vendor_id: '22222222-2222-2222-2222-222222222222',
        pickup_location: 'Hotel', dropoff_location: 'Airport',
        fare_amount: 300.00, status: 'pending',
        scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const trip of trips) {
      const { error } = await supabase.from('trips').upsert(trip, { onConflict: 'id' });
      if (error) console.log(`Trip might already exist:`, error.message);
      else console.log(`Created trip: ${trip.pickup_location} to ${trip.dropoff_location}`);
    }

    console.log('Sample data seeding completed!');
    return { success: true, message: 'Sample data created successfully!' };
  } catch (error) {
    console.error('Error seeding sample data:', error);
    return { success: false, message: error.message };
  }
};

export const checkExistingData = async () => {
  try {
    const [vendorsResult, driversResult, tripsResult] = await Promise.all([
      supabase.from('users').select('id').eq('role_id', 2).limit(1),
      supabase.from('users').select('id').eq('role_id', 3).limit(1),
      supabase.from('trips').select('id').limit(1)
    ]);
    return {
      hasVendors: (vendorsResult.data?.length || 0) > 0,
      hasDrivers: (driversResult.data?.length || 0) > 0,
      hasTrips: (tripsResult.data?.length || 0) > 0
    };
  } catch (error) {
    console.error('Error checking existing data:', error);
    return { hasVendors: false, hasDrivers: false, hasTrips: false };
  }
};
