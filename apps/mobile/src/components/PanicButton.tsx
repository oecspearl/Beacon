import React, { useCallback, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Vibration } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOLD_DURATION_MS = 3000;
const BUTTON_SIZE = 140;
const RING_SIZE = BUTTON_SIZE + 24;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PanicButton() {
  const router = useRouter();
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animation values
  const progress = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const startPulse = useCallback(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [pulseScale]);

  const navigateToPanic = useCallback(() => {
    router.push("/panic");
  }, [router]);

  const handlePressIn = useCallback(() => {
    // Start countdown ring animation
    progress.value = withTiming(1, {
      duration: HOLD_DURATION_MS,
      easing: Easing.linear,
    });

    // Scale down slightly for tactile feedback
    buttonScale.value = withTiming(0.95, { duration: 150 });

    // Vibrate pattern during hold
    Vibration.vibrate([0, 100, 200, 100, 200, 100]);

    // Set timer for activation
    holdTimer.current = setTimeout(() => {
      Vibration.vibrate(500);
      runOnJS(navigateToPanic)();
    }, HOLD_DURATION_MS);
  }, [progress, buttonScale, navigateToPanic]);

  const handlePressOut = useCallback(() => {
    // Cancel activation
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    // Reset animations
    progress.value = withTiming(0, { duration: 200 });
    buttonScale.value = withTiming(1, { duration: 200 });
  }, [progress, buttonScale]);

  // Animated ring style -- uses SVG-like stroke via border trick
  const ringStyle = useAnimatedStyle(() => {
    const rotation = progress.value * 360;
    return {
      transform: [{ rotate: `${rotation}deg` }],
      opacity: progress.value > 0 ? 1 : 0,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value * pulseScale.value }],
  }));

  // Start the idle pulse
  React.useEffect(() => {
    startPulse();
  }, [startPulse]);

  return (
    <View style={styles.container}>
      {/* Countdown ring */}
      <Animated.View style={[styles.ring, ringStyle]}>
        <View style={styles.ringHalf} />
      </Animated.View>

      {/* Main button */}
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[styles.button, buttonAnimatedStyle]}>
          <View style={styles.buttonInner}>
            <Ionicons name="alert-circle" size={40} color="#fff" />
            <Text style={styles.buttonText}>HOLD FOR</Text>
            <Text style={styles.buttonTextBold}>EMERGENCY</Text>
          </View>
        </Animated.View>
      </Pressable>

      {/* Progress indicator text */}
      <Text style={styles.hint}>Hold for 3 seconds to activate</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: "#ef4444",
    borderTopColor: "transparent",
  },
  ringHalf: {
    flex: 1,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    // Shadow
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
    letterSpacing: 1,
  },
  buttonTextBold: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  hint: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 16,
    textAlign: "center",
  },
});
