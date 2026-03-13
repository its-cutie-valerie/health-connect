import React from 'react';
import { StyleSheet, TextInput, View, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useHealthSettings, SyncType } from '@/hooks/use-health-settings';
import { registerBackgroundSync, unregisterBackgroundSync } from '@/services/background-sync';
import { requestAllHealthPermissions } from '@/services/health-service';

const SYNC_OPTIONS: { id: SyncType; label: string; icon: string }[] = [
  { id: 'Steps', label: 'Steps', icon: '👣' },
  { id: 'HeartRate', label: 'Heart Rate', icon: '❤️' },
  { id: 'Distance', label: 'Distance', icon: '📏' },
  { id: 'TotalCaloriesBurned', label: 'Total Calories', icon: '🔥' },
  { id: 'ActiveCaloriesBurned', label: 'Active Calories', icon: '🏃' },
  { id: 'SleepSession', label: 'Sleep', icon: '😴' },
  { id: 'Weight', label: 'Weight', icon: '⚖️' },
  { id: 'Height', label: 'Height', icon: '📏' },
  { id: 'BasalMetabolicRate', label: 'Basal Metabolism', icon: '🧬' },
  { id: 'BloodGlucose', label: 'Blood Glucose', icon: '🩸' },
  { id: 'BloodPressure', label: 'Blood Pressure', icon: '🩺' },
  { id: 'BodyFat', label: 'Body Fat', icon: '📉' },
  { id: 'BodyTemperature', label: 'Body Temp', icon: '🌡️' },
  { id: 'BoneMass', label: 'Bone Mass', icon: '🦴' },
  { id: 'ExerciseSession', label: 'Exercises', icon: '🏋️' },
  { id: 'FloorsClimbed', label: 'Floors', icon: '🪜' },
  { id: 'Hydration', label: 'Hydration', icon: '💧' },
  { id: 'Nutrition', label: 'Nutrition', icon: '🍎' },
  { id: 'OxygenSaturation', label: 'SpO2', icon: '🫁' },
  { id: 'RespiratoryRate', label: 'Breath Rate', icon: '🌬️' },
  { id: 'RestingHeartRate', label: 'Resting HR', icon: '💓' },
  { id: 'Vo2Max', label: 'VO2 Max', icon: '🫀' },
  { id: 'CyclingPedalingCadence', label: 'Cycling Cadence', icon: '🚴' },
  { id: 'StepsCadence', label: 'Step Cadence', icon: '🏃‍♂️' },
  { id: 'Speed', label: 'Speed', icon: '🏎️' },
  { id: 'ElevationGained', label: 'Elevation', icon: '⛰️' },
  { id: 'LeanBodyMass', label: 'Lean Body Mass', icon: '💪' },
  { id: 'ExerciseRoute', label: 'Workout Route', icon: '📍' },
];

const INTERVAL_OPTIONS = [
  { label: '30m', value: 0.5 },
  { label: '1h', value: 1 },
  { label: '3h', value: 3 },
  { label: '6h', value: 6 },
  { label: '12h', value: 12 },
];

const LOOKBACK_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '3 Days', value: 3 },
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
];

