import React from "react";
import { View, StyleSheet } from "react-native";
import { useConnectionStore } from "../stores/connection-store";
import { ChannelIndicator } from "./ChannelIndicator";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConnectionBar() {
  const dataConnected = useConnectionStore((s) => s.dataConnected);
  const meshActive = useConnectionStore((s) => s.meshActive);
  const meshPeerCount = useConnectionStore((s) => s.meshPeerCount);
  const smsAvailable = useConnectionStore((s) => s.smsAvailable);

  return (
    <View style={styles.container}>
      <ChannelIndicator channel="data" active={dataConnected} />
      <ChannelIndicator
        channel="mesh"
        active={meshActive}
        detail={meshActive ? `${meshPeerCount} peers` : undefined}
      />
      <ChannelIndicator channel="sms" active={smsAvailable} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
});
