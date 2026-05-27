export const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  DRIVER: 'driver',
};

export const TRIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  COMMISSION: 'commission',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
};

// Minimum wallet balance required for a driver to accept a trip
export const MIN_WALLET_BALANCE = 100;

// How long vendors have exclusive access to new trips (ms)
export const VENDOR_WINDOW_MS = 5 * 60 * 1000;

export const STORAGE_BUCKETS = {
  ODOMETER: 'odometer-images',
  DOCUMENTS: 'documents',
};
