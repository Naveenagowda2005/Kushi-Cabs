import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { getResponsiveFontSize, getResponsivePadding } from '../utils/responsive';

export default function CustomDateTimePicker({
  value,
  onChange,
  mode = 'datetime', // 'date', 'time', or 'datetime'
  placeholder = 'Select date and time',
  label,
  style,
}) {
  const [show, setShow] = useState(false);
  const [currentMode, setCurrentMode] = useState('date');

  const handleChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const showDatePicker = () => {
    setCurrentMode('date');
    setShow(true);
  };

  const showTimePicker = () => {
    setCurrentMode('time');
    setShow(true);
  };

  const formatDateTime = (date) => {
    if (!date) return placeholder;
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  const formatTime = (date) => {
    if (!date) return 'Select time';
    
    const options = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {mode === 'datetime' ? (
        <View style={styles.dateTimeContainer}>
          {/* Date Button */}
          <TouchableOpacity
            style={[styles.button, styles.dateButton]}
            onPress={showDatePicker}
          >
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={[
              styles.buttonText,
              { color: value ? COLORS.text : COLORS.textSecondary }
            ]}>
              {formatDate(value)}
            </Text>
          </TouchableOpacity>

          {/* Time Button */}
          <TouchableOpacity
            style={[styles.button, styles.timeButton]}
            onPress={showTimePicker}
          >
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <Text style={[
              styles.buttonText,
              { color: value ? COLORS.text : COLORS.textSecondary }
            ]}>
              {formatTime(value)}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.singleButton}
          onPress={() => {
            setCurrentMode(mode);
            setShow(true);
          }}
        >
          <Ionicons 
            name={mode === 'date' ? 'calendar-outline' : 'time-outline'} 
            size={20} 
            color={COLORS.primary} 
          />
          <Text style={[
            styles.buttonText,
            { color: value ? COLORS.text : COLORS.textSecondary }
          ]}>
            {mode === 'date' ? formatDate(value) : 
             mode === 'time' ? formatTime(value) : 
             formatDateTime(value)}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      )}

      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={currentMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateButton: {
    flex: 1,
  },
  timeButton: {
    flex: 1,
  },
  singleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonText: {
    flex: 1,
    fontSize: getResponsiveFontSize(16),
    marginLeft: 12,
  },
});
