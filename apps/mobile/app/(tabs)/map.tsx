import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppStore } from "../../src/stores/app-store";
import {
  ALL_POIS,
  POI,
  POIType,
  POI_COLORS,
  POI_LABELS,
  POI_ICONS,
  getPOIsForCountry,
} from "../../src/data/poi-markers";
import {
  DEFAULT_STYLE_URL,
  initializeMapLibre,
  downloadOfflinePack,
  COUNTRY_BOUNDS,
  COUNTRY_NAMES,
  resolveCountryCode,
  getCountryCentre,
} from "../../src/services/maps";

// ---------------------------------------------------------------------------
// Attempt to import MapLibre — it requires a native build and will not be
// available in Expo Go. We gracefully degrade to a placeholder if the
// native module cannot be resolved.
// ---------------------------------------------------------------------------

let MapLibreGL: typeof import("@maplibre/maplibre-react-native") | null = null;
let MapLibreAvailable = false;

try {
  MapLibreGL = require("@maplibre/maplibre-react-native");
  MapLibreAvailable = true;
} catch {
  MapLibreAvailable = false;
}

// ---------------------------------------------------------------------------
// Map Screen
//
// Full map implementation using MapLibre GL Native with offline tile
// support, POI markers, and a floating control panel.
// ---------------------------------------------------------------------------

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const studentProfile = useAppStore((s) => s.studentProfile);

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [mapReady, setMapReady] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"searching" | "locked" | "error">(
    "searching",
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<POIType>>(
    new Set([
      "embassy",
      "hospital",
      "airport",
      "seaport",
      "police",
      "evacuation_point",
      "safe_zone",
    ]),
  );

  const cameraRef = useRef<any>(null);

  // -----------------------------------------------------------------------
  // Determine the student's host country and relevant POIs
  // -----------------------------------------------------------------------

  const hostCountry = studentProfile?.hostCountry ?? "";
  const countryCode = resolveCountryCode(hostCountry);
  const countryCentre = countryCode
    ? getCountryCentre(countryCode)
    : undefined;

  /** Default centre: Kingston, Jamaica if no profile */
  const defaultCentre: [number, number] = countryCentre ?? [-76.79, 18.01];

  const visiblePOIs = useMemo(() => {
    const basePOIs =
      hostCountry && hostCountry.length > 0
        ? getPOIsForCountry(hostCountry)
        : ALL_POIS;

    return basePOIs.filter((poi) => activeFilters.has(poi.type));
  }, [hostCountry, activeFilters]);

  // -----------------------------------------------------------------------
  // Initialise MapLibre on mount
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (MapLibreAvailable) {
      initializeMapLibre().catch((err) => {
        console.error("[MapScreen] Failed to initialise MapLibre:", err);
      });
    }
  }, []);

  // -----------------------------------------------------------------------
  // Filter toggle
  // -----------------------------------------------------------------------

  const toggleFilter = useCallback((type: POIType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // -----------------------------------------------------------------------
  // Download offline map
  // -----------------------------------------------------------------------

  const handleDownloadMap = useCallback(async () => {
    if (!countryCode) return;

    const bounds = COUNTRY_BOUNDS[countryCode];
    if (!bounds) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadOfflinePack(
        `${countryCode.toLowerCase()}-offline`,
        bounds,
        1,
        14,
      );
      setDownloadProgress(100);
    } catch (err) {
      console.error("[MapScreen] Download failed:", err);
    } finally {
      setDownloading(false);
    }
  }, [countryCode]);

  // -----------------------------------------------------------------------
  // GeoJSON source for POI markers
  // -----------------------------------------------------------------------

  const poiGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: visiblePOIs.map((poi) => ({
        type: "Feature" as const,
        id: poi.id,
        properties: {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          phone: poi.phone ?? "",
          address: poi.address ?? "",
          color: POI_COLORS[poi.type],
          icon: POI_ICONS[poi.type],
        },
        geometry: {
          type: "Point" as const,
          coordinates: [poi.longitude, poi.latitude],
        },
      })),
    };
  }, [visiblePOIs]);

  // -----------------------------------------------------------------------
  // Render: Fallback when MapLibre is not available
  // -----------------------------------------------------------------------

  if (!MapLibreAvailable || !MapLibreGL) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Map</Text>
          <Text style={styles.subtitle}>Offline-capable situation map</Text>
        </View>

        <View style={styles.fallbackContainer}>
          <View style={styles.fallbackContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="map-outline" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.fallbackTitle}>Native Build Required</Text>
            <Text style={styles.fallbackText}>
              Map requires native build {"\u2014"} run{" "}
              <Text style={styles.codeText}>expo run:ios</Text> or{" "}
              <Text style={styles.codeText}>expo run:android</Text> to use
              MapLibre GL with offline tiles.
            </Text>
            <Text style={styles.fallbackHint}>
              The map will not work in Expo Go because MapLibre GL Native
              requires custom native modules.
            </Text>
          </View>

          {/* Show POI summary even without the map */}
          <View style={styles.fallbackPOIList}>
            <Text style={styles.fallbackPOIHeader}>
              Available POIs ({visiblePOIs.length})
            </Text>
            <ScrollView style={styles.fallbackScroll}>
              {visiblePOIs.map((poi) => (
                <View key={poi.id} style={styles.fallbackPOIRow}>
                  <View
                    style={[
                      styles.fallbackDot,
                      { backgroundColor: POI_COLORS[poi.type] },
                    ]}
                  />
                  <View style={styles.fallbackPOIInfo}>
                    <Text style={styles.fallbackPOIName}>{poi.name}</Text>
                    <Text style={styles.fallbackPOIType}>
                      {POI_LABELS[poi.type]}
                      {poi.phone ? ` \u2022 ${poi.phone}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(Object.keys(POI_COLORS) as POIType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  activeFilters.has(type) && {
                    backgroundColor: POI_COLORS[type] + "30",
                    borderColor: POI_COLORS[type],
                  },
                ]}
                onPress={() => toggleFilter(type)}
              >
                <View
                  style={[
                    styles.filterDot,
                    { backgroundColor: POI_COLORS[type] },
                    !activeFilters.has(type) && styles.filterDotInactive,
                  ]}
                />
                <Text
                  style={[
                    styles.filterLabel,
                    activeFilters.has(type) && { color: "#e2e8f0" },
                  ]}
                >
                  {POI_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomPanel}>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotSearching]} />
              <Text style={styles.statusLabel}>GPS: Unavailable</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={() => router.push("/map-download")}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={styles.downloadButtonText}>Manage Offline Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Render: Full MapLibre map
  // -----------------------------------------------------------------------

  const MGL = MapLibreGL.default ?? MapLibreGL;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header overlay */}
      <View style={styles.headerOverlay}>
        <Text style={styles.title}>Map</Text>
      </View>

      {/* MapLibre map view */}
      <MGL.MapView
        style={styles.map}
        styleURL={DEFAULT_STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => {
          setMapReady(true);
          setGpsStatus("locked");
        }}
      >
        {/* Camera */}
        <MGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: defaultCentre,
            zoomLevel: 10,
          }}
          followUserLocation={false}
          animationDuration={500}
        />

        {/* User location */}
        <MGL.UserLocation
          visible={true}
          onUpdate={(location: any) => {
            if (location?.coords) {
              setGpsStatus("locked");
            }
          }}
        />

        {/* POI markers using ShapeSource + SymbolLayer/CircleLayer */}
        <MGL.ShapeSource
          id="poi-source"
          shape={poiGeoJSON as any}
          onPress={(e: any) => {
            const feature = e?.features?.[0];
            if (feature?.properties?.id) {
              const poi = visiblePOIs.find(
                (p) => p.id === feature.properties.id,
              );
              setSelectedPOI(poi ?? null);
            }
          }}
        >
          {/* Circle markers coloured by type */}
          <MGL.CircleLayer
            id="poi-circles"
            style={{
              circleRadius: 8,
              circleColor: ["get", "color"],
              circleStrokeWidth: 2,
              circleStrokeColor: "#ffffff",
              circleOpacity: 0.9,
            }}
          />

          {/* Text labels */}
          <MGL.SymbolLayer
            id="poi-labels"
            style={{
              textField: ["get", "name"],
              textSize: 11,
              textColor: "#e2e8f0",
              textHaloColor: "#1a1a2e",
              textHaloWidth: 1.5,
              textOffset: [0, 1.5],
              textAnchor: "top",
              textMaxWidth: 10,
            }}
          />
        </MGL.ShapeSource>
      </MGL.MapView>

      {/* Loading overlay */}
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading map tiles...</Text>
        </View>
      )}

      {/* Selected POI callout */}
      {selectedPOI && (
        <View style={styles.callout}>
          <View style={styles.calloutHeader}>
            <View
              style={[
                styles.calloutTypeBadge,
                { backgroundColor: POI_COLORS[selectedPOI.type] + "30" },
              ]}
            >
              <Ionicons
                name={POI_ICONS[selectedPOI.type] as any}
                size={14}
                color={POI_COLORS[selectedPOI.type]}
              />
              <Text
                style={[
                  styles.calloutTypeText,
                  { color: POI_COLORS[selectedPOI.type] },
                ]}
              >
                {POI_LABELS[selectedPOI.type]}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPOI(null)}>
              <Ionicons name="close-circle" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.calloutName}>{selectedPOI.name}</Text>
          {selectedPOI.address && (
            <Text style={styles.calloutDetail}>{selectedPOI.address}</Text>
          )}
          {selectedPOI.phone && (
            <View style={styles.calloutPhoneRow}>
              <Ionicons name="call-outline" size={14} color="#3b82f6" />
              <Text style={styles.calloutPhone}>{selectedPOI.phone}</Text>
            </View>
          )}
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(Object.keys(POI_COLORS) as POIType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                activeFilters.has(type) && {
                  backgroundColor: POI_COLORS[type] + "30",
                  borderColor: POI_COLORS[type],
                },
              ]}
              onPress={() => toggleFilter(type)}
            >
              <View
                style={[
                  styles.filterDot,
                  { backgroundColor: POI_COLORS[type] },
                  !activeFilters.has(type) && styles.filterDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.filterLabel,
                  activeFilters.has(type) && { color: "#e2e8f0" },
                ]}
              >
                {POI_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom floating panel */}
      <View style={styles.bottomPanel}>
        {/* GPS status */}
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                gpsStatus === "locked"
                  ? styles.statusDotLocked
                  : gpsStatus === "error"
                    ? styles.statusDotError
                    : styles.statusDotSearching,
              ]}
            />
            <Text style={styles.statusLabel}>
              GPS:{" "}
              {gpsStatus === "locked"
                ? "Locked"
                : gpsStatus === "error"
                  ? "Error"
                  : "Searching..."}
            </Text>
          </View>
          <View style={styles.statusItem}>
            <Ionicons name="layers-outline" size={14} color="#94a3b8" />
            <Text style={styles.statusLabel}>
              {visiblePOIs.length} POIs visible
            </Text>
          </View>
        </View>

        {/* Download progress */}
        {downloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${downloadProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Downloading... {downloadProgress.toFixed(0)}%
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {countryCode && (
            <TouchableOpacity
              style={[
                styles.downloadButton,
                downloading && styles.downloadButtonDisabled,
              ]}
              onPress={handleDownloadMap}
              disabled={downloading}
            >
              <Ionicons
                name="download-outline"
                size={18}
                color={downloading ? "#64748b" : "#fff"}
              />
              <Text
                style={[
                  styles.downloadButtonText,
                  downloading && { color: "#64748b" },
                ]}
              >
                {downloading
                  ? "Downloading..."
                  : `Download ${COUNTRY_NAMES[countryCode] ?? "Country"} Map`}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push("/map-download")}
          >
            <Ionicons name="settings-outline" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#e2e8f0",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  // Map
  map: {
    flex: 1,
  },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 12,
  },

  // Fallback (Expo Go)
  fallbackContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fallbackContent: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3b82f620",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  fallbackHint: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16,
  },
  codeText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#94a3b8",
  },

  // Fallback POI list
  fallbackPOIList: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  fallbackPOIHeader: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e2e8f0",
    marginBottom: 12,
  },
  fallbackScroll: {
    flex: 1,
  },
  fallbackPOIRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  fallbackDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  fallbackPOIInfo: {
    flex: 1,
  },
  fallbackPOIName: {
    fontSize: 13,
    color: "#e2e8f0",
    fontWeight: "500",
  },
  fallbackPOIType: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  // Callout
  callout: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 80,
    left: 16,
    right: 16,
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    zIndex: 20,
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calloutTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  calloutTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  calloutName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e2e8f0",
    marginBottom: 4,
  },
  calloutDetail: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 4,
  },
  calloutPhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  calloutPhone: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "500",
  },

  // Filter chips
  filterRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1a1a2eE6",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#16213e",
    borderWidth: 1,
    borderColor: "#1e293b",
    marginHorizontal: 4,
    gap: 6,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterDotInactive: {
    opacity: 0.3,
  },
  filterLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },

  // Bottom panel
  bottomPanel: {
    backgroundColor: "#16213e",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotLocked: {
    backgroundColor: "#22c55e",
  },
  statusDotSearching: {
    backgroundColor: "#eab308",
  },
  statusDotError: {
    backgroundColor: "#ef4444",
  },
  statusLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },

  // Progress
  progressContainer: {
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
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  downloadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: "#1e293b",
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  manageButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#1e293b",
    justifyContent: "center",
    alignItems: "center",
  },
});
