import React from 'react';
import { StyleSheet, TextInput, View, ScrollView, Switch, Pressable, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useHealthSettings, SyncType } from '@/hooks/use-health-settings';
import { registerBackgroundSync, unregisterBackgroundSync } from '@/services/background-sync';
import { requestAllHealthPermissions } from '@/services/health-service';
import { IconSymbol } from '@/components/ui/icon-symbol';

type CategorizedOptions = {
  title: string;
  icon: any;
  options: { id: SyncType; label: string; icon: any }[];
};

const SYNC_CATEGORIES: CategorizedOptions[] = [
  {
    title: 'Activity',
    icon: 'figure.walk',
    options: [
      { id: 'Steps', label: 'Steps', icon: 'footprints.fill' },
      { id: 'Distance', label: 'Distance', icon: 'ruler' },
      { id: 'TotalCaloriesBurned', label: 'Total Calories', icon: 'flame.fill' },
      { id: 'ActiveCaloriesBurned', label: 'Active Calories', icon: 'figure.walk' },
      { id: 'ExerciseSession', label: 'Exercises', icon: 'figure.strengthtraining.traditional' },
      { id: 'FloorsClimbed', label: 'Floors', icon: 'stairs' },
      { id: 'CyclingPedalingCadence', label: 'Cycling Cadence', icon: 'bicycle' },
      { id: 'StepsCadence', label: 'Step Cadence', icon: 'figure.walk' },
      { id: 'Speed', label: 'Speed', icon: 'speedometer' },
      { id: 'ElevationGained', label: 'Elevation', icon: 'mountain.2.fill' },
      { id: 'ExerciseRoute', label: 'Workout Route', icon: 'map.fill' },
    ]
  },
  {
    title: 'Vitals',
    icon: 'heart.fill',
    options: [
      { id: 'HeartRate', label: 'Heart Rate', icon: 'heart.fill' },
      { id: 'RestingHeartRate', label: 'Resting HR', icon: 'heart.circle.fill' },
      { id: 'BloodPressure', label: 'Blood Pressure', icon: 'stethoscope' },
      { id: 'OxygenSaturation', label: 'SpO2', icon: 'lungs.fill' },
      { id: 'RespiratoryRate', label: 'Breath Rate', icon: 'wind' },
      { id: 'Vo2Max', label: 'VO2 Max', icon: 'heart.fill' },
      { id: 'BodyTemperature', label: 'Body Temp', icon: 'thermometer' },
      { id: 'BloodGlucose', label: 'Blood Glucose', icon: 'drop.fill' },
    ]
  },
  {
    title: 'Body & Sleep',
    icon: 'scalemass.fill',
    options: [
      { id: 'Weight', label: 'Weight', icon: 'scalemass.fill' },
      { id: 'Height', label: 'Height', icon: 'ruler' },
      { id: 'BodyFat', label: 'Body Fat', icon: 'chart.line.downtrend.xyaxis' },
      { id: 'LeanBodyMass', label: 'Lean Body Mass', icon: 'figure.strengthtraining.traditional' },
      { id: 'BasalMetabolicRate', label: 'Basal Metabolism', icon: 'dna' },
      { id: 'BoneMass', label: 'Bone Mass', icon: 'dna' },
      { id: 'SleepSession', label: 'Sleep', icon: 'moon.zzz.fill' },
    ]
  },
  {
    title: 'Health & Nutrition',
    icon: 'apple.logo',
    options: [
      { id: 'Hydration', label: 'Hydration', icon: 'drop.fill' },
      { id: 'Nutrition', label: 'Nutrition', icon: 'apple.logo' },
    ]
  }
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
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: 'Year', value: 365 },
];

