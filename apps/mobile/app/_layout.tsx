import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { initializeDatabase } from "../src/services/database";

// ---------------------------------------------------------------------------
// Root layout
// ---------------------------------------------------------------------------

export default function RootLayout() {
  useEffect(() => {
    // Initialise the local SQLite database on app start
    initializeDatabase().catch((err) => {
      console.error("[App] Failed to initialise database:", err);
    });
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#1a1a2e" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="panic"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="checkin"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="registration"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="protocols/index"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="protocols/[id]"
            options={{
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="map-download"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
});
