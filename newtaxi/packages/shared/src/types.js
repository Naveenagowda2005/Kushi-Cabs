/**
 * JSDoc type definitions for the shared domain models.
 * These serve as documentation and IDE hints across both apps.
 */

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} phone
 * @property {string} full_name
 * @property {number} role_id
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {Object} Trip
 * @property {string} id
 * @property {string} created_by
 * @property {string|null} accepted_by
 * @property {string|null} driver_id
 * @property {string|null} vendor_id
 * @property {string} pickup_location
 * @property {string} dropoff_location
 * @property {number} fare_amount
 * @property {'pending'|'accepted'|'in_progress'|'completed'|'cancelled'} status
 * @property {string|null} accepted_at
 * @property {string|null} started_at
 * @property {string|null} completed_at
 * @property {string|null} start_odometer_url
 * @property {string|null} end_odometer_url
 * @property {string} vendor_visible_until
 * @property {string} created_at
 */

/**
 * @typedef {Object} Wallet
 * @property {string} id
 * @property {string} user_id
 * @property {number} balance
 * @property {string} updated_at
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} wallet_id
 * @property {string|null} trip_id
 * @property {'credit'|'debit'|'commission'|'withdrawal'|'refund'} type
 * @property {number} amount
 * @property {string} description
 * @property {string} created_at
 */
