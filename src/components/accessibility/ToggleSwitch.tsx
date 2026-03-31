import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  accessibilityLabel?: string;
}

export function ToggleSwitch({ checked, onChange, accessibilityLabel }: ToggleSwitchProps) {
  const translateX = React.useRef(new Animated.Value(checked ? 22 : 2)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: checked ? 22 : 2,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [checked, translateX]);

  return (
    <TouchableOpacity
      onPress={onChange}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
    >
      {checked ? (
        <LinearGradient
          colors={['#0EA5E9', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        >
          <Animated.View
            style={[
              styles.thumb,
              { transform: [{ translateX }] },
            ]}
          />
        </LinearGradient>
      ) : (
        <View style={[styles.track, styles.trackInactive]}>
          <Animated.View
            style={[
              styles.thumb,
              { transform: [{ translateX }] },
            ]}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  trackInactive: {
    backgroundColor: Colors.gray300,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});