export default function SettingsScreen() {
  const { settings, updateSettings, isLoading } = useHealthSettings();
  
  const primaryColor = useThemeColor({}, 'primary');
  const subtextColor = useThemeColor({}, 'subtext');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const onPrimary = useThemeColor({}, 'onPrimary');
  
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(['Activity']);

  if (isLoading) return null;

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

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
        <ThemedText type="headline">Settings</ThemedText>
      </ThemedView>

      <ThemedView type="surface" style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="title">Data Points</ThemedText>
          <Pressable 
            android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
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
            <ThemedText style={[styles.miniButtonText, { color: onPrimary }]}>Grant Permissions</ThemedText>
          </Pressable>
        </View>

        <View style={styles.settingsGrid}>
          {SYNC_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category.title);
            return (
              <View 
                key={category.title} 
                style={[
                  styles.categoryWrap, 
                  isExpanded && { backgroundColor: primaryColor + '08', borderColor: primaryColor + '20', borderWidth: 1 }
                ]}
              >
                <Pressable 
                  android_ripple={{ color: primaryColor + '20' }}
                  style={[
                    styles.categoryHeader, 
                    isExpanded && { borderBottomWidth: 1, borderBottomColor: primaryColor + '10' }
                  ]}
                  onPress={() => toggleCategory(category.title)}
                >
                  <IconSymbol name={category.icon} size={22} color={isExpanded ? primaryColor : subtextColor} />
                  <ThemedText type="title" style={{ flex: 1, fontSize: 16, marginLeft: 16, color: isExpanded ? primaryColor : textColor }}>{category.title}</ThemedText>
                  <IconSymbol 
                    name="chevron.right" 
                    size={18} 
                    color={subtextColor} 
                    style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} 
                  />
                </Pressable>
                
                {isExpanded && (
                  <View style={styles.categoryContent}>
                    {category.options.map((option) => (
                      <Pressable 
                        key={option.id} 
                        android_ripple={{ color: primaryColor + '20' }}
                        style={[
                          styles.settingItem, 
                          { borderColor: settings.syncEnabled[option.id] ? primaryColor : 'transparent' },
                          settings.syncEnabled[option.id] && { backgroundColor: primaryColor + '10' }
                        ]}
                        onPress={() => toggleSyncType(option.id)}
                      >
                        <View style={styles.settingRow}>
                          <View style={styles.iconContainer}>
                            <IconSymbol name={option.icon} size={20} color={settings.syncEnabled[option.id] ? primaryColor : subtextColor} />
                          </View>
                          <ThemedText style={styles.settingLabel}>{option.label}</ThemedText>
                          <Switch
                            value={settings.syncEnabled[option.id]}
                            onValueChange={() => toggleSyncType(option.id)}
                            trackColor={{ false: '#767577', true: primaryColor + '60' }}
                            thumbColor={settings.syncEnabled[option.id] ? primaryColor : '#f4f3f4'}
                          />
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ThemedView>

      <ThemedView type="surface" style={styles.card}>
        <ThemedText type="title">Automation</ThemedText>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.settingLabel}>Auto-Sync</ThemedText>
            <ThemedText style={{ fontSize: 13, color: subtextColor }}>Import data automatically</ThemedText>
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
            <Pressable 
              key={opt.value} 
              onPress={() => onUpdateInterval(opt.value)}
              android_ripple={{ color: primaryColor + '20' }}
              style={[
                styles.pill, 
                { 
                  borderColor: settings.syncIntervalHours === opt.value ? primaryColor : 'transparent', 
                  backgroundColor: settings.syncIntervalHours === opt.value ? primaryColor + '10' : 'rgba(0,0,0,0.03)' 
                }
              ]}
            >
              <ThemedText style={{ fontSize: 13, color: settings.syncIntervalHours === opt.value ? primaryColor : subtextColor }}>{opt.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      <ThemedView type="surface" style={styles.card}>
        <ThemedText type="title">Cloud & Fetch</ThemedText>
        
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

        <View style={{ marginBottom: 8 }}>
          <ThemedText style={styles.label}>Sync Lookback</ThemedText>
          <ThemedText style={{ fontSize: 13, color: subtextColor, marginBottom: 4 }}>
            Includes historical data (e.g., set to 90 days for Jan/Feb)
          </ThemedText>
        </View>
        <View style={styles.pillContainer}>
          {LOOKBACK_OPTIONS.map((opt) => (
            <Pressable 
              key={opt.value} 
              onPress={() => updateSettings({ lookbackDays: opt.value })}
              android_ripple={{ color: primaryColor + '20' }}
              style={[
                styles.pill, 
                { 
                  borderColor: settings.lookbackDays === opt.value ? primaryColor : 'transparent', 
                  backgroundColor: settings.lookbackDays === opt.value ? primaryColor + '10' : 'rgba(0,0,0,0.03)' 
                }
              ]}
            >
              <ThemedText style={{ fontSize: 12, color: settings.lookbackDays === opt.value ? primaryColor : subtextColor }}>{opt.label}</ThemedText>
            </Pressable>
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
  content: { padding: 16, paddingTop: 64, gap: 16, paddingBottom: 40 },
  header: { backgroundColor: 'transparent', marginBottom: 8, paddingHorizontal: 4 },
  card: { padding: 24, borderRadius: 28, gap: 16 },
  settingsGrid: { gap: 12, marginTop: 12 },
  categoryWrap: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'transparent' },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  categoryContent: { gap: 8, paddingVertical: 12, paddingHorizontal: 12 },
  settingItem: { padding: 4, borderRadius: 20, borderWidth: 1.5, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 8, height: 44 },
  iconContainer: { width: 44, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 16, fontWeight: '600', letterSpacing: 0.1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 8 },
  pillContainer: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, borderWidth: 1 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.0 },
  input: { height: 56, borderRadius: 16, paddingHorizontal: 16, fontSize: 16, borderWidth: 1 },
  footerText: { textAlign: 'center', fontSize: 12, marginTop: 20, opacity: 0.8 },
  miniButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, elevation: 1 },
  miniButtonText: { color: '#fff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
