import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getDocumentLabel, base64ToDataUri } from '../services/documentService';

const DocumentViewer = ({
  visible,
  documentData,
  documentType,
  onClose,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Convert base64 to data URI for display
  const imageUri = documentData ? base64ToDataUri(documentData) : null;

  const handleShare = async () => {
    try {
      if (!documentData) {
        Alert.alert('Error', 'Document data not available');
        return;
      }

      await Share.share({
        message: `Sharing ${getDocumentLabel(documentType)} document`,
        title: getDocumentLabel(documentType),
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {isFullScreen ? (
        // Full screen view
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsFullScreen(false)}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle}>
              {getDocumentLabel(documentType)}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.fullScreenContent}
            scrollEventThrottle={16}
            maximumZoomScale={3}
            minimumZoomScale={1}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            {!imageError && imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.fullScreenImage}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsLoading(false);
                }}
              />
            )}
            {imageError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                <Text style={styles.errorText}>Failed to load image</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        // Modal view
        <View style={styles.container}>
          <View style={styles.overlay} />
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>
                {getDocumentLabel(documentType)}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.imageContainer}>
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              )}
              {!imageError && imageUri && (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setIsLoading(false);
                  }}
                />
              )}
              {imageError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                  <Text style={styles.errorText}>Failed to load image</Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setIsFullScreen(true)}
              >
                <Ionicons name="expand-outline" size={20} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Full Screen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={onClose}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  closeModalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  // Full screen styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fullScreenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
});

export default DocumentViewer;
