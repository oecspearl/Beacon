import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  COUNTRY_BOUNDS,
  COUNTRY_NAMES,
  ESTIMATED_SIZES_MB,
  downloadOfflinePack,
  getDownloadedPacks,
  deleteOfflinePack,
} from "../src/services/maps";

// ---------------------------------------------------------------------------
// Map Download Management Screen
//
// Allows users to download, view, and manage offline map tile packs for
// each pilot country. Accessible from the main map screen.
// ---------------------------------------------------------------------------

/** Country codes for the three pilot countries */
const PILOT_COUNTRIES = ["CU", "JM", "TT"] as const;

interface PackInfo {
  countryCode: string;
  name: string;
  countryName: string;
  estimatedSizeMB: number;
  isDownloaded: boolean;
  isDownloading: boolean;
  progress: number;
}

export default function MapDownloadScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStorageMB, setTotalStorageMB] = useState(0);

  // -----------------------------------------------------------------------
  // Load downloaded packs on mount
  // -----------------------------------------------------------------------

  const refreshPacks = useCallback(async () => {
    setLoading(true);

    let downloadedNames: Set<string> = new Set();

    try {
      const existingPacks = await getDownloadedPacks();
      downloadedNames = new Set(
        existingPacks.map((p: any) => p.name ?? p._metadata?.name ?? ""),
      );
    } catch {
      // MapLibre may not be available — gracefully handle
      console.log("[MapDownload] Could not fetch existing packs (native module may be unavailable)");
    }

    const packInfos: PackInfo[] = PILOT_COUNTRIES.map((code) => {
      const packName = `${code.toLowerCase()}-offline`;
      const isDownloaded = downloadedNames.has(packName);

      return {
        countryCode: code,
        name: packName,
        countryName: COUNTRY_NAMES[code] ?? code,
        estimatedSizeMB: ESTIMATED_SIZES_MB[code] ?? 50,
        isDownloaded,
        isDownloading: false,
        progress: isDownloaded ? 100 : 0,
      };
    });

    setPacks(packInfos);

    // Calculate total storage
    const total = packInfos
      .filter((p) => p.isDownloaded)
      .reduce((sum, p) => sum + p.estimatedSizeMB, 0);
    setTotalStorageMB(total);

    setLoading(false);
  }, []);

  useEffect(() => {
    refreshPacks();
  }, [refreshPacks]);

  // -----------------------------------------------------------------------
  // Download a country pack
  // -----------------------------------------------------------------------

  const handleDownload = useCallback(
    async (countryCode: string) => {
      const bounds = COUNTRY_BOUNDS[countryCode];
      if (!bounds) return;

      const packName = `${countryCode.toLowerCase()}-offline`;

      // Update state to show downloading
      setPacks((prev) =>
        prev.map((p) =>
          p.countryCode === countryCode
            ? { ...p, isDownloading: true, progress: 0 }
            : p,
        ),
      );

      try {
        await downloadOfflinePack(packName, bounds, 1, 14);

        // Mark as downloaded
        setPacks((prev) =>
          prev.map((p) =>
            p.countryCode === countryCode
              ? { ...p, isDownloading: false, isDownloaded: true, progress: 100 }
              : p,
          ),
        );

        // Recalculate storage
        setTotalStorageMB((prev) => prev + (ESTIMATED_SIZES_MB[countryCode] ?? 50));
      } catch (err) {
        console.error(`[MapDownload] Failed to download ${countryCode}:`, err);

        setPacks((prev) =>
          prev.map((p) =>
            p.countryCode === countryCode
              ? { ...p, isDownloading: false, progress: 0 }
              : p,
          ),
        );

        Alert.alert(
          "Download Failed",
          `Could not download the map pack for ${COUNTRY_NAMES[countryCode] ?? countryCode}. Please check your internet connection and try again.`,
        );
      }
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Delete a pack
  // -----------------------------------------------------------------------

  const handleDelete = useCallback(
    (countryCode: string) => {
      const countryName = COUNTRY_NAMES[countryCode] ?? countryCode;
      const packName = `${countryCode.toLowerCase()}-offline`;

      Alert.alert(
        "Delete Offline Map",
        `Are you sure you want to delete the ${countryName} offline map? You will need to re-download it to use maps offline.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteOfflinePack(packName);

                setPacks((prev) =>
                  prev.map((p) =>
                    p.countryCode === countryCode
                      ? { ...p, isDownloaded: false, progress: 0 }
                      : p,
                  ),
                );

                setTotalStorageMB(
                  (prev) => Math.max(0, prev - (ESTIMATED_SIZES_MB[countryCode] ?? 50)),
                );
              } catch (err) {
                console.error(`[MapDownload] Failed to delete ${countryCode}:`, err);
                Alert.alert("Error", "Could not delete the map pack.");
              }
            },
          },
        ],
      );
    },
    [],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Offline Maps</Text>
          <Text style={styles.subtitle}>
            Download maps for offline use
          </Text>
        </View>
      </View>

      {/* Storage summary */}
      <View style={styles.storageCard}>
        <View style={styles.storageRow}>
          <Ionicons name="server-outline" size={20} color="#3b82f6" />
          <View style={styles.storageInfo}>
            <Text style={styles.storageTitle}>Storage Used</Text>
            <Text style={styles.storageValue}>
              {totalStorageMB > 0
                ? `~${totalStorageMB} MB`
                : "No maps downloaded"}
            </Text>
          </View>
        </View>
        <View style={styles.storageBar}>
          <View
            style={[
              styles.storageBarFill,
              {
                width: `${Math.min(
                  100,
                  (totalStorageMB / 500) * 100,
                )}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.storageHint}>
          {packs.filter((p) => p.isDownloaded).length} of{" "}
          {PILOT_COUNTRIES.length} country maps downloaded
        </Text>
      </View>

      {/* Country list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading map packs...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {packs.map((pack) => (
            <View key={pack.countryCode} style={styles.packCard}>
              {/* Country info row */}
              <View style={styles.packHeader}>
                <View style={styles.packInfo}>
                  <View style={styles.countryFlag}>
                    <Ionicons
                      name="globe-outline"
                      size={24}
                      color="#3b82f6"
                    />
                  </View>
                  <View style={styles.packDetails}>
                    <Text style={styles.packName}>{pack.countryName}</Text>
                    <Text style={styles.packSize}>
                      ~{pack.estimatedSizeMB} MB {"\u2022"} Zoom levels 1-14
                    </Text>
                  </View>
                </View>

                {/* Status badge */}
                {pack.isDownloaded && (
                  <View style={styles.downloadedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#22c55e"
                    />
                    <Text style={styles.downloadedText}>Downloaded</Text>
                  </View>
                )}
              </View>

              {/* Progress bar (while downloading) */}
              {pack.isDownloading && (
                <View style={styles.downloadProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pack.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    Downloading... {pack.progress.toFixed(0)}%
                  </Text>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.packActions}>
                {!pack.isDownloaded && !pack.isDownloading && (
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(pack.countryCode)}
                  >
                    <Ionicons
                      name="download-outline"
                      size={18}
                      color="#fff"
                    />
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>
                )}

                {pack.isDownloading && (
                  <View style={styles.downloadingBtn}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text style={styles.downloadingBtnText}>
                      Downloading...
                    </Text>
                  </View>
                )}

                {pack.isDownloaded && (
                  <>
                    <View style={styles.readyBtn}>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#22c55e"
                      />
                      <Text style={styles.readyBtnText}>Ready</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(pack.countryCode)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ef4444"
                      />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}

          {/* Info note */}
          <View style={styles.infoNote}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748b"
            />
            <Text style={styles.infoNoteText}>
              Offline maps allow you to view the map and nearby POIs even
              without an internet connection. Download the map for your host
              country before travelling to areas with limited connectivity.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#16213e",
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  // Storage card
  storageCard: {
    marginHorizontal: 16,
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
    marginBottom: 16,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  storageInfo: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  storageValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e2e8f0",
    marginTop: 2,
  },
  storageBar: {
    height: 6,
    backgroundColor: "#1e293b",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  storageBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 3,
  },
  storageHint: {
    fontSize: 11,
    color: "#64748b",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#94a3b8",
  },

  // Country list
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // Pack card
  packCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  packHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  packInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  countryFlag: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#3b82f615",
    justifyContent: "center",
    alignItems: "center",
  },
  packDetails: {
    flex: 1,
  },
  packName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  packSize: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },

  // Status badge
  downloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#22c55e15",
  },
  downloadedText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#22c55e",
  },

  // Download progress
  downloadProgress: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#1e293b",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
  },

  // Action buttons
  packActions: {
    flexDirection: "row",
    gap: 10,
  },
  downloadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  downloadBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  downloadingBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1e293b",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 8,
  },
  downloadingBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  readyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e15",
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: "#22c55e30",
  },
  readyBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22c55e",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef444415",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#ef444430",
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
  },

  // Info note
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
  },
});
