# Share Routine Feature - Documentation

## 🌟 Overview

The Share Routine feature allows users to share their skincare routines as beautiful, formatted social posts on the DeepSkyn feed. This premium feature includes:

- ✨ **Beautiful Modal Interface** - Premium UX/UI with gradient design
- 📋 **Routine Preview** - Show all routine steps in the share dialog
- 💬 **Custom Messages** - Add personalized messages to your routine share
- 🎨 **Theme Integration** - Fully integrated with DeepSkyn's design system
- 📱 **Mobile-First Design** - Optimized for React Native/Expo
- 🚀 **Seamless Integration** - Simple hooks and components

---

## 📦 Components

### ShareButton

A reusable button component for triggering the share modal.

**Props:**
- `onPress: () => void` - Callback when button is pressed
- `variant?: 'filled' | 'outline' | 'icon'` - Button style (default: 'filled')
- `size?: 'sm' | 'md' | 'lg'` - Button size (default: 'md')
- `disabled?: boolean` - Disable the button
- `loading?: boolean` - Show loading state
- `style?: ViewStyle` - Custom styles

**Usage:**
```tsx
import { ShareButton } from '../components';

export function MyScreen() {
  const handleShare = () => {
    openShareModal(routine);
  };

  return <ShareButton onPress={handleShare} variant="filled" size="md" />;
}
```

### ShareRoutineModal

Premium modal for sharing routines with beautiful UI.

**Props:**
- `visible: boolean` - Control modal visibility
- `routine: Routine | null` - Routine to share
- `onClose: () => void` - Close callback
- `onShare: (message?: string, image?: string) => Promise<void>` - Share callback

**Features:**
- Gradient headers matching routine type (🌅 AM, 🌙 PM, ⭐ Weekly)
- Step previews with product information
- Character-limited custom message input
- Real-time post preview
- Tips and premium badge

**Usage:**
```tsx
import { ShareRoutineModal } from '../components';

<ShareRoutineModal
  visible={isModalVisible}
  routine={selectedRoutine}
  onClose={closeShareModal}
  onShare={shareRoutine}
/>
```

---

## 🎣 Hook - useShareRoutine

Custom React hook that manages the share routine state and API calls.

**Returns:**
```typescript
{
  isModalVisible: boolean;
  selectedRoutine: Routine | null;
  isLoading: boolean;
  openShareModal: (routine: Routine) => void;
  closeShareModal: () => void;
  shareRoutine: (message?: string, image?: string) => Promise<any>;
}
```

**Basic Usage:**
```tsx
import { useShareRoutine } from '../lib/hooks';

export function RoutineScreen() {
  const {
    isModalVisible,
    selectedRoutine,
    openShareModal,
    closeShareModal,
    shareRoutine,
  } = useShareRoutine();

  return (
    <>
      <Button onPress={() => openShareModal(routine)}>Share</Button>
      <ShareRoutineModal
        visible={isModalVisible}
        routine={selectedRoutine}
        onClose={closeShareModal}
        onShare={shareRoutine}
      />
    </>
  );
}
```

---

## 🔌 Backend Integration

### New Endpoint

**POST** `/routines/:id/share`

Create a social post from a routine.

**Request:**
```typescript
interface ShareRoutineDto {
  routineId: string;
  customMessage?: string;
  coverImage?: string;
}
```

**Response:**
```json
{
  "post": {
    "id": "uuid",
    "userId": "uuid",
    "message": "Formatted routine post",
    "media": "image_url",
    "createdAt": "2026-03-26T...",
    "_count": { "likes": 0, "comments": 0 }
  },
  "routine": { ...routine data },
  "message": "Routine partagée avec succès!"
}
```

### Post Message Format

Routines are formatted into attractive posts with:

```
🌅 My Morning Routine
AM • 7 étapes

💬 "Great for oily skin!"

📋 Routine:
1. Nettoyage - CeraVe Hydrating Cleanser ⏱️ 1min
2. Tonique - Paula's Choice 2% BHA ⏱️ 1min
...

📝 Notes: Perfect for sensitive skin

#SkincareRoutine #DeepSkyn #BeautyCare
```

---

## 📱 Frontend Services

### routineService.shareRoutine()

```typescript
// Service
async shareRoutine(
  routineId: string,
  data: Partial<ShareRoutineDto>
): Promise<any>

// Usage
const result = await routineService.shareRoutine(routineId, {
  customMessage: "Check out my routine!",
  coverImage: "image_url"
});
```

---

## 🎨 Design System Integration

The feature uses the DeepSkyn design system:

**Colors:**
- Primary: `#0EA5E9` (Cyan-Blue)
- Morning: `#FBBF24` → `#F59E0B` (Gold gradient)
- Evening: `#8B5CF6` → `#6366F1` (Purple gradient)
- Success: `#10B981`

