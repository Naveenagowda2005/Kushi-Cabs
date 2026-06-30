import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getDocumentLabel, getDocumentIcon } from '../services/documentService';

const DocumentUploadCard = ({
  documentType,
  status = 'pending',
  rejectionReason,
  onUpload,
  onView,
  isUploading = false,
  hasData = false, // New prop to indicate if document has been uploaded
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      case 'pending':
        return hasData ? COLORS.warning : COLORS.textTertiary; // Different color if uploaded
      default:
        return COLORS.textTertiary;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'approved':
        return 'Approved ✓';
      case 'rejected':
        return 'Rejected ✗';
      case 'pending':
        return hasData ? 'Uploaded - Pending Review' : 'Not Uploaded';
      default:
        return 'Not Uploaded';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'pending':
        return hasData ? 'checkmark-circle-outline' : 'document-outline';
      default:
        return 'document-outline';
    }
  };

  const handleUploadPress = () => {
    // DRIVER_SELFIE and VENDOR_SELFIE always uses camera
    if (documentType === 'DRIVER_SELFIE' || documentType === 'VENDOR_SELFIE') {
      onUpload(documentType, true);
    } else {
      Alert.alert(
        'Upload Document',
        'Choose upload method',
        [
          {
            text: 'Camera',
            onPress: () => onUpload(documentType, true),
          },
          {
            text: 'Gallery',
            onPress: () => onUpload(documentType, false),
          },
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, hasData && styles.iconContainerUploaded]}>
          <Ionicons
            name={getStatusIcon()}
            size={24}
            color={getStatusColor()}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{getDocumentLabel(documentType)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor()}20` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor() },
              ]}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusLabel()}
            </Text>
          </View>
        </View>
      </View>

      {status === 'rejected' && rejectionReason && (
        <View style={styles.rejectionContainer}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.error} />
          <Text style={styles.rejectionText}>{rejectionReason}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.uploadButton,
          isUploading && styles.uploadButtonDisabled,
          hasData && styles.uploadButtonUploaded,
        ]}
        onPress={handleUploadPress}
        disabled={isUploading || status === 'approved'}
      >
        {isUploading ? (
          <>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.uploadButtonText}>Uploading...</Text>
          </>
        ) : status === 'approved' ? (
          <>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={[styles.uploadButtonText, { color: COLORS.success }]}>
              Approved
            </Text>
          </>
        ) : status === 'rejected' ? (
          <>
            <Ionicons name="reload-outline" size={18} color={COLORS.primary} />
            <Text style={styles.uploadButtonText}>Re-upload</Text>
          </>
        ) : hasData ? (
          <>
            <Ionicons name="checkmark" size={18} color={COLORS.success} />
            <Text style={[styles.uploadButtonText, { color: COLORS.success }]}>
              Uploaded
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
            <Text style={styles.uploadButtonText}>Upload</Text>
          </>
        )}
      </TouchableOpacity>

      {/* View button — only shown when document has been uploaded */}
      {hasData && onView && (
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onView}
        >
          <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
          <Text style={styles.viewButtonText}>View Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerUploaded: {
    backgroundColor: `${COLORS.success}15`,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  rejectionText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 8,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonUploaded: {
    backgroundColor: `${COLORS.success}15`,
    borderColor: COLORS.success,
  },
  uploadButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${COLORS.primary}50`,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 6,
  },
});

export default DocumentUploadCard;
