import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { policyData } from '../screens/common/policyData';

// Helper function to convert hardcoded policy data to object keyed by policy_type
const getDefaultPolicies = () => {
  const defaults = {};
  
  // Map policyData.terms to terms_conditions
  if (policyData.terms?.items) {
    defaults['terms_conditions'] = policyData.terms.items.join('\n\n');
  }
  
  // Map policyData.cancellation to cancellation_policy
  if (policyData.cancellation?.list) {
    const cancellationText = policyData.cancellation.list
      .map(item => `${item.label}: ${item.amount}`)
      .join('\n');
    defaults['cancellation_policy'] = cancellationText;
  }
  
  // Default privacy policy
  defaults['privacy_policy'] = 'Privacy Policy\n\nYour privacy is important to us. This policy outlines how we collect, use, and protect your data.\n\nData Collection: We collect information necessary to provide our taxi services.\n\nData Usage: Your data is used only for service delivery and improvement.\n\nData Protection: We implement security measures to protect your information.\n\nThird Parties: We do not share your data with unauthorized parties.\n\nContact: For privacy concerns, please contact our support team.';
  
  // Default refund policy
  defaults['refund_policy'] = 'Refund Policy\n\nRefunds are processed based on the cancellation policy and payment terms.\n\nEligible Cancellations: Cancellations made within the specified timeframe are eligible for refunds.\n\nRefund Process: Approved refunds are processed within 5-7 business days.\n\nNon-Eligible Cancellations: Late cancellations may not be eligible for refunds.\n\nDispute Resolution: Contact support for refund disputes.';
  
  // Default safety guidelines
  defaults['safety_guidelines'] = 'Safety Guidelines\n\n1. Driver Safety: Maintain vehicle condition and follow traffic rules.\n\n2. Passenger Safety: Ensure a safe and comfortable ride experience.\n\n3. Emergency: Use emergency contact features if needed.\n\n4. Incident Reporting: Report all incidents to support immediately.\n\n5. Verification: Verify passenger and driver identities as required.\n\n6. Hygiene: Maintain vehicle cleanliness standards.\n\n7. Communication: Maintain professional communication at all times.';
  
  return defaults;
};

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

      // Convert array to object keyed by policy_type
      const policyMap = {};
      
      if (fetchError) {
        console.warn('Error fetching policies from database, using defaults:', fetchError.message);
        // Use default policies from hardcoded data
        const defaults = getDefaultPolicies();
        setPolicies(defaults);
        setError(null);
        return;
      }

      // If data is empty, use defaults
      if (!data || data.length === 0) {
        console.log('No policies found in database, using defaults');
        const defaults = getDefaultPolicies();
        setPolicies(defaults);
        setError(null);
        return;
      }

      // Convert database data to policy map
      data.forEach(policy => {
        policyMap[policy.policy_type] = policy.content;
      });

      // Fill in any missing policies with defaults
      const defaults = getDefaultPolicies();
      const finalPolicies = { ...defaults, ...policyMap };
      
      setPolicies(finalPolicies);
      setError(null);
    } catch (err) {
      console.error('Error loading policies:', err);
      // Use defaults on error
      const defaults = getDefaultPolicies();
      setPolicies(defaults);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { policies, loading, error, refresh: loadPolicies };
};
