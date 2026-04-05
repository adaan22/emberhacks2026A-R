import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker } from 'react-native-maps';
import campusData from './campus_data_estimated.json';

const { width, height } = Dimensions.get('window');

const CAMPUS_REGION = {
  latitude: 51.0784,
  longitude: -114.1295,
  latitudeDelta: 0.022,
  longitudeDelta: 0.022,
};

type LocationEntry = {
  name: string;
  coordinates: { lat: number; lng: number };
  busyness: number;
  category: string;
  popular_times: any;
};

function getCurrentBusyness(locationData: any): number {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const h = now.getHours();

  const graph = locationData?.popular_times?.graph_results?.[currentDay];
  if (!graph) return 0;

  const timeStr =
    h === 0 ? '12 AM'
    : h < 12 ? `${h} AM`
    : h === 12 ? '12 PM'
    : `${h - 12} PM`;

  const entry = graph.find((g: any) => g.time === timeStr);
  return entry?.busyness_score ?? 0;
}

function getCategory(name: string): string {
  if (['Noodle', 'Bake', 'Sushi', 'OPA', 'A&W', 'Subway', 'Tim Horton', 'Starbucks', 'Good Earth', 'Dining', 'Food Hall', 'Lounge', 'Den'].some(f => name.includes(f)))
    return 'Food & Drink';
  if (['Library', 'TFDL'].some(l => name.includes(l)))
    return 'Library';
  if (['Active Living', 'Oval', 'Kinesiology'].some(g => name.includes(g)))
    return 'Recreation';
  return 'Academic';
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Food & Drink': return '🍽';
    case 'Library': return '📚';
    case 'Recreation': return '🏃';
    default: return '🎓';
  }
}

function getBusynessColor(score: number): string {
  if (score <= 25) return '#22C55E';
  if (score <= 55) return '#F59E0B';
  if (score <= 75) return '#F97316';
  return '#EF4444';
}

function getBusynessLabel(score: number): string {
  if (score <= 25) return 'Quiet';
  if (score <= 55) return 'Moderate';
  if (score <= 75) return 'Busy';
  return 'Very Busy';
}

function getTodayHourlyData(locationData: any): { time: string; score: number }[] {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  return locationData?.popular_times?.graph_results?.[currentDay] ?? [];
}

export default function App() {
  const [selected, setSelected] = useState<LocationEntry | null>(null);
  const slideAnim = useRef(new Animated.Value(350)).current;
  const mapRef = useRef<MapView>(null);

  const locations: LocationEntry[] = Object.entries(campusData as any).map(
    ([name, data]: [string, any]) => ({
      name,
      coordinates: data.coordinates,
      popular_times: data.popular_times,
      busyness: getCurrentBusyness(data),
      category: getCategory(name),
    })
  );

  function selectLocation(loc: LocationEntry) {
    setSelected(loc);
    mapRef.current?.animateToRegion({
      latitude: loc.coordinates.lat - 0.004,
      longitude: loc.coordinates.lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 500);
  }

  function dismiss() {
    setSelected(null);
    mapRef.current?.animateToRegion(CAMPUS_REGION, 400);
  }

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: selected ? 0 : 350,
      useNativeDriver: true,
      tension: 80,
      friction: 14,
    }).start();
  }, [selected]);

  const hourlyData = selected ? getTodayHourlyData(selected.popular_times) : [];
  const currentHour = new Date().getHours();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={CAMPUS_REGION}
        showsUserLocation
        showsCompass={false}
        onPress={dismiss}
      >
        {locations.map((loc) => (
          <Marker
            key={loc.name}
            coordinate={{ latitude: loc.coordinates.lat, longitude: loc.coordinates.lng }}
            onPress={(e) => { e.stopPropagation(); selectLocation(loc); }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={[
              styles.marker,
              { backgroundColor: getBusynessColor(loc.busyness) },
              selected?.name === loc.name && styles.markerSelected,
            ]}>
              {selected?.name === loc.name && (
                <View style={styles.markerPulse} />
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>CampusBusy</Text>
          <Text style={styles.headerSub}>University of Calgary</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      {/* Legend */}
      {!selected && (
        <View style={styles.legend}>
          {[
            { label: 'Quiet', color: '#22C55E' },
            { label: 'Moderate', color: '#F59E0B' },
            { label: 'Busy', color: '#F97316' },
            { label: 'Very Busy', color: '#EF4444' },
          ].map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Bottom Card */}
      <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
        {selected && (
          <>
            <View style={styles.cardHandle} />

            {/* Card Header */}
            <View style={styles.cardTop}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(selected.category)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName} numberOfLines={1}>{selected.name}</Text>
                  <Text style={styles.cardCategory}>{selected.category}</Text>
                </View>
                <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Busyness Status */}
              <View style={[styles.statusRow, { backgroundColor: getBusynessColor(selected.busyness) + '18' }]}>
                <View style={[styles.statusDot, { backgroundColor: getBusynessColor(selected.busyness) }]} />
                <Text style={[styles.statusLabel, { color: getBusynessColor(selected.busyness) }]}>
                  {getBusynessLabel(selected.busyness)}
                </Text>
                <Text style={styles.statusScore}>{selected.busyness}% capacity</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${selected.busyness}%` as any,
                      backgroundColor: getBusynessColor(selected.busyness),
                    },
                  ]}
                />
              </View>
            </View>

            {/* Hourly Chart */}
            {hourlyData.length > 0 && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Today's pattern</Text>
                <View style={styles.chart}>
                  {hourlyData.map((d: any, i: number) => {
                    const score = d.score ?? d.busyness_score ?? 0;
                    const barH = Math.max(4, (score / 100) * 48);
                    const isNow = d.time === (
                      currentHour === 0 ? '12 AM'
                      : currentHour < 12 ? `${currentHour} AM`
                      : currentHour === 12 ? '12 PM'
                      : `${currentHour - 12} PM`
                    );
                    return (
                      <View key={i} style={styles.chartBar}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barH,
                              backgroundColor: isNow
                                ? getBusynessColor(score)
                                : getBusynessColor(score) + '55',
                              borderRadius: 3,
                            },
                          ]}
                        />
                        {isNow && <View style={styles.nowTick} />}
                      </View>
                    );
                  })}
                </View>
                <View style={styles.chartLabels}>
                  <Text style={styles.chartLabel}>6 AM</Text>
                  <Text style={styles.chartLabel}>12 PM</Text>
                  <Text style={styles.chartLabel}>6 PM</Text>
                  <Text style={styles.chartLabel}>12 AM</Text>
                </View>
              </View>
            )}

            {/* Report Button */}
            <TouchableOpacity style={styles.reportBtn} activeOpacity={0.85}>
              <Text style={styles.reportBtnText}>Submit a Report</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F0' },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#CC0000',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
    fontWeight: '500',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Markers
  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  markerSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
  },
  markerPulse: {
    position: 'absolute',
    top: -5,
    left: -5,
    right: -5,
    bottom: -5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // Legend
  legend: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#555', fontWeight: '500' },

  // Bottom Card
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 38 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  cardHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  cardTop: { marginBottom: 16 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  categoryIcon: { fontSize: 28 },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    letterSpacing: -0.3,
  },
  cardCategory: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: '700', flex: 1 },
  statusScore: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  progressTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  // Chart
  chartSection: { marginBottom: 16 },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 52,
    gap: 2,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 52,
  },
  bar: { width: '100%' },
  nowTick: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CC0000',
    marginTop: 3,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chartLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },

  // Report Button
  reportBtn: {
    backgroundColor: '#CC0000',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#CC0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  reportBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
