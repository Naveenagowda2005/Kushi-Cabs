# 🫧 Floating Bubble - Visual Design Guide

## Overview Visual

When the driver has an active trip and the app goes to background, the floating bubble appears in the bottom right corner of the screen.

---

## STATE 1: BUBBLE COLLAPSED (Default)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Other App - Messaging, Camera, Settings, etc...]             │
│                                                                  │
│                                                                  │
│                                                                  │
│                                                                  │
│                                        ╭─────────────────────┐  │
│                                        │  🟦 Kushi     [1]  ▼│  │
│                                        │  🟦 Cabs            │  │
│                                        │                     │  │
│                                        ╰─────────────────────┘  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

LEGEND:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Circle Details:
┌────────────────────────────────────────────┐
│         ╭──────────────────╮               │
│       ╱                      ╲             │
│      │                        │            │
│      │     🟦 Kushi    [1]  ▼│ ← Badge (red, trip count)
│      │     🟦 Cabs           │           
│      │                        │ ← Dropdown arrow (blue button)
│      │                        │           
│       ╲                      ╱            │
│         ╰──────────────────╯              │
│   (White circle with blue border)         │
│   (Size: ~360px × 360px)                  │
│   (Radius: 180px)                         │
└────────────────────────────────────────────┘

Colors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟦 Circle Background:    #FFFFFF (White)
🟦 Circle Border:        #0066CC (Kushi Blue)
🟦 Text Color:           #0066CC (Kushi Blue)
🟦 Badge Background:     #FF6B6B (Red)
🟦 Badge Text:           #FFFFFF (White)
🟦 Dropdown Button:      #0066CC (Kushi Blue)

Shadow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Drop Shadow: 0 4px 8px rgba(0,102,204,0.3)
Elevation: 12 (Android)
```

---

## STATE 2: BUBBLE WITH DETAILS ON HOVER/FOCUS

```
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Other App - Messaging, Camera, Settings, etc...]             │
│                                                                  │
│                                                                  │
│                                        ╭─────────────────────┐  │
│                                        │  🟦 Kushi     [1]  ▲│  │
│                                        │  🟦 Cabs            │  │
│                                        │                     │  │
│                                        ╰─────────────────────┘  │
│                                        │                       │
│                                        │ (Dropdown appears)   │
│                                        │                       │
│                                        ├─────────────────────┐  │
│                                        │ ACTIVE │    ₹500    │  │
│                                        ├─────────────────────┤  │
│                                        │ 📍 Pickup Location  │  │
│                                        │    Some place...    │  │
│                                        ├─────────────────────┤  │
│                                        │ 📍 Dropoff Location │  │
│                                        │    Some place...    │  │
│                                        ├─────────────────────┤  │
│                                        │ Tap to view details │  │
│                                        └─────────────────────┘  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

DROPDOWN MENU DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Width:        280dp (auto-expand)
Position:     Below bubble, right-aligned
Background:   #FFFFFF (White)
Border:       1px #E0E0E0 (Light Gray)
Border Radius: 12px
Padding:      12dp all sides
Shadow:       0 4px 8px rgba(0,0,0,0.15)
Elevation:    10 (Android)