export default function SettingsScreen() {
  const { settings, updateSettings, isLoading } = useHealthSettings();
  
  const primaryColor = useThemeColor({}, 'primary');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const subtextColor = useThemeColor({}, 'subtext');
  const textColor = useThemeColor({}, 'text');

  if (isLoading) return null;

  const toggleSyncType = (type: SyncType) => {
    const updated = { ...settings.syncEnabled, [type]: !settings.syncEnabled[type] };
    updateSettings({ syncEnabled: updated });
  };

  const onToggleAutoSync = async (val: boolean) => {
    updateSettings({ autoSync: val });
    if (val) {
      await registerBackgroundSync(settings.syncIntervalHours);
      Alert.alert('Auto-Sync Enabled', `Background task registered for every ${settings.syncIntervalHours}h.`);
    } else {
      await unregisterBackgroundSync();
      Alert.alert('Auto-Sync Disabled', 'Background task removed.');
    }
  };

  const onUpdateInterval = async (val: number) => {
    updateSettings({ syncIntervalHours: val });
    if (settings.autoSync) {
      await registerBackgroundSync(val);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="subtitle">Data Points</ThemedText>
          <TouchableOpacity 
            style={[styles.miniButton, { backgroundColor: primaryColor }]} 
            onPress={async () => {
              try {
                await requestAllHealthPermissions(settings.syncEnabled);
                Alert.alert('Permissions Updated', 'Requested permissions for all selected categories.');
              } catch (e: any) {
                Alert.alert('Permission Error', e.message);
              }
            }}
          >
            <ThemedText style={styles.miniButtonText}>Grant Permissions</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.settingsGrid}>
          {SYNC_OPTIONS.map((option) => (
            <TouchableOpacity 
              key={option.id} 
              style={[
                styles.settingItem, 
                { borderColor: settings.syncEnabled[option.id] ? primaryColor : borderColor },
                settings.syncEnabled[option.id] && { backgroundColor: primaryColor + '10' }
              ]}
              onPress={() => toggleSyncType(option.id)}
            >
              <View style={styles.settingRow}>
                <ThemedText style={styles.iconText}>{option.icon}</ThemedText>
                <ThemedText style={styles.settingLabel}>{option.label}</ThemedText>
                <Switch
                  value={settings.syncEnabled[option.id]}
                  onValueChange={() => toggleSyncType(option.id)}
                  trackColor={{ false: '#767577', true: primaryColor + '60' }}
                  thumbColor={settings.syncEnabled[option.id] ? primaryColor : '#f4f3f4'}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <ThemedText type="subtitle">Automation</ThemedText>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.settingLabel}>Auto-Sync</ThemedText>
            <ThemedText style={{ color: subtextColor, fontSize: 12 }}>Sync in background automatically</ThemedText>
          </View>
          <Switch
            value={settings.autoSync}
            onValueChange={onToggleAutoSync}
            trackColor={{ false: '#767577', true: primaryColor + '60' }}
            thumbColor={settings.autoSync ? primaryColor : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <ThemedText style={styles.label}>Sync Frequency</ThemedText>
        <View style={styles.pillContainer}>
          {INTERVAL_OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt.value} 
              onPress={() => onUpdateInterval(opt.value)}
              style={[styles.pill, { borderColor: settings.syncIntervalHours === opt.value ? primaryColor : borderColor, backgroundColor: settings.syncIntervalHours === opt.value ? primaryColor + '10' : 'transparent' }]}
            >
              <ThemedText style={{ fontSize: 13, color: settings.syncIntervalHours === opt.value ? primaryColor : subtextColor }}>{opt.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.settingLabel}>Notifications</ThemedText>
            <ThemedText style={{ color: subtextColor, fontSize: 12 }}>Notify on sync completion</ThemedText>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(val) => updateSettings({ notificationsEnabled: val })}
            trackColor={{ false: '#767577', true: primaryColor + '60' }}
            thumbColor={settings.notificationsEnabled ? primaryColor : '#f4f3f4'}
          />
        </View>
      </ThemedView>

      <ThemedView style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <ThemedText type="subtitle">Cloud & Fetch</ThemedText>
        
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: subtextColor }]}>API Endpoint</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={settings.apiEndpoint}
            onChangeText={(val) => updateSettings({ apiEndpoint: val })}
            placeholder="https://..."
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: subtextColor }]}>Authorization Header</ThemedText>
          <TextInput
            style={[styles.input, { color: textColor, borderColor }]}
            value={settings.authHeader}
            onChangeText={(val) => updateSettings({ authHeader: val })}
            placeholder="Bearer token..."
            autoCapitalize="none"
          />
        </View>

        <View style={styles.divider} />

        <ThemedText style={styles.label}>Sync Lookback</ThemedText>
        <View style={styles.pillContainer}>
          {LOOKBACK_OPTIONS.map((opt) => (
            <TouchableOpacity 
              key={opt.value} 
              onPress={() => updateSettings({ lookbackDays: opt.value })}
              style={[styles.pill, { borderColor: settings.lookbackDays === opt.value ? primaryColor : borderColor, backgroundColor: settings.lookbackDays === opt.value ? primaryColor + '10' : 'transparent' }]}
            >
              <ThemedText style={{ fontSize: 12, color: settings.lookbackDays === opt.value ? primaryColor : subtextColor }}>{opt.label}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </ThemedView>

      <ThemedText style={[styles.footerText, { color: subtextColor }]}>
        User ID: {settings.userId} | Last Synced: {settings.lastSync ? new Date(settings.lastSync).toLocaleString() : 'Never'}
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 64, gap: 16, paddingBottom: 40 },
  header: { backgroundColor: 'transparent', marginBottom: 8 },
  card: { padding: 20, borderRadius: 28, borderWidth: 1, gap: 16 },
  settingsGrid: { gap: 8 },
  settingItem: { padding: 4, borderRadius: 16, borderWidth: 1.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  iconText: { fontSize: 20, width: 44, textAlign: 'center' },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 4 },
  pillContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { height: 50, borderRadius: 14, paddingHorizontal: 16, fontSize: 15, borderWidth: 1 },
  footerText: { textAlign: 'center', fontSize: 12, marginTop: 10 },
  miniButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, elevation: 1 },
  miniButtonText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
});
