import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAppPolicies = () => {
  const [policies, setPolicies] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('app_policies')
        .select('*');

      if (fetchError) throw fetchError;

      // Convert array to object keyed by policy_type
      const policyMap = {};
      data?.forEach(policy => {
        policyMap[policy.policy_type] = policy.content;
      });
      setPolicies(policyMap);
      setError(null);
    } catch (err) {
      console.error('Error loading policies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { policies, loading, error, refresh: loadPolicies };
};
