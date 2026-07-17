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
  PanResponder,
  Animated,
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
  const [isLoading, setIsLoading] = useState(!!documentData);
  const [imageError, setImageError] = useState(false);
  const [scale] = useState(new Animated.Value(1));
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);

  // Convert base64 to data URI for display
  const imageUri = documentData ? base64ToDataUri(documentData) : null;

  // Reset loading state when documentData changes
  React.useEffect(() => {
    if (documentData) {
      setIsLoading(true);
      setImageError(false);
    }
  }, [documentData]);

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

  const handleImageLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    setImageWidth(width);
    setImageHeight(height);
  };

  const zoomIn = () => {
    Animated.timing(scale, {
      toValue: 2,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const zoomOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const resetZoom = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {isFullScreen ? (
        // Full screen view with zoom controls
        <View style={styles.fullScreenContainer}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                console.log('📷 Full screen back button pressed');
                setIsFullScreen(false);
                resetZoom();
              }}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={28} color="#ffffff" />
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
            zoomEnabled={true}
          >
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            )}
            {!imageError && imageUri && (
              <Animated.View style={{ transform: [{ scale }] }}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.fullScreenImage}
                  onLoadStart={() => {
                    console.log('📷 Full screen image load started');
                    setIsLoading(true);
                  }}
                  onLoad={() => {
                    console.log('📷 Full screen image loaded successfully');
                    setIsLoading(false);
                  }}
                  onLoadEnd={() => {
                    console.log('📷 Full screen image load ended');
                    setIsLoading(false);
                  }}
                  onError={(error) => {
                    console.error('📷 Full screen image error:', error);
                    setImageError(true);
                    setIsLoading(false);
                  }}
                />
              </Animated.View>
            )}
            {imageError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
                <Text style={styles.errorText}>Failed to load image</Text>
              </View>
            )}
          </ScrollView>

          {/* Zoom controls footer */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomOut}>
              <Ionicons name="remove-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={resetZoom}>
              <Ionicons name="home-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomButton} onPress={zoomIn}>
              <Ionicons name="add-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
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
                  onLoadStart={() => {
                    console.log('📷 Modal image load started');
                    setIsLoading(true);
                  }}
                  onLoad={() => {
                    console.log('📷 Modal image loaded successfully');
                    setIsLoading(false);
                  }}
                  onLoadEnd={() => {
                    console.log('📷 Modal image load ended');
                    setIsLoading(false);
                  }}
                  onError={(error) => {
                    console.error('📷 Modal image error:', error);
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
    padding: 12,
    marginRight: 0,
    zIndex: 100,
  },
  backButton: {
    padding: 16,
    marginRight: 0,
    zIndex: 100,
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
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  fullScreenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenImage: {
    width: '100%',
    height: 'auto',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 80,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    gap: 16,
  },
  zoomButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DocumentViewer;
