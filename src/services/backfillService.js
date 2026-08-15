/**
 * Backfill Service
 * Helps create missing database records for documents already in bucket
 * Run this once to sync bucket files with database
 */

import { supabase } from '../lib/supabase';

/**
 * Get all drivers with documents in bucket but no DB records
 * @returns {Promise<array>} Array of driver IDs
 */
export const findDriversWithBucketFiles = async () => {
  try {
    console.log('🔍 Scanning bucket for driver documents...');

    // List all driver folders in bucket
    const { data: driverFolders, error } = await supabase.storage
      .from('driver-documents')
      .list('drivers', {
        limit: 1000,
      });

    if (error) {
      console.error('Error listing drivers:', error);
      return [];
    }

    console.log(`Found ${driverFolders?.length || 0} driver folders`);

    // Filter for actual folders (id === null means it's a folder/prefix)
    const driverIds = driverFolders
      .filter(item => item.id === null)
      .map(item => item.name);

    console.log(`Found ${driverIds.length} drivers with documents:`, driverIds);

    return driverIds;
  } catch (error) {
    console.error('Error finding drivers with bucket files:', error);
    return [];
  }
};

/**
 * Get document types uploaded for a specific driver
 * @param {string} driverId - Driver ID
 * @returns {Promise<array>} Array of document types found
 */
export const findDocumentTypesInBucket = async (driverId) => {
  try {
    console.log(`📂 Scanning bucket for documents of driver: ${driverId}`);

    const { data: files, error } = await supabase.storage
      .from('driver-documents')
      .list(`drivers/${driverId}`, {
        limit: 100,
      });

    if (error) {
      console.error('Error listing documents:', error);
      return [];
    }

    // Filter out folders and hidden files
    const documentTypes = (files || [])
      .filter(file => file.id !== null && file.id !== undefined && !file.name.startsWith('.'))
      .map(file => file.name.split('.')[0]); // Extract type from filename

    console.log(`Found ${documentTypes.length} documents for driver:`, documentTypes);

    return documentTypes;
  } catch (error) {
    console.error('Error finding documents in bucket:', error);
    return [];
  }
};

/**
 * Create database records for driver documents in bucket
 * @param {string} driverId - Driver ID
 * @param {array} documentTypes - Array of document type codes
 * @returns {Promise<object>} Result with created count
 */
export const backfillDriverDocuments = async (driverId, documentTypes) => {
  try {
    console.log(`📝 Backfilling ${documentTypes.length} documents for driver: ${driverId}`);

    if (!documentTypes || documentTypes.length === 0) {
      console.log('No documents to backfill');
      return { created: 0, updated: 0, errors: 0 };
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Check which records already exist
    const { data: existing, error: checkError } = await supabase
      .from('driver_documents')
      .select('document_type')
      .eq('driver_id', driverId);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing records:', checkError);
      errors++;
    }

    const existingTypes = new Set((existing || []).map(d => d.document_type));

    // Insert missing records
    for (const docType of documentTypes) {
      try {
        if (existingTypes.has(docType)) {
          console.log(`  ℹ️ Record already exists for ${docType}`);
          updated++;
        } else {
          const { error: insertError } = await supabase
            .from('driver_documents')
            .insert([{
              driver_id: driverId,
              document_type: docType,
              status: 'pending',
              uploaded_at: new Date().toISOString(),
            }]);

          if (insertError) {
            console.error(`  ❌ Error inserting ${docType}:`, insertError.message);
            errors++;
          } else {
            console.log(`  ✅ Created record for ${docType}`);
            created++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Exception for ${docType}:`, error.message);
        errors++;
      }
    }

    // Create verification status if needed
    const { error: statusError } = await supabase
      .from('driver_verification_status')
      .upsert({
        driver_id: driverId,
        overall_status: 'pending_review',
        all_documents_submitted: true,
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'driver_id',
      });

    if (statusError) {
      console.error('Error creating verification status:', statusError);
      errors++;
    }

    console.log(`✅ Backfill complete: ${created} created, ${updated} updated, ${errors} errors`);

    return { created, updated, errors, total: documentTypes.length };
  } catch (error) {
    console.error('Error backfilling documents:', error);
    throw error;
  }
};

/**
 * Run full backfill for all drivers
 * CAUTION: This scans entire bucket and creates records - may be slow
 * @returns {Promise<object>} Summary of backfill operation
 */
export const backfillAllDrivers = async () => {
  try {
    console.log('🚀 Starting full backfill operation...');

    const driverIds = await findDriversWithBucketFiles();
    
    if (driverIds.length === 0) {
      console.log('No drivers found with documents');
      return { driversProcessed: 0, totalDocuments: 0 };
    }

    let totalCreated = 0;
    let driversProcessed = 0;

    for (const driverId of driverIds) {
      try {
        const docTypes = await findDocumentTypesInBucket(driverId);
        const result = await backfillDriverDocuments(driverId, docTypes);
        
        totalCreated += result.created;
        driversProcessed++;

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to backfill driver ${driverId}:`, error);
      }
    }

    console.log(`✅ Backfill complete: ${driversProcessed} drivers, ${totalCreated} documents`);

    return { driversProcessed, totalDocuments: totalCreated };
  } catch (error) {
    console.error('Error in full backfill:', error);
    throw error;
  }
};

export default {
  findDriversWithBucketFiles,
  findDocumentTypesInBucket,
  backfillDriverDocuments,
  backfillAllDrivers,
};
