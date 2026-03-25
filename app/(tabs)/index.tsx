import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Alert, 
  ActivityIndicator, 
  Platform, 
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Pressable
} from 'react-native';
import { getSdkStatus, SdkAvailabilityStatus, initialize } from 'react-native-health-connect';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useHealthSettings } from '@/hooks/use-health-settings';
import { fetchHealthData, uploadHealthData } from '@/services/health-service';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

export default function HomeScreen() {
  const { settings, addHistoryEntry, isLoading: settingsLoading } = useHealthSettings();
  const [sdkStatus, setSdkStatus] = useState<string>('Initializing...');
  const [isInitialized, setIsInitialized] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, number>>({});
  
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const subtextColor = useThemeColor({}, 'subtext');
  const successColor = useThemeColor({}, 'success');
  const errorColor = useThemeColor({}, 'error');
  const textColor = useThemeColor({}, 'text');
  const onPrimary = useThemeColor({}, 'onPrimary');
  const onSuccess = useThemeColor({}, 'onSuccess');

  const checkHealthConnect = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setSdkStatus('Android Only');
      return;
    }

    try {
      const status = await getSdkStatus();
      if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
        const ok = await initialize();
        setIsInitialized(ok);
        setSdkStatus(ok ? 'Active' : 'Init Failed');
        if (ok) refreshMetrics();
      } else {
        setSdkStatus('Unavailable');
      }
    } catch (e) {
      setSdkStatus('Error');
    }
  }, [settings]);

  useEffect(() => {
    checkHealthConnect();
  }, [checkHealthConnect]);

  const refreshMetrics = async () => {
    try {
      const data = await fetchHealthData({
        ...settings,
        lookbackDays: 1, // Always show today's metrics
      });
      const counts: Record<string, number> = {};
      Object.entries(data).forEach(([type, records]: [string, any]) => {
        counts[type] = records.length;
      });
      setLiveMetrics(counts);
    } catch (e) {
      console.warn('Failed to refresh metrics', e);
    }
  };

  const onFetch = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Health Connect not initialized');
      return;
    }
    
    setIsFetching(true);
    try {
      const data = await fetchHealthData(settings);
      setHealthData(data);
      refreshMetrics();
      const total = Object.values(data).reduce((acc: number, curr: any) => acc + curr.length, 0);
      if (total === 0) {
        Alert.alert('Notification', 'No new records found for selected categories.');
      }
    } catch (e: any) {
      Alert.alert('Fetch Error', e.message);
    } finally {
      setIsFetching(false);
    }
  };

  const onSync = async () => {
    if (!healthData) return;
    setIsSyncing(true);
    try {
      await uploadHealthData(healthData, settings);
      Alert.alert('Success', 'Data synced to cloud successfully!');
      setHealthData(null); 
      refreshMetrics();
    } catch (e: any) {
      Alert.alert('Sync Error', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const onExport = async () => {
    if (!healthData) {
      Alert.alert('No Data', 'Fetch data first before exporting.');
      return;
    }

    try {
      const fileName = `health_data_${new Date().getTime()}.json`;
      const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory || "") + fileName;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(healthData, null, 2));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export Health Data' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealthConnect();
    setRefreshing(false);
  };

  if (settingsLoading) return null;

  const totalRecords = healthData ? Object.values(healthData).reduce((acc: number, curr: any) => acc + curr.length, 0) : 0;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="headline">Health Sync</ThemedText>
        <View style={[styles.statusTag, { backgroundColor: isInitialized ? successColor + '20' : errorColor + '20' }]}>
          <ThemedText style={[styles.statusTagText, { color: isInitialized ? successColor : errorColor }]}>
            {sdkStatus}
          </ThemedText>
        </View>
      </ThemedView>

      <View style={styles.metricsGrid}>
        <MetricTile label="Steps" value={liveMetrics.Steps} icon="footprints.fill" color={primaryColor} />
        <MetricTile label="Heart Rate" value={liveMetrics.HeartRate} icon="heart.fill" color="#F87171" />
        <MetricTile label="Distance" value={liveMetrics.Distance} icon="ruler" color="#60A5FA" />
        <MetricTile label="Calories" value={liveMetrics.TotalCaloriesBurned} icon="flame.fill" color="#FB923C" />
      </View>

      {/* Sync Control Card */}
      <ThemedView type="card" style={styles.card}>
        <ThemedText type="title">Cloud Sync</ThemedText>
        <ThemedText type="label" style={{ color: subtextColor }}>
          Next background sync: {settings.autoSync ? `Every ${settings.syncIntervalHours}h` : 'Disabled'}
        </ThemedText>

        {healthData ? (
          <View style={styles.summaryBox}>
            <ThemedText type="title" style={{ fontSize: 14 }}>Ready to Sync ({totalRecords} total):</ThemedText>
            {Object.entries(healthData).map(([type, records]: [string, any]) => (
              <View key={type} style={styles.dataRow}>
                <ThemedText style={{ fontSize: 13, color: subtextColor }}>{type}</ThemedText>
                <ThemedText style={{ fontSize: 13, fontWeight: '700' }}>{records.length}</ThemedText>
              </View>
            ))}
            <TouchableOpacity style={[styles.exportBtn, { borderColor: primaryColor }]} onPress={onExport}>
              <ThemedText style={{ color: primaryColor, fontSize: 12, fontWeight: 'bold' }}>EXPORT TO JSON</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <ThemedText style={{ color: subtextColor, fontSize: 12, fontStyle: 'italic' }}>
            No data staged. Pull latest from Health Connect to start.
          </ThemedText>
        )}

        <View style={styles.actionGroup}>
          <Pressable 
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={[styles.button, { backgroundColor: primaryColor }, isFetching && styles.buttonDisabled]} 
            onPress={onFetch}
            disabled={isFetching || !isInitialized}
          >
            {isFetching ? <ActivityIndicator color={onPrimary} /> : <ThemedText style={[styles.buttonText, { color: onPrimary }]}>Pull Records</ThemedText>}
          </Pressable>

          <Pressable 
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            style={[styles.button, { backgroundColor: successColor }, (!healthData || isSyncing) && styles.buttonDisabled]} 
            onPress={onSync}
            disabled={!healthData || isSyncing}
          >
            {isSyncing ? <ActivityIndicator color={onSuccess} /> : (
              <ThemedText style={[styles.buttonText, { color: onSuccess }]}>Upload to Cloud</ThemedText>
            )}
          </Pressable>
        </View>
      </ThemedView>

      {/* Sync History Log */}
      <ThemedView type="surface" style={styles.card}>
        <ThemedText type="title">Recent Activity</ThemedText>
        {settings.history && settings.history.length > 0 ? (
          settings.history.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={[styles.dot, { backgroundColor: entry.status === 'success' ? successColor : entry.status === 'failure' ? errorColor : subtextColor }]} />
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>
                  {entry.status === 'success' ? `Synced ${entry.recordCount} records` : entry.status === 'no_data' ? 'No new data' : 'Sync failed'}
                </ThemedText>
                <ThemedText style={{ fontSize: 11, color: subtextColor }}>
                  {new Date(entry.timestamp).toLocaleTimeString()} — {entry.message || (entry.status === 'success' ? 'Successful upload' : '')}
                </ThemedText>
              </View>
            </View>
          ))
        ) : (
          <ThemedText style={{ color: subtextColor, fontSize: 12, textAlign: 'center', marginTop: 10 }}>No history yet.</ThemedText>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function MetricTile({ label, value, icon, color }: { label: string, value?: number, icon: any, color: string }) {
  return (
    <ThemedView type="card" style={styles.metricTile}>
      <IconSymbol name={icon} size={32} color={color} />
      <ThemedText type="title" style={{ marginTop: 8 }}>{value || 0}</ThemedText>
      <ThemedText type="label" style={{ color: color, opacity: 0.8 }}>{label}</ThemedText>
      <View style={[styles.progressLine, { backgroundColor: color + '20' }]}>
        <View style={[styles.progressPoint, { backgroundColor: color, width: `${Math.min(100, (value || 0) / 100)}%` as any }]} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 64, gap: 16, paddingBottom: 40 },
  header: { backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  statusTagText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricTile: { width: COLUMN_WIDTH, padding: 20, borderRadius: 28, alignItems: 'center' },
  progressLine: { height: 4, width: '100%', borderRadius: 2, marginTop: 16, overflow: 'hidden' },
  progressPoint: { height: '100%', borderRadius: 2 },
  card: { padding: 24, borderRadius: 28, gap: 16 },
  summaryBox: { backgroundColor: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 20, gap: 6 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  exportBtn: { marginTop: 12, borderWidth: 1.5, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  actionGroup: { gap: 12, marginTop: 8 },
  button: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { opacity: 0.38 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
