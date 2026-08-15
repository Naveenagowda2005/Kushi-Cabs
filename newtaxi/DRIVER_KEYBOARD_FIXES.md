# Driver App Keyboard Handling Fixes

## Issue
In the driver signup page, when users tap on the "Confirm Password" field, the keyboard would appear and hide the field, making it impossible to see what they were typing.

## Root Cause
The original KeyboardAvoidingView configuration had several issues:
1. **Android behavior**: Used `undefined` which provides no keyboard avoidance
2. **Insufficient padding**: Not enough bottom padding to accommodate keyboard
3. **No scroll assistance**: No automatic scrolling to focused fields
4. **Missing keyboard offset**: No adjustment for navigation/header space

## Fixes Applied

### 1. Improved KeyboardAvoidingView Configuration
```javascript
<KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  // Changed from 'undefined'
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}  // Added offset
  enabled
>
```

### 2. Enhanced ScrollView Properties
```javascript
<ScrollView 
  ref={scrollViewRef}
  contentContainerStyle={styles.scroll} 
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
  bounces={false}
  enableOnAndroid={true}        // Added
  extraScrollHeight={20}        // Added
>
```

### 3. Increased Bottom Padding
```javascript
scroll: { 
  padding: 24, 
  paddingTop: 60, 
  paddingBottom: 150,  // Increased from 100 to 150
  flexGrow: 1,
  justifyContent: 'flex-start'
}
```

### 4. Automatic Scroll to Confirm Password Field
```javascript
<Field 
  label="Confirm Password" 
  // ... other props
  ref={confirmPasswordRef}
  onFocus={() => {
    // Scroll to make confirm password field visible when focused
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }}
/>
```

### 5. Enhanced Field Component with Ref Support
```javascript
const Field = React.forwardRef(({ label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, onFocus }, ref) => {
  return (
    <View style={styles.fieldWrap}>
      {/* ... */}
      <TextInput
        ref={ref}
        // ... other props
        onFocus={onFocus}
      />
    </View>
  );
});
```

## Expected Behavior After Fixes

1. **iOS**: Uses `padding` behavior with proper keyboard avoidance
2. **Android**: Uses `height` behavior with 20px vertical offset
3. **Confirm Password Field**: Automatically scrolls into view when focused
4. **All Fields**: Remain visible and accessible when keyboard appears
5. **Smooth Experience**: No field gets hidden behind the keyboard

## Testing Recommendations

1. Test on both iOS and Android devices/simulators
2. Test with different keyboard heights (standard, emoji, etc.)
3. Verify all form fields remain accessible when keyboard is open
4. Ensure smooth scrolling when tapping confirm password field
5. Test form submission works properly after keyboard interactions

## Platform-Specific Notes

- **iOS**: Uses `padding` behavior which adjusts the view's padding
- **Android**: Uses `height` behavior which adjusts the view's height
- **Both**: Extra bottom padding ensures content doesn't get cut off
- **Automatic Scrolling**: Helps ensure the focused field is always visible