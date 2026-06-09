import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        
        // Check for super admin session in AsyncStorage first (React Native)
        try {
          const superAdminSessionStr = await AsyncStorage.getItem('superAdminSession');
          console.log('AuthProvider: Checking AsyncStorage for superAdminSession:', !!superAdminSessionStr);
          
          if (superAdminSessionStr) {
            console.log('AuthProvider: Found super admin session in AsyncStorage');
            const superAdminSession = JSON.parse(superAdminSessionStr);
            console.log('AuthProvider: Parsed session:', { 
              hasUserId: !!superAdminSession?.user?.id,
              email: superAdminSession?.user?.email 
            });
            
            // ✅ SET SESSION FIRST - this is critical!
            console.log('AuthProvider: Setting session from AsyncStorage');
            setSession(superAdminSession);
            console.log('AuthProvider: Session set, now fetching profile');
            
            if (superAdminSession?.user?.id) {
              console.log('AuthProvider: Restoring user profile from session');
              await fetchUserProfile(superAdminSession.user.id);
              console.log('AuthProvider: User profile restored');
              console.log('AuthProvider: Session persisted, hasSession will now return true');
              return; // Early return if super admin session restored
            }
          }
        } catch (e) {
          console.log('AuthProvider: Could not restore super admin session:', e.message);
        }
        
        console.log('AuthProvider: No AsyncStorage session found, checking Supabase...');
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise]);
        
        console.log('AuthProvider: Got Supabase session result:', { hasSession: !!session, error: error?.message });
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('AuthProvider: Setting Supabase session');
        setSession(session);
        if (session?.user) {
          console.log('AuthProvider: Session found, fetching profile');
          await fetchUserProfile(session.user.id);
        } else {
          console.log('AuthProvider: No session, clearing everything');
          setUser(null);
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
        async (event, supabaseSession) => {
          console.log('AuthProvider: Auth state change:', event, !!supabaseSession);
          
          // Check if this is a Supabase session (has JWT token) or if we already have super admin mock session
          // If there's no Supabase session and event is INITIAL_SESSION, leave the super admin mock session alone
          if (!supabaseSession && event === 'INITIAL_SESSION') {
            console.log('AuthProvider: INITIAL_SESSION with no Supabase session - keeping existing session (super admin mock)');
            return; // Don't clear the existing super admin mock session
          }
          
          setSession(supabaseSession);
          
          if (supabaseSession?.user) {
            if (event === 'TOKEN_REFRESHED' && fetchingRef.current) return;
            await fetchUserProfile(supabaseSession.user.id);
          } else {
            console.log('AuthProvider: No Supabase session, clearing user and role');
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
      console.log('fetchUserProfile: Starting for user:', userId);
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

      console.log('fetchUserProfile: Query result:', { 
        hasData: !!data,
        error: error?.message,
        dataId: data?.id
      });

      if (error) {
        console.error('fetchUserProfile: Error fetching user profile:', error);
        setUser(null);
        setLoading(false);
      } else if (data) {
        console.log('fetchUserProfile: Setting user:', data.id, data.roles?.name);
        setUser(data);
        if (data.roles?.name) {
          console.log('fetchUserProfile: Auto-selecting role:', data.roles.name);
          setSelectedRole(data.roles.name);
        }
        console.log('fetchUserProfile: Setting loading to false');
        setLoading(false);
      } else {
        console.log('fetchUserProfile: No user profile found');
        setUser(null);
        setLoading(false);
      }
    } catch (err) {
      console.error('fetchUserProfile: Exception:', err.message);
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
        
        // OTP verification already happened (SMS was verified)
        // The 'password' parameter here is actually the OTP code from SMS
        console.log('Super Admin: OTP already verified via SMS');
        
        // For super_admin, verify phone exists in database and has super_admin role
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

        // For super admin, create mock session (OTP verification is sufficient)
        // We set both session and user from database
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
        console.log('Super Admin: Setting session and user state');
        setSession(mockSession);
        setUser(adminData);
        if (adminData.roles?.name) {
          console.log('Super Admin: Setting selected role:', adminData.roles.name);
          setSelectedRole(adminData.roles.name);
        }
        
        // Persist super admin session to AsyncStorage for persistence across reloads
        try {
          await AsyncStorage.setItem('superAdminSession', JSON.stringify(mockSession));
          console.log('Super Admin: Session persisted to AsyncStorage');
          const stored = await AsyncStorage.getItem('superAdminSession');
          console.log('Super Admin: Verification - AsyncStorage contains:', !!stored);
        } catch (e) {
          console.warn('Super Admin: Could not persist session to AsyncStorage:', e.message);
        }
        
        console.log('Super Admin: Session and user set - redirecting to dashboard');
        
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
            
            // If already approved, allow login immediately (handles dummy drivers)
            if (verificationStatus.overall_status === 'approved') {
              console.log('Driver is approved - allowing login');
            } else if (!verificationStatus.all_documents_submitted) {
              // Documents not yet submitted, block login
              throw new Error('Please upload your documents first.');
            }
            // ALL other statuses (pending_review, pending, rejected) → allow login
            // DriverNavigator will show the correct screen based on status
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
      
      // For OTP users, we don't use password authentication
      // Instead, we authenticate directly with the user data from database
      // since OTP verification already happened on the backend
      
      // Create a mock session for OTP-verified users
      const mockSession = {
        user: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
        },
        access_token: 'otp-verified-' + userData.id,
        token_type: 'bearer',
      };
      
      console.log('OTP user authenticated with mock session');
      setSession(mockSession);
      setUser(userData);
      if (userData.roles?.name) {
        setSelectedRole(userData.roles.name);
      }
      
      return { data: { user: userData, session: mockSession }, error: null };
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
      
      // Clear super admin session from AsyncStorage
      try {
        await AsyncStorage.removeItem('superAdminSession');
        console.log('Super admin session cleared from AsyncStorage');
      } catch (e) {
        console.warn('Could not clear super admin session from AsyncStorage:', e.message);
      }
      
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
