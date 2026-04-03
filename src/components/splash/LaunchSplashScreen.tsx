import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontWeights } from '../../theme';

const DOT_COUNT = 3;

export function LaunchSplashScreen() {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(Array.from({ length: DOT_COUNT }, () => new Animated.Value(0))).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const dotLoop = Animated.loop(
      Animated.stagger(
        180,
        dotAnims.map((dotAnim) =>
          Animated.sequence([
            Animated.timing(dotAnim, {
              toValue: 1,
              duration: 420,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(dotAnim, {
              toValue: 0,
              duration: 420,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        )
      )
    );

    pulseLoop.start();
    dotLoop.start();

    return () => {
      pulseLoop.stop();
      dotLoop.stop();
    };
  }, [dotAnims, pulseAnim]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  return (
    <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.outerRing, { transform: [{ scale: pulseScale }] }]}>
          <View style={styles.logoCircle}>
            <LinearGradient colors={[Colors.primary, Colors.primaryLight]} style={styles.brandMark}>
              <Ionicons name="sparkles" size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.brandText}>DeepSkyn</Text>
          </View>
        </Animated.View>

        <View style={styles.loadingDots}>
          {dotAnims.map((dotAnim, index) => {
            const dotScale = dotAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.85, 1.22],
            });
            const dotOpacity = dotAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 1],
            });

            return (
              <Animated.View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  {
                    opacity: dotOpacity,
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  outerRing: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width:  130,
    height: 130,
    borderRadius: 58,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
    gap: 8,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.3,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.white,
  },
});

export default LaunchSplashScreen;