Header Row:
┌─────────────────────────────────┐
│ ACTIVE     ₹500                │  
└─────────────────────────────────┘
Status Badge:   Red (#FF6B6B), white text, 10px font, bold
Fare Amount:    Blue (#0066CC), 14px font, bold, right-aligned

Location Rows:
┌─────────────────────────────────┐
│ 📍 Pickup Location             │
│    Connaught Place, Delhi      │  
└─────────────────────────────────┘
📍 Icon:        Red (#FF6B6B), 14px
Location Text:  Black (#333333), 12px, truncate to 2 lines
Margin:         6dp bottom

┌─────────────────────────────────┐
│ 📍 Dropoff Location            │
│    Airport, Delhi              │  
└─────────────────────────────────┘
📍 Icon:        Green (#4CAF50), 14px
Location Text:  Black (#333333), 12px, truncate to 2 lines

Footer:
┌─────────────────────────────────┐
│ Tap to view details →          │  
└─────────────────────────────────┘
Text:           Gray (#999999), 10px italic
Alignment:      Right
Margin Top:     6dp
```

---

## STATE 3: EXPANDED - SHOWING MULTIPLE TRIPS

```
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [Other App - Messaging, Camera, Settings, etc...]             │
│                                                                  │
│                                        ╭─────────────────────┐  │
│                                        │  🟦 Kushi     [2]  ▲│  │
│                                        │  🟦 Cabs            │  │
│                                        ╰─────────────────────┘  │
│                                        │                       │
│                                        ├─────────────────────┐  │
│                                        │ ACTIVE │    ₹500    │  │
│                                        │ 📍 Pickup 1         │  │
│                                        │ 📍 Dropoff 1        │  │
│                                        │ Tap for details →   │  │
│                                        ├─────────────────────┤  │
│                                        │ ACTIVE │    ₹300    │  │
│                                        │ 📍 Pickup 2         │  │
│                                        │ 📍 Dropoff 2        │  │
│                                        │ Tap for details →   │  │
│                                        └─────────────────────┘  │
│                                                                  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

If multiple trips exist, dropdown shows all of them.
Each trip card is scrollable (FlatList).
```

---

## INTERACTION FLOWS

### Flow 1: User Presses Home Button

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  STEP 1: App is in Active Trip Screen                           │
│  ─────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Active Trip Screen                                       │   │
│  │ Trip ID: TXN_12345                                      │   │
│  │ From: Pickup Location                                  │   │
│  │ To: Dropoff Location                                   │   │
│  │ Fare: ₹500                                             │   │
│  │ [Call] [Chat] [Navigation]                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  User presses HOME button ↓                                     │
│                                                                   │
│  STEP 2: App goes to Background                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Other App (Messaging, Maps, etc.)                       │   │
│  │                                                           │   │
│  │                                                           │   │
│  │                                        ╭─────────────────┐ │
│  │                                        │  Kushi Cabs  [1]▼│ │
│  │                                        │                 │ │
│  │                                        ╰─────────────────┘ │
│  │                      (Floating Bubble appears) ↑           │
│  │                                                             │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Flow 2: User Taps Floating Bubble

```
BEFORE:                              AFTER:
┌──────────────────────┐            ┌──────────────────────┐
│ Other App            │            │ Active Trip Screen   │
│                      │            │ From: Pickup Location│
│                      │            │ To: Dropoff Location │
│        [1]▼     ← Tap │ ────────→ │ Fare: ₹500          │
│                      │            │ [Call] [Chat] [Nav] │
└──────────────────────┘            └──────────────────────┘
  ↓                                     ↑
App goes to                          Bubble Disappears
foreground                           App becomes active
```

### Flow 3: User Taps Dropdown Arrow

```
COLLAPSED:                         EXPANDED:
╭─────────────────┐               ╭─────────────────┐
│ Kushi Cabs  [1]▼│ ← Tap arrow   │ Kushi Cabs  [1]▲│
│                 │ ───────────→  │                 │
╰─────────────────┘               ├─────────────────┤
                                  │ ACTIVE │ ₹500   │
                                  │ 📍 Pickup       │
                                  │ 📍 Dropoff      │
                                  └─────────────────┘
```

---

## DIMENSIONS & SPACING

### Bubble Circle

```
Size:           360px × 360px (180px radius)
Border Width:   3px
Border Color:   #0066CC (Blue)
Background:     #FFFFFF (White)
Padding:        20px
Shadow:         0 4px 8px rgba(0,102,204,0.3)
Position:       Bottom-Right
Margin:         20px from right, 40px from bottom
```

### Text Inside Bubble

```
"Kushi" Line:
  Font Size:    14px
  Font Weight:  700 (Bold)
  Color:        #0066CC
  Line Height:  16px
  
"Cabs" Line:
  Font Size:    12px
  Font Weight:  600 (Semi-bold)
  Color:        #0066CC
  Line Height:  14px
  
Combined:
  Total Height: ~32px
  Centered:     Vertically & Horizontally
```

### Trip Count Badge

```
Size:           28px × 28px (14px radius)
Background:     #FF6B6B (Red)
Border:         2px #FFFFFF (White)
Text:           14px, Bold, White
Position:       Top-Right of circle
Offset:         +8px from top-right corner
Shadow:         0 2px 4px rgba(255,107,107,0.3)
```

### Dropdown Arrow Button

```
Size:           32px × 32px (16px radius)
Background:     #0066CC (Blue)
Border:         2px #FFFFFF (White)
Icon:           Material Icons "expand-more" or "expand-less"
Icon Color:     #FFFFFF (White)
Position:       Top-Right corner
Offset:         -8px from top-right (overlaps circle)
Shadow:         0 2px 4px rgba(0,102,204,0.4)
Rotation:       0° when closed, 180° when open
```

### Dropdown Menu

```
Width:          280dp
Max Height:     400dp (scrollable if needed)
Background:     #FFFFFF (White)
Border:         1px solid #E0E0E0
Border Radius:  12px
Padding:        12dp
Position:       Below bubble, right-aligned
Margin Top:     10px gap from bubble
Shadow:         0 4px 8px rgba(0,0,0,0.15)

Trip Card:
  Padding:      12dp
  Border-Bottom: 1px solid #F0F0F0
  Background:   Transparent (or #FAFAFA on hover)
  
  Status Badge:
    Padding:    8px 12px
    Height:     Auto
    Background: #FF6B6B or #4CAF50
    Color:      White
    Font:       10px Bold
    
  Fare Amount:
    Font:       14px Bold
    Color:      #0066CC
    Alignment:  Right
    
  Location Row:
    Icon:       14px Ionicon "location"
    Text:       12px, truncate 2 lines
    Margin:     6dp bottom
    
  Tap Text:
    Font:       10px Italic
    Color:      #999999
    Alignment:  Right
```

---

## RESPONSIVE BEHAVIOR

### Screen Size Adaptation

**Small Screens (< 400px width)**:
```
Bubble:         Reduced to 300px × 300px
Text:           Font slightly smaller
Badge:          24px × 24px
Dropdown:       250dp width
```

**Normal Screens (400-700px width)**:
```
Bubble:         360px × 360px (standard)
Text:           Standard sizing
Badge:          28px × 28px (standard)
Dropdown:       280dp width (standard)
```

**Large Screens (> 700px width)**:
```
Bubble:         400px × 400px
Text:           Slightly larger
Badge:          32px × 32px
Dropdown:       320dp width
```

### Rotation Handling

```
Portrait Mode (Default):
  Position: Bottom-Right corner
  Dropdown: Opens downward or upward if near bottom edge
  
Landscape Mode:
  Position: Right edge, center vertically
  Dropdown: Opens to the left or right based on space
```

---

## ANIMATION & TRANSITIONS

### Bubble Appearance

```
Animation:     Spring animation
Duration:      0.3-0.4 seconds
Curve:         Ease-out
Scale:         0 → 1
Opacity:       0 → 1

Code:
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
    friction: 8,
    tension: 40,
  }).start();
```

### Dropdown Open/Close

```
Dropdown Arrow Rotation:
  Closed → Open:    0° → 180° (0.2s)
  Open → Closed:    180° → 0° (0.2s)
  Curve:            Ease-in-out

Dropdown Menu Appearance:
  Closed:           Opacity 0, Hidden
  Opening:          Opacity 0 → 1 (0.1s), Slide from top
  Open:             Opacity 1, Visible
  Closing:          Opacity 1 → 0 (0.1s), Slide to top
```

### Touch Feedback

```
Tap on Bubble:
  Scale:           1 → 0.95 → 1 (0.1s)
  Color:           #FFFFFF → #F5F5F5 → #FFFFFF (0.1s)
  
Tap on Trip Card:
  Background:      Transparent → #FAFAFA → Transparent (0.15s)
  Scale:           1 → 0.98 → 1 (0.15s)
```

---

## STATE TRANSITIONS

```
App Active
    ↓
Active Trip Detected
    ↓
AppState changes to "background"
    ↓
FloatingBubble appears (animation: scale 0→1)
    ↓
Bubble Visible (user can interact)
    ├─ Tap Bubble Circle → Opens app
    ├─ Tap Trip Card → Opens app
    └─ Tap Dropdown Arrow → Toggle dropdown
    ↓
AppState changes to "active"
    ↓
FloatingBubble disappears (animation: scale 1→0)
    ↓
App is now active, bubble hidden
```

---

## ACCESSIBILITY

### Touch Target Sizes

```
Bubble Circle:      MIN 48px (Apple recommendation)
                    ACTUAL 360px ✅ (Easily tappable)

Dropdown Arrow:     MIN 48px
                    ACTUAL 32px + 48px collision box

Trip Card:          MIN 48px height
                    ACTUAL ~120px ✅

Location Icon:      MIN 24px
                    ACTUAL 14px (acceptable in dense list)
```

### Color Contrast

```
Text on White:
  #0066CC (Blue) on #FFFFFF     ✅ High contrast
  #333333 (Black) on #FFFFFF    ✅ High contrast
  #999999 (Gray) on #FFFFFF     ✅ Acceptable

Text on Color:
  White on #0066CC (Blue)       ✅ High contrast
  White on #FF6B6B (Red)        ✅ High contrast
  White on #4CAF50 (Green)      ✅ High contrast
```

---

## BEFORE & AFTER SCREENSHOTS

### Before (No Floating Bubble)

```
┌──────────────────────────────────┐
│ Messages Chat Screen             │
│                                  │
│ Hey, where are you?              │
│                                  │
│ I'm waiting at the pickup point  │
│                                  │
│ ETA 5 minutes?                   │
│                                  │
│ [Type message...]                │
│                                  │
│                                  │
│                                  │
│                                  │
└──────────────────────────────────┘

User can't see they have active trip! ❌
```

### After (With Floating Bubble)

```
┌──────────────────────────────────┐
│ Messages Chat Screen             │
│                                  │
│ Hey, where are you?              │
│                                  │
│ I'm waiting at the pickup point  │
│                                  │
│ ETA 5 minutes?                   │
│                                  │
│ [Type message...]    ╭─────────┐│
│                      │ Kushi [1]││
│                      │ Cabs   ▼ ││
│                      ╰─────────┘│
│                                  │
│                                  │
└──────────────────────────────────┘

User can see active trip at a glance! ✅
Can tap to view details or open app!
```

---

## COLOR PALETTE

```
Primary Blue:       #0066CC (Kushi brand color)
  - Used for: Circle border, text, buttons, highlights
  - RGB: rgb(0, 102, 204)
  - HSL: hsl(210, 100%, 40%)

Red/Active:         #FF6B6B
  - Used for: Trip count badge, active status
  - RGB: rgb(255, 107, 107)
  - HSL: hsl(0, 100%, 71%)

Green/Completed:    #4CAF50
  - Used for: Completed status, icons
  - RGB: rgb(76, 175, 80)
  - HSL: hsl(122, 39%, 49%)

White:              #FFFFFF
  - Used for: Background, text on colored
  - RGB: rgb(255, 255, 255)

Black/Dark:         #333333
  - Used for: Primary text
  - RGB: rgb(51, 51, 51)

Light Gray:         #F0F0F0, #F5F5F5
  - Used for: Dividers, hover states
  - RGB: rgb(240, 240, 240)

Gray:               #999999
  - Used for: Secondary text
  - RGB: rgb(153, 153, 153)
```

---

## Summary

**Floating Bubble Visual Overview**:

| Element | Style | Size | Color |
|---------|-------|------|-------|
| Circle | Solid | 360×360px | White (#FFF) with Blue border (#0066CC) |
| Text | Bold | 14px / 12px | Blue (#0066CC) |
| Badge | Solid | 28×28px | Red (#FF6B6B) |
| Arrow Button | Solid | 32×32px | Blue (#0066CC) |
| Dropdown | Card | 280dp width | White with shadow |
| Status | Badge | 12×24px | Red (#FF6B6B) |
| Locations | Text | 12px | Black (#333) |
| Fare | Text | 14px Bold | Blue (#0066CC) |

**Position**: Bottom-Right corner of screen
**Animation**: Spring appear/disappear (0.3s)
**Interaction**: Tap bubble or dropdown arrow for menu
**Response**: Opens app when tapped

---

This is exactly how your floating bubble will look! 🎨✨

