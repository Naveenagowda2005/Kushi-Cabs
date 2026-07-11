-- Seed default app policies for terms, conditions, privacy, and cancellation

-- Insert or update policies
INSERT INTO app_policies (policy_type, content, applies_to, created_at, updated_at)
VALUES 
  (
    'terms_conditions',
    'Terms & Conditions

These terms apply to vendors and drivers operating under the Kushi Cabs platform.

1. Vendor and Driver Partnership
Vendors and drivers work together as Kushi Cabs partners.

2. Vendor Responsibility - Trip Management
Vendor responsibility is to take care of the complete trip start-to-end billing process in the partner app. If any default from the vendor leaves a trip incomplete, penalty charges apply. Continued defaults may lead to termination from Kushi Cabs.

3. Vendor Responsibility - Car and Driver Assignment
Vendor responsibility is to add the car and driver to assign the current booking. If any default occurs, penalties apply and continued default may lead to termination.

4. Billing and Payment
Billing amounts shown in the application are the vendor''s responsibility to collect in cash. If a customer complains and the driver collects extra amount, penalty charges apply to the vendor.

5. Cancellation Policy Compliance
Vendor accept cancellations must follow the cancellation policy.

6. Termination Rights
The company can terminate the vendor at any time if they cross any policy or fail to meet responsibilities.

7. Document Management
Vendors must ensure all driver and vehicle documents are active. If a vendor sends inactive documents, the vehicle vendor may face legal action.

8. Emergency Protocol
If the vendor or driver misbehaves on a trip, or if the customer uses the emergency panic button, support must be contacted immediately and the trip should end. The customer should pay 0/- and the vendor should handle the payment process.

9. Professional Conduct
If the vendor or support line behaves badly, uses unprofessional language, or mistreats customers, the vendor can be terminated immediately.

10. Account Activation
All vendors must accept Kushi Cabs team terms and condition agreement before activating their account.

11. Pickup Punctuality
Vendors must follow the driver and cab at least 15 minutes before pickup to ensure the pickup is on time. If the cab is late or does not show, mark it as cancelled and penalties up to ₹1500/- will be applied to the vendor.

12. No-Show Protocol
If the driver waits more than 1 hour at pickup and the customer does not respond or cancels, vendors can report to customer support. ₹500/- will be added to the vendor wallet as cancellation fees from the customer wallet.

13. Dynamic Pricing
Trip fares may change at any time based on seasons before booking.

14. Payment Collection
The driver is responsible for collecting the cash from the customer as shown in the application. Kushi Cabs is not responsible for any pending customer amount.

15. Additional Charges
Toll, permit, and parking are the driver''s responsibility to collect from the customer if not included in the application.

16. Personal Trip Prohibition
Making the customer a personal trip for future use may lead to termination.

17. Driver Professionalism
Unprofessional driver behavior leads to termination.

18. Customer Complaints
Customer complaints against the driver or car lead to penalty charges, and continued complaints lead to termination.

19. Minimum Distance Requirements
Minimum one-way drop is 130 km for all vehicles.
Round trip minimum is 250 km per day.

20. Vehicle and Driver Changes
Changing driver or vehicle for the booking carries penalty charges and continued violations lead to termination.

21. Deposit Policy
Deposit amount will not be returned for terminated drivers or vehicles.

22. Commission Submission
Commission submission must be made 4-5 hours before completing the booking; delay may lead to blocking.',
    ARRAY[''driver'', ''vendor''],
    NOW(),
    NOW()
  ),
  (
    'cancellation_policy',
    'Cancellation Policy

Cancellation penalties are calculated from the booking time and apply to the vendor or driver as described below:

Time Window | Penalty Amount
0 to 30 minutes | ₹500/-
0 to 60 minutes | ₹600/-
0 to 120 minutes | ₹800/-
0 to 180 minutes | ₹1000/-
0 to 240 minutes | ₹1500/-

Important Notes:
- Penalties are deducted from vendor wallet
- Late cancellations incur maximum penalty
- Repeated cancellations may lead to account suspension
- Emergency cancellations are handled on case-by-case basis
- Cancellations must be reported through the app',
    ARRAY[''driver'', ''vendor''],
    NOW(),
    NOW()
  ),
  (
    'privacy_policy',
    'Privacy Policy

Your privacy is important to us. This Privacy Policy outlines how we collect, use, and protect your data.

1. Information We Collect
We collect information necessary to provide our taxi services including:
- Personal information (name, phone, email)
- Location data (pickup and drop-off locations)
- Payment information (for transaction processing)
- Trip history and ratings
- Vehicle and driver information (for vendors)
- Document information (license, registration)

2. How We Use Your Information
Your data is used for:
- Service delivery and trip management
- Payment processing and billing
- Customer support and communication
- Service improvement and analytics
- Safety and fraud prevention
- Legal compliance

3. Data Protection
We implement security measures to protect your information:
- Encrypted data transmission (HTTPS)
- Secure database storage
- Access controls and authentication
- Regular security audits
- Compliance with data protection regulations

4. Third-Party Sharing
We do not share your personal data with unauthorized parties. Data sharing is limited to:
- Service providers (payment processors, SMS services)
- Legal authorities (when required by law)
- Emergency services (when necessary for safety)

5. Data Retention
We retain your data as long as necessary to provide services and comply with legal obligations. You can request data deletion subject to legal and contractual requirements.

6. Your Rights
You have the right to:
- Access your personal data
- Correct inaccurate information
- Request data deletion
- Opt-out of marketing communications
- File complaints with data protection authorities

7. Children''s Privacy
Our service is not intended for children under 18. We do not knowingly collect data from children.

8. Policy Changes
We reserve the right to update this privacy policy. Changes will be notified to users.

9. Contact Us
For privacy concerns or data requests, contact our support team:
- Email: support@kushicabs.com
- Phone: Our support hotline
- In-app support chat',
    ARRAY[''driver'', ''vendor''],
    NOW(),
    NOW()
  ),
  (
    'refund_policy',
    'Refund Policy

This Refund Policy outlines how refunds are processed for cancellations and disputes.

1. Refund Eligibility
Refunds are provided for:
- Customer-initiated cancellations within the allowed window
- Trip cancellations due to vendor fault
- Payment errors and duplicate charges
- Service failures affecting trip completion

2. Non-Refundable Situations
Refunds are not provided for:
- Cancellations after trip completion
- No-show by customer
- Disputes resolved in vendor''s favor
- Negotiated rate payments
- Cash payments to driver (vendor responsibility)

3. Cancellation-Based Refunds
Refunds depend on cancellation timing:
- 0-30 minutes: ₹500 penalty, rest refunded
- 30-60 minutes: ₹600 penalty, rest refunded
- 60-120 minutes: ₹800 penalty, rest refunded
- 120-180 minutes: ₹1000 penalty, rest refunded
- Beyond 240 minutes: Full amount retained

4. Refund Processing Timeline
Approved refunds are processed as follows:
- Wallet refunds: Immediate (within 1 hour)
- Card refunds: 5-7 business days
- Bank transfers: 7-10 business days

5. Dispute Resolution Process
For refund disputes:
- File complaint within 48 hours of trip
- Provide trip ID and supporting evidence
- Support team investigates within 24-48 hours
- Resolution communicated via app and email

6. Special Cases
Special refund requests are handled on case-by-case basis:
- Safety incidents
- Emergency situations
- Technical failures
- Documented issues affecting service

7. Vendor Refund Policy
For vendor disputes:
- Commission disputes: Reviewed within 24 hours
- Deduction disputes: Investigated within 48 hours
- Approved refunds: Credited to vendor wallet

8. Non-Refundable Conditions
Refunds may be declined if:
- Vendor or driver violated terms
- False claims or fraud detected
- Evidence contradicts claim

9. Contact Support
For refund inquiries:
- In-app support: Fastest response
- Email: support@kushicabs.com
- Phone: Our support hotline',
    ARRAY[''driver'', ''vendor''],
    NOW(),
    NOW()
  ),
  (
    'safety_guidelines',
    'Safety Guidelines

Safety is our top priority. These guidelines apply to all drivers and vendors using the Kushi Cabs platform.

1. Driver Safety Requirements
- Valid and current driving license
- Vehicle roadworthiness certificate
- Insurance valid for commercial use
- Regular vehicle maintenance
- Adherence to traffic rules and speed limits
- No driving under influence

2. Passenger Safety Protocol
- Professional and courteous behavior
- Safe driving practices
- Agreed route adherence
- Well-maintained, clean vehicle
- Emergency contact availability

3. Emergency Procedures
- Activate emergency feature if needed
- Contact support immediately in emergencies
- Share live location with authorities if required
- Follow law enforcement instructions
- Document incident details

4. Incident Reporting
Report all incidents to support within 2 hours:
- Accidents or collisions
- Safety concerns or threats
- Damage to vehicle or property
- Customer complaints regarding safety
- Technical issues affecting safety

5. Verification Requirements
- Driver identity verification upon signup
- Vehicle ownership verification
- Document authenticity checks
- Periodic verification updates
- License and registration renewal tracking

6. Vehicle Hygiene Standards
- Regular interior and exterior cleaning
- Sanitization after each trip
- Air purification and ventilation
- Proper waste disposal
- Professional appearance maintenance

7. Communication Standards
- Professional language and tone
- Respectful interaction with customers
- Timely response to messages
- No inappropriate conduct
- Respect for privacy

8. Prohibited Conduct
Strictly prohibited behaviors:
- Violent or threatening language
- Sexual harassment or misconduct
- Discrimination based on any characteristic
- Reckless or dangerous driving
- Influence of alcohol or drugs
- Using phone while driving

9. Passenger Conduct Issues
If passenger behavior is problematic:
- Maintain professionalism
- Request passenger exit if necessary
- Contact support for assistance
- Document incident details
- Never engage in confrontation

10. Navigation and Route Safety
- Use reliable GPS navigation
- Follow traffic rules and signals
- Avoid high-risk areas when possible
- Inform passenger of route choice
- Report unsafe areas to support

11. Financial Security
- Use only authorized payment methods
- Never share card or account details
- Report fraudulent activities
- Maintain cash security protocols
- Verify customer payment before trip completion

12. Medical Emergency Response
- Contact emergency services (ambulance) if needed
- Do not attempt medical treatment
- Follow emergency personnel instructions
- Report incident to support
- Provide necessary information to authorities

13. Document Security
- Keep documents safe and secured
- Report lost or stolen documents immediately
- Maintain document validity
- Provide valid documents when requested
- Update documents as required

14. Night and Solo Travel Safety
- Take precautions during night trips
- Share trip details with trusted contacts
- Keep doors locked when appropriate
- Trust your instincts about safety
- Cancel trip if uncomfortable

15. Support Access
24/7 support available:
- In-app chat for non-emergencies
- Phone support for urgent issues
- Emergency hotline for critical situations
- Email for detailed reports

16. Continuous Training
- Complete safety training modules
- Participate in refresher sessions
- Stay updated on new safety features
- Report safety improvement suggestions
- Provide feedback on safety protocols

17. Compliance and Termination
- Non-compliance leads to warnings
- Repeated violations result in suspension
- Serious violations result in permanent termination
- Customer safety is non-negotiable
- All decisions are final and binding

18. Regular Audits
- Random trip monitoring
- Customer feedback review
- Compliance verification
- Document authenticity checks
- Safety metric tracking',
    ARRAY[''driver'', ''vendor''],
    NOW(),
    NOW()
  )
ON CONFLICT (policy_type) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- Verify insertion
SELECT policy_type, LENGTH(content) as content_length, applies_to, updated_at 
FROM app_policies
ORDER BY created_at DESC;
