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
  Dimensions
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
        <ThemedText type="title">Health Sync</ThemedText>
        <View style={[styles.statusTag, { backgroundColor: isInitialized ? successColor + '20' : errorColor + '20' }]}>
          <ThemedText style={[styles.statusTagText, { color: isInitialized ? successColor : errorColor }]}>
            {sdkStatus}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Metric Tiles */}
      <View style={styles.metricsGrid}>
        <MetricTile label="Steps" value={liveMetrics.Steps} icon="👣" color={primaryColor} />
        <MetricTile label="Heart Rate" value={liveMetrics.HeartRate} icon="❤️" color="#F87171" />
        <MetricTile label="Distance" value={liveMetrics.Distance} icon="📏" color="#60A5FA" />
        <MetricTile label="Calories" value={liveMetrics.TotalCaloriesBurned} icon="🔥" color="#FB923C" />
      </View>

      {/* Sync Control Card */}
      <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <ThemedText type="subtitle">Cloud Sync</ThemedText>
        <ThemedText style={{ color: subtextColor, fontSize: 13 }}>
          Next background sync: {settings.autoSync ? `Every ${settings.syncIntervalHours}h` : 'Disabled'}
        </ThemedText>

        {healthData ? (
          <View style={styles.summaryBox}>
            <ThemedText type="defaultSemiBold">Ready to Sync ({totalRecords} total):</ThemedText>
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
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: primaryColor }, isFetching && styles.buttonDisabled]} 
            onPress={onFetch}
            disabled={isFetching || !isInitialized}
          >
            {isFetching ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Pull Records</ThemedText>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: successColor }, (!healthData || isSyncing) && styles.buttonDisabled]} 
            onPress={onSync}
            disabled={!healthData || isSyncing}
          >
            {isSyncing ? <ActivityIndicator color="#fff" /> : (
              <ThemedText style={styles.buttonText}>Upload to Cloud</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Sync History Log */}
      <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor, gap: 8 }]}>
        <ThemedText type="subtitle">Recent Activity</ThemedText>
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

function MetricTile({ label, value, icon, color }: { label: string, value?: number, icon: string, color: string }) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const subtextColor = useThemeColor({}, 'subtext');

  return (
    <View style={[styles.metricTile, { backgroundColor: cardColor, borderColor }]}>
      <ThemedText style={{ fontSize: 24 }}>{icon}</ThemedText>
      <ThemedText style={{ fontSize: 22, fontWeight: 'bold', marginTop: 4 }}>{value || 0}</ThemedText>
      <ThemedText style={{ fontSize: 11, color: subtextColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</ThemedText>
      <View style={[styles.progressLine, { backgroundColor: color + '20' }]}>
        <View style={[styles.progressPoint, { backgroundColor: color, width: `${Math.min(100, (value || 0) / 100)}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 64, gap: 16, paddingBottom: 40 },
  header: { backgroundColor: 'transparent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusTagText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricTile: { width: COLUMN_WIDTH, padding: 16, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  progressLine: { height: 3, width: '100%', borderRadius: 1.5, marginTop: 12, overflow: 'hidden' },
  progressPoint: { height: '100%', borderRadius: 1.5 },
  card: { padding: 20, borderRadius: 28, borderWidth: 1, gap: 14 },
  summaryBox: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 14, borderRadius: 16, gap: 4 },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between' },
  exportBtn: { marginTop: 8, borderWidth: 1, paddingVertical: 6, borderRadius: 10, alignItems: 'center' },
  actionGroup: { gap: 10, marginTop: 8 },
  button: { height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  buttonDisabled: { opacity: 0.5, elevation: 0 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  historyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
