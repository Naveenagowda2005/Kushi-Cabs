import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { ROLES } from '../constants';

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
  const fetchingRef = React.useRef(false);

  useEffect(() => {
    console.log('Unified AuthContext: Getting initial session...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Unified AuthContext: Initial session:', !!session);
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setSelectedRole(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Unified AuthContext: Auth state change:', event, !!session);
        setSession(session);
        
        if (session?.user) {
          // Skip TOKEN_REFRESHED if we already have user data — avoids duplicate fetches
          if (event === 'TOKEN_REFRESHED' && fetchingRef.current) return;
          await fetchUserProfile(session.user.id);
        } else {
          console.log('Unified AuthContext: No session, clearing user and role');
          setUser(null);
          setSelectedRole(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      console.log('Unified fetchUserProfile called for user:', userId);
      fetchingRef.current = true;

      // Race the query against a 10-second timeout so the app never hangs
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
      } else if (data) {
        console.log('Unified setting user profile:', data);
        setUser(data);
        // Auto-select role if user has one and it's different from currently selected
        if (data.roles?.name) {
          console.log('Unified auto-selecting role:', data.roles.name);
          setSelectedRole(data.roles.name);
        }
      } else {
        console.log('Unified: No user profile found for authenticated user ID:', userId);
        console.log('Unified: User needs to complete registration');
        setUser(null);
        // Don't sign out - let them complete registration
        // The RootNavigator will handle showing the appropriate screen
      }
    } catch (err) {
      console.error('Unified fetchUserProfile error:', err.message);
      // On timeout or network error — clear loading so app doesn't stay stuck
      // User will see role selection and can try logging in again
      setUser(null);
      setLoading(false);
    } finally {
      setLoading(false);
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
      console.log('Unified AuthContext: Attempting sign in with:', identifier, 'role:', role);
      
      let email;
      
      if (role === ROLES.SUPER_ADMIN) {
        // Super Admin uses email directly
        email = identifier;
      } else {
        // For Vendor/Driver, check if phone number exists for this specific role
        const phoneDigits = identifier.replace(/[^0-9]/g, '');
        
        // Check if this phone number is already registered for a different role
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select(`
            id,
            phone,
            roles (
              name
            )
          `)
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingUser && existingUser.roles?.name !== role) {
          throw new Error(`This phone number is already registered as ${existingUser.roles.name}. Please use a different phone number or login with the correct role.`);
        }

        email = `${phoneDigits}@kushicabs.phone`;
      }
      
      // For OTP-only login, we just need to verify the user exists
      // The actual authentication happens via OTP verification in the backend
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, phone, role_id, roles(name)')
        .eq('email', email)
        .maybeSingle();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!userData) {
        throw new Error('User not found. Please sign up first.');
      }

      // Create a session without password (OTP verified)
      // We'll use a dummy password since Supabase requires it
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'otp-verified', // Dummy password for OTP-verified users
      });

      // If password fails, try to sign up the user if they don't exist
      if (error && error.message.includes('Invalid login credentials')) {
        console.log('Unified AuthContext: User auth account not found, creating one');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: 'otp-verified',
        });
        
        if (signUpError && !signUpError.message.includes('already registered')) {
          throw signUpError;
        }

        // Now try to sign in again
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: 'otp-verified',
        });

        if (signInError) throw signInError;
        return { data: signInData, error: null };
      }

      if (error) throw error;

      return { data, error: null };
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

        // Check if this phone number is already fully registered (has a users row)
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id, phone, roles ( name )')
          .eq('phone', phoneDigits)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        // Only block if the existing row belongs to a DIFFERENT auth user
        if (existingUser && existingUser.id !== (await supabase.auth.getUser()).data?.user?.id) {
          throw new Error(
            `This phone number is already registered as ${existingUser.roles?.name || 'a user'}. Please login instead.`
          );
        }

        const email = `${phoneDigits}@kushicabs.phone`;
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // Supabase returns identities=[] when the auth account already exists (incomplete registration).
        // Sign them in so we have a valid session for createUserProfile.
        if (data?.user && data.user.identities?.length === 0) {
          console.log('Unified AuthContext: Auth user already exists (incomplete registration), signing in');
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw new Error('Account already exists. Please login instead.');
          return { data: signInData, error: null };
        }

        return { data, error: null };
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
      
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }

      const userId = session.user.id;
      console.log('Unified createUserProfile: User ID:', userId);

      // Extract phone from the auth email (format: {phoneDigits}@kushicabs.phone)
      // This is the source of truth — RegisterScreen no longer collects phone separately
      let phone = userData.phone || '';
      if (!phone && session.user.email?.endsWith('@kushicabs.phone')) {
        phone = session.user.email.replace('@kushicabs.phone', '');
      }

      // Get role ID
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', role)
        .single();

      if (roleError) throw roleError;
      console.log('Unified createUserProfile: Role ID found:', roleData.id);

      // Upsert user profile — safe to retry if a previous attempt partially succeeded
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: userId,
            email: session.user.email,
            role_id: roleData.id,
            full_name: userData.full_name,
            phone: phone,
            is_active: true,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) throw error;
      console.log('Unified createUserProfile: User profile upserted:', data);

      // Upsert role-specific profile — also safe to retry
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

      console.log('Unified createUserProfile: Refreshing user profile...');
      await refreshUserProfile();
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