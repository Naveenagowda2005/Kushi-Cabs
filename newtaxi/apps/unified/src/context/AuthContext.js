import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { ROLES, API_CONFIG } from '../constants';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [incompleteSignupPhone, setIncompleteSignupPhone] = useState(null);
  const [incompleteSignupUserId, setIncompleteSignupUserId] = useState(null); // Store auth user ID
  const fetchingRef = React.useRef(false);

  console.log('AuthProvider: Initializing...');

  useEffect(() => {
    console.log('AuthProvider: useEffect starting...');
    
    const initAuth = async () => {
      try {
        console.log('AuthProvider: initAuth starting...');
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log('AuthProvider: Got session result:', { hasSession: !!session, error: error?.message });
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthProvider: Initial session:', !!session);
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setSelectedRole(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('AuthProvider: Exception getting session:', err.message);
        setLoading(false);
      }
    };
    
    initAuth();

    // Listen for auth changes
    try {
      console.log('AuthProvider: Setting up auth listener...');
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthProvider: Auth state change:', event, !!session);
          setSession(session);
          
          if (session?.user) {
            if (event === 'TOKEN_REFRESHED' && fetchingRef.current) return;
            await fetchUserProfile(session.user.id);
          } else {
            console.log('AuthProvider: No session, clearing user and role');
            setUser(null);
            setSelectedRole(null);
            setLoading(false);
          }
        }
      );

      console.log('AuthProvider: Auth listener set up successfully');
      return () => subscription?.unsubscribe();
    } catch (err) {
      console.error('AuthProvider: Error setting up auth listener:', err);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      console.log('Unified fetchUserProfile called for user:', userId);
      fetchingRef.current = true;

      const queryPromise = supabase
        .from('users')
        .select(`
          id,
          email,
          full_name,
          phone,
          role_id,
          is_active,
          push_token,
          created_at,
          roles (
            name
          )
        `)
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 10000)
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('Unified user profile query result:', { data, error: error?.message });

      if (error) {
        console.error('Unified Error fetching user profile:', error);
        setUser(null);
        setLoading(false);
      } else if (data) {
        console.log('Unified setting user profile:', data);
        setUser(data);
        if (data.roles?.name) {
          console.log('Unified auto-selecting role:', data.roles.name);
          setSelectedRole(data.roles.name);
        }
        setLoading(false);
      } else {
        console.log('Unified: No user profile found for authenticated user ID:', userId);
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('Unified fetchUserProfile error:', err.message);
      setUser(null);
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  };

  const refreshUserProfile = async () => {
    if (session?.user?.id) {
      console.log('Unified refreshUserProfile called for user:', session.user.id);
      await fetchUserProfile(session.user.id);
    } else {
      console.log('Unified refreshUserProfile: No session or user ID available');
    }
  };

  const signIn = async (identifier, password, role) => {
    try {
      setLoading(true);
      console.log('Unified AuthContext: Attempting sign in - identifier:', identifier, 'role:', role);
      
      // SUPER_ADMIN uses phone-based OTP authentication (like drivers)
      if (role === ROLES.SUPER_ADMIN) {
        console.log('Super Admin login attempt with phone:', identifier);
        
        // Convert phone to digits only
        const phoneDigits = identifier.replace(/[^0-9]/g, '');
        
        if (phoneDigits.length !== 10) {
          throw new Error('Please enter a valid 10-digit phone number');
        }
        
        console.log('Super Admin: Phone digits:', phoneDigits);
        
        // For super_admin, verify phone exists in database and has super_admin role
        // OTP verification already happened (SMS was verified)
        const { data: adminData, error: adminError } = await supabase
          .from('users')
          .select('id, email, phone, full_name, role_id, roles(name)')
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (adminError && adminError.code !== 'PGRST116') {
          throw adminError;
        }

        if (!adminData) {
          throw new Error('Admin not found. Please check phone number.');
        }

        console.log('Super Admin found in database:', adminData);

        // Verify it's actually a super_admin
        if (adminData.roles?.name !== ROLES.SUPER_ADMIN) {
          throw new Error('This account is not a super admin account.');
        }

        console.log('Super Admin verified - OTP was already verified via SMS');

        // For super admin, we bypass Supabase Auth entirely
        // We set both session and user from database without JWT
        // The session is minimal - just enough for the app to recognize authenticated state
        const mockSession = {
          user: {
            id: adminData.id,
            email: adminData.email,
            phone: adminData.phone,
          },
          access_token: 'super-admin-verified',
          token_type: 'bearer',
        };

        // Set both session and user - this allows app to navigate
        setSession(mockSession);
        setUser(adminData);
        if (adminData.roles?.name) {
          setSelectedRole(adminData.roles.name);
        }
        
        console.log('Super Admin session and user set - redirecting to dashboard');
        
        return { data: { user: adminData, session: mockSession }, error: null };
      }
      
      // For DRIVER or VENDOR - use phone-based OTP email
      console.log('OTP-verified login with phone:', identifier, 'role:', role);
      
      const phoneDigits = identifier.replace(/[^0-9]/g, '');
      const email = `${phoneDigits}@kushicabs.phone`;
      
      console.log('OTP login email:', email);
      
      // Verify user exists in database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, phone, role_id, roles(name)')
        .eq('phone', phoneDigits)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        throw new Error('User not found. Please sign up first.');
      }

      console.log('User found in database:', userData);

      // For drivers, check if documents are approved before allowing login
      if (userData.roles?.name === 'driver') {
        try {
          const { data: verificationStatus, error: verifyError } = await supabase
            .from('driver_verification_status')
            .select('overall_status, all_documents_submitted')
            .eq('driver_id', userData.id)
            .single();
          
          if (verifyError && verifyError.code !== 'PGRST116') {
            throw verifyError;
          }
          
          // Check document verification status
          if (verificationStatus) {
            console.log('Driver verification status:', verificationStatus?.overall_status);
            
            // If documents not yet submitted, block login - they must upload first
            if (!verificationStatus.all_documents_submitted) {
              throw new Error('Please upload your documents first.');
            }
            
            // ALL other statuses (pending_review, approved, rejected) → allow login
            // DriverNavigator will show the correct screen based on status:
            // - pending_review → WaitingForApproval screen
            // - approved       → Driver dashboard
            // - rejected       → WaitingForApproval screen (shows rejected docs to re-upload)
            console.log('Driver login allowed - status:', verificationStatus.overall_status);
          } else {
            // No verification status record - new driver, must upload documents
            throw new Error('Please upload your documents first.');
          }
        } catch (err) {
          if (err.message.includes('Please upload') || err.message.includes('rejected')) {
            throw err;
          }
          console.log('Could not verify document status:', err.message);
        }
      }

      // Authenticate OTP user with Supabase
      console.log('Authenticating OTP user with Supabase');
      
      // Try to sign in with the phone-based email and temporary password
      const tempPassword = 'OTP-' + phoneDigits + '-kushicabs';
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });
      
      if (signInError) {
        console.error('Auth sign in failed:', signInError.message);
        throw new Error('Authentication failed. Please try again.');
      }
      
      if (signInData?.session) {
        console.log('OTP user authenticated successfully');
        setSession(signInData.session);
        setUser(userData);
        if (userData.roles?.name) {
          setSelectedRole(userData.roles.name);
        }
        return { data: signInData, error: null };
      }
      
      throw new Error('Authentication failed. Please try again.');
    } catch (error) {
      console.error('Unified Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (identifier, password, role) => {
    try {
      setLoading(true);
      console.log('Unified AuthContext: Attempting sign up with:', identifier, 'role:', role);

      if (role !== ROLES.SUPER_ADMIN) {
        const phoneDigits = identifier.replace(/[^0-9]/g, '');

        // Check if this phone number is already fully registered in DB
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, phone, roles(name)')
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;

        if (existingUser) {
          throw new Error(
            `This phone number is already registered as ${existingUser.roles?.name || 'a user'}. Please login instead.`
          );
        }

        // Use backend to create/reset the auth account with a KNOWN password
        console.log('Calling backend to create/reset auth account...');
        const response = await fetch(`${API_CONFIG.SMS_API_URL}/admin/create-driver-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneDigits }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to create account');
        }

        console.log('✅ Auth account ready. userId:', result.userId);

        // Now sign in with the known password the backend set
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: `OTP-${phoneDigits}-kushicabs`,
        });

        if (signInError) throw signInError;

        console.log('✅ Signed in successfully after account creation');

        // Store everything needed for profile creation
        setSession(signInData.session);
        setIncompleteSignupUserId(signInData.user.id);

        return { data: signInData, error: null };
      }

      // Super Admin path (email-based)
      const { data, error } = await supabase.auth.signUp({ email: identifier, password });
      if (error) throw error;
      return { data, error: null };

    } catch (error) {
      console.error('Unified Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      setSelectedRole(null);
      console.log('Unified: Successfully signed out and cleared state');
    } catch (error) {
      console.error('Unified Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearRoleSelection = () => {
    console.log('Unified: Clearing role selection');
    setSelectedRole(null);
  };

  const createUserProfile = async (userData, role) => {
    try {
      console.log('Unified createUserProfile: Starting profile creation for role:', role);

      const userId = session?.user?.id || incompleteSignupUserId;
      if (!userId) throw new Error('No authenticated user - please try signing up again');

      const phone = userData.phone || incompleteSignupPhone || '';
      const email = session?.user?.email || `${phone}@kushicabs.phone`;

      console.log('Unified createUserProfile: userId:', userId, 'phone:', phone);

      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError) throw roleError;

      const { data, error } = await supabase
        .from('users')
        .upsert(
          { id: userId, email, role_id: roleData.id, full_name: userData.full_name, phone, is_active: true },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      console.log('Unified createUserProfile: User profile upserted:', data);

      if (role === ROLES.VENDOR) {
        console.log('Unified createUserProfile: Upserting vendor profile');
        const { error: vendorError } = await supabase
          .from('vendors')
          .upsert(
            {
              user_id: userId,
              company_name: userData.business_name,
              commission_pct: 10,
            },
            { onConflict: 'user_id' }
          );

        if (vendorError) throw vendorError;
        console.log('Unified createUserProfile: Vendor profile upserted');
        await refreshUserProfile();
      } else if (role === ROLES.DRIVER) {
        console.log('Unified createUserProfile: Upserting driver profile');
        const { error: driverError } = await supabase
          .from('drivers')
          .upsert(
            {
              user_id: userId,
              license_number: userData.license_number,
              vehicle_number: userData.vehicle_number,
              is_available: true,
              is_online: false,
            },
            { onConflict: 'user_id' }
          );

        if (driverError) throw driverError;
        console.log('Unified createUserProfile: Driver profile upserted');
      }
      
      console.log('Unified createUserProfile: Profile creation completed successfully');
      
      return { data, error: null };
    } catch (error) {
      console.error('Unified createUserProfile error:', error);
      return { data: null, error };
    }
  };

  const getUserRole = () => {
    return user?.roles?.name || selectedRole;
  };

  const isSuperAdmin = () => {
    return getUserRole() === ROLES.SUPER_ADMIN;
  };

  const isVendor = () => {
    return getUserRole() === ROLES.VENDOR;
  };

  const isDriver = () => {
    return getUserRole() === ROLES.DRIVER;
  };

  const hasSession = () => {
    return !!session;
  };

  const hasUser = () => {
    return !!user;
  };

  const resetRoleSelection = () => {
    console.log('Unified: Resetting role selection');
    setSelectedRole(null);
  };

  const value = {
    session,
    user,
    loading,
    selectedRole,
    setSelectedRole,
    resetRoleSelection,
    incompleteSignupPhone,
    setIncompleteSignupPhone,
    incompleteSignupUserId,
    setIncompleteSignupUserId,
    signIn,
    signUp,
    signOut,
    createUserProfile,
    refreshUserProfile,
    getUserRole,
    isSuperAdmin,
    isVendor,
    isDriver,
    hasSession,
    hasUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
