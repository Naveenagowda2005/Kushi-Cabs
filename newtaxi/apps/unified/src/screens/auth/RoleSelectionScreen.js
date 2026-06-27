import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, ROLES } from '../../constants';
import { useAnimatedBorder } from '../../hooks/useAnimatedBorder';

const roleOptions = [
  {
    role: ROLES.SUPER_ADMIN,
    title: 'Super Admin',
    subtitle: 'System Administrator',
    description: 'Complete control over the entire cab business system',
    icon: 'shield-checkmark-outline',
    color: COLORS.superAdmin.primary,
    gradient: ['#6c5ce7', '#a29bfe'],
  },
  {
    role: ROLES.VENDOR,
    title: 'Vendor',
    subtitle: 'Business Owner',
    description: 'Create trip enquiries and manage your cab business',
    icon: 'business-outline',
    color: COLORS.vendor.primary,
    gradient: ['#0f3460', '#16426b'],
  },
  {
    role: ROLES.DRIVER,
    title: 'Driver',
    subtitle: 'Service Provider',
    description: 'Accept trips and earn money by providing cab services',
    icon: 'car-outline',
    color: COLORS.driver.primary,
    gradient: ['#1a1a2e', '#16213e'],
  },
];

export default function RoleSelectionScreen() {
  const { setSelectedRole, hasSession, hasUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const colorAnim = React.useRef(new Animated.Value(0)).current;
  const heartbeat = React.useRef(new Animated.Value(0)).current;

  // Start animations on mount
  React.useEffect(() => {
    // Color animation
    Animated.loop(
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      })
    ).start();

    // Heartbeat animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0.3,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(heartbeat, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#6c5ce7', '#a29bfe', '#74b9ff', '#a29bfe', '#6c5ce7'],
  });

  const shadowOpacity = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shadowRadius = heartbeat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const handleRoleSelect = async (role) => {
    try {
      setLoading(true);
      
      // Set the selected role in context
      setSelectedRole(role);
      
      // Small delay for better UX
      setTimeout(() => {
        setLoading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error selecting role:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to select role. Please try again.');
    }
  };

  // If user already has session and profile, don't show role selection
  if (hasSession() && hasUser()) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          <Animated.View 
            style={[
              styles.logoContainer,
              {
                backgroundColor: backgroundColor,
                shadowOpacity: shadowOpacity,
                shadowRadius: shadowRadius,
              }
            ]}
          >
            <Image
              source={require('../../../app.icon.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.title}>Welcome to Kushi Cabs</Text>
          <Text style={styles.subtitle}>Choose your role to get started</Text>
        </View>

        <View style={styles.rolesContainer}>
          {roleOptions.map((option) => (
            <RoleCard
              key={option.role}
              option={option}
              onPress={() => handleRoleSelect(option.role)}
              disabled={loading}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Select your role to access the appropriate features and interface
          </Text>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Setting up your experience...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Animated Role Card Component
function RoleCard({ option, onPress, disabled }) {
  const borderColor = useAnimatedBorder(option.color, '#00d4ff', 2000);

  return (
    <Animated.View
      style={{
        borderColor: borderColor,
        borderWidth: 2,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}
    >
      <TouchableOpacity
        style={styles.roleCard}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <View style={styles.roleCardContent}>
          <View style={[styles.iconContainer, { backgroundColor: option.color + '15' }]}>
            <Ionicons 
              name={option.icon} 
              size={40} 
              color={option.color} 
            />
          </View>
          
          <View style={styles.roleInfo}>
            <Text style={[styles.roleTitle, { color: option.color }]}>
              {option.title}
            </Text>
            <Text style={styles.roleSubtitle}>
              {option.subtitle}
            </Text>
            <Text style={styles.roleDescription}>
              {option.description}
            </Text>
          </View>
          
          <View style={styles.arrowContainer}>
            <Ionicons 
              name="chevron-forward" 
              size={24} 
              color={option.color} 
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#001a33',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Extra padding at bottom
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#001a33',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#6c5ce7',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  rolesContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  roleCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 4, // Small margin for better spacing
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 16,
    textAlign: 'center',
  },
});