**Components:**
- Button
- Input
- Card
- Badge
- LinearGradient (from expo-linear-gradient)

**Spacing & Typography:**
- Uses Spacing constants (xs, sm, md, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- Font sizes: xs(12) → sm(14) → base(16) → lg(18) → xl(20) → 2xl(24)
- Font weights: normal(400), medium(500), semibold(600), bold(700)

---

## 🛠️ Implementation Guide

### Step 1: Add Share Button to Your Screen

```tsx
import { ShareButton, ShareRoutineModal } from '../components';
import { useShareRoutine } from '../lib/hooks';

export function RoutineScreen({ routine }) {
  const {
    isModalVisible,
    selectedRoutine,
    openShareModal,
    closeShareModal,
    shareRoutine,
  } = useShareRoutine();

  return (
    <View>
      {/* Your routine content */}
      
      <ShareButton
        onPress={() => openShareModal(routine)}
        variant="filled"
        size="md"
      />

      <ShareRoutineModal
        visible={isModalVisible}
        routine={selectedRoutine}
        onClose={closeShareModal}
        onShare={shareRoutine}
      />
    </View>
  );
}
```

### Step 2: Customize Button Style

Choose from 3 variants:

```tsx
// Filled (default)
<ShareButton variant="filled" size="md" />

// Outline
<ShareButton variant="outline" size="md" />

// Icon only
<ShareButton variant="icon" />
```

### Step 3: Handle the Modal

The modal automatically:
- Shows routine preview
- Accepts custom messages
- Displays post preview
- Handles API calls
- Shows success/error messages

---

## 🎯 Features Breakdown

### 1. Routine Formatting
- Type emoji (🌅 AM, 🌙 PM, ⭐ Weekly)
- Routine name and step count
- Step-by-step preview with product info
- Estimated time for each step

### 2. Custom Messaging
- Optional personal message (max 200 characters)
- Character counter
- Preview updates in real-time

### 3. Post Preview
- Shows exact post content
- Includes formatting with emojis
- Shows hashtags
- Responsive to custom message changes

### 4. UI/UX Premium Features
- Gradient headers matching routine type
- Smooth animations
- Loading states
- Error handling
- Success feedback
- Premium badge
- Tips section

---

## 🔒 Error Handling

All errors are caught and displayed to users:

```tsx
try {
  await shareRoutine(message);
  Alert.alert('Succès', 'Routine partagée avec succès!');
} catch (error) {
  Alert.alert('Erreur', error.message);
}
```

---

## 📊 Types

### ShareRoutineDto

```typescript
interface ShareRoutineDto {
  routineId: string;
  customMessage?: string;
  coverImage?: string;
}
```

### Routine

```typescript
interface Routine {
  id: string;
  userId: string;
  name: string;
  type: 'AM' | 'PM' | 'weekly';
  steps: RoutineStep[];
  isAIGenerated: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🚀 Performance Tips

1. **Memoize Components**: Use `React.memo` for custom message input to prevent re-renders
2. **Lazy Load**: Only instantiate the modal when user clicks share button
3. **Debounce**: Character counter updates are naturally debounced
4. **Error Boundaries**: Wrap in error boundary for production

---

## 🐛 Troubleshooting

### Modal not opening?
- Check if `useShareRoutine` hook is imported correctly
- Ensure routine object is not null
- Check if `openShareModal` is called with a valid routine

### Styles not applied?
- Verify theme colors are exported from `/src/theme`
- Check if LinearGradient is properly installed (`expo-linear-gradient`)
- Ensure all components use exported Spacing/FontSizes

### API errors?
- Check backend URL in `api-client.ts`
- Verify authentication token is present
- Check POST `/routines/:id/share` endpoint exists
- Verify routine ID and user authentication

---

## 📝 Notes

- The feature is fully responsive for mobile devices
- Works with both React Native and Expo
- Integrates with existing DeepSkyn authentication
- Posts are published to main feed immediately
- Custom messages are optional
- Supports emoji in post messages
- Mobile-optimized with touch-friendly interfaces

---

## 🔄 API Flow

```
User clicks Share Button
    ↓
openShareModal(routine)
    ↓
ShareRoutineModal appears with preview
    ↓
User adds custom message (optional)
    ↓
User clicks "Partager"
    ↓
shareRoutine() called with message
    ↓
POST /routines/:id/share
    ↓
Server formats routine as post
    ↓
Post created in database
    ↓
Response returned to frontend
    ↓
Success alert shown
    ↓
Modal closes, screen updates
```

---

For more information, see:
- Backend: [Backend Share Routine Implementation]
- Frontend: [Components and Hooks]
- Theme: [Design System Documentation]
