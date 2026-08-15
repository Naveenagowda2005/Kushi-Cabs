const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function setupSuperAdmin() {
  console.log('🚀 Setting up Super Admin...\n');

  try {
    // Step 1: Add super_admin role if it doesn't exist
    console.log('1️⃣ Adding super_admin role...');
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('roles')
      .select('*')
      .eq('name', 'super_admin')
      .single();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking roles:', roleCheckError.message);
      return;
    }

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('roles')
        .insert({ name: 'super_admin' });

      if (roleError) {
        console.error('❌ Error adding super_admin role:', roleError.message);
        return;
      }
      console.log('✅ Super admin role added successfully');
    } else {
      console.log('✅ Super admin role already exists');
    }

    // Step 2: Get the super_admin role ID
    const { data: superAdminRole, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'super_admin')
      .single();

    if (roleError) {
      console.error('❌ Error fetching super_admin role:', roleError.message);
      return;
    }

    console.log(`✅ Super admin role ID: ${superAdminRole.id}\n`);

    // Step 3: Create Super Admin auth user
    console.log('2️⃣ Creating Super Admin auth user...');
    
    // First check if the user already exists
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const adminExists = existingAuthUser?.users?.find(u => u.email === 'admin@newtaxi.com');

    let authUserId;
    
    if (adminExists) {
      console.log('✅ Super Admin auth user already exists');
      authUserId = adminExists.id;
    } else {
      // Create the auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'admin@newtaxi.com',
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Super Admin'
        }
      });

      if (authError) {
        console.error('❌ Error creating Super Admin auth user:', authError.message);
        return;
      }

      authUserId = authUser.user.id;
      console.log('✅ Super Admin auth user created successfully');
    }

    // Step 4: Create user profile
    console.log('3️⃣ Creating Super Admin profile...');
    
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileCheckError.message);
      return;
    }

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          phone: '+1234567890',
          full_name: 'Super Admin',
          role_id: superAdminRole.id,
          is_active: true
        });

      if (profileError) {
        console.error('❌ Error creating Super Admin profile:', profileError.message);
        return;
      }
      console.log('✅ Super Admin profile created successfully');
    } else {
      console.log('✅ Super Admin profile already exists');
    }

    console.log('\n🎉 Super Admin setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@newtaxi.com');
    console.log('   Password: admin123');
    console.log('\n🔗 You can now login to the Super Admin app');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

setupSuperAdmin();