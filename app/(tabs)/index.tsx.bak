import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
  openHealthConnectSettings,
  openHealthConnectDataManagement,
} from 'react-native-health-connect';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
  const [sdkAvailable, setSdkAvailable] = useState<boolean>(false);
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState<string>('http://192.168.1.x:3000/api/health');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [status, setStatus] = useState<string>('Initializing...');

  useEffect(() => {
    // Only attempt to check Health Connect on Android
    if (Platform.OS === 'android') {
      checkAvailability();
    } else {
      setStatus('Health Connect is Android-only');
    }
  }, []);

  const checkAvailability = async () => {
    try {
      // Small delay to ensure bridge is ready, though usually not needed
      const availability = await getSdkStatus();
      
      if (availability === SdkAvailabilityStatus.SDK_AVAILABLE) {
        setSdkAvailable(true);
        const isInitialized = await initialize();
        if (isInitialized) {
          setStatus('Health Connect Ready');
        }
      } else if (availability === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        setStatus('Health Connect unavailable/not installed');
      } else if (availability === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        setStatus('Health Connect update required');
      } else {
        setStatus('Health Connect not supported');
      }
    } catch (error: any) {
      console.error('Health Connect Error:', error);
      // This is likely where the "Not Linked" error was caught
      setStatus('SDK Link Error (Are you in Expo Go?)');
    }
  };

  const connectAndFetch = async () => {
    if (!sdkAvailable) {
      Alert.alert('Not Available', 'Health Connect is not available on this device or app build.');
      return;
    }

    try {
      setStatus('Requesting Permissions...');
      const granted = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
      ]);
      
      setHasPermissions(true);
      setStatus('Fetching Data...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'after',
          startTime: today.toISOString(),
        },
      });

      const totalSteps = result.records.reduce((acc: number, record: any) => acc + (record.count || 0), 0);
      setSteps(totalSteps);
      setStatus(`Fetched ${totalSteps} steps.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch data');
      setStatus('Fetch Failed');
    }
  };

  const openSettings = () => {
    try {
      openHealthConnectSettings();
    } catch (error: any) {
      Alert.alert('Error', 'Could not open Health Connect settings');
    }
  };

  const openDataManagement = () => {
    try {
      openHealthConnectDataManagement();
    } catch (error: any) {
      Alert.alert('Error', 'Could not open Health Connect data management');
    }
  };

  const sendToApi = async () => {
    if (steps === null) {
      Alert.alert('No data', 'Please fetch data first');
      return;
    }

    setIsSyncing(true);
    setStatus('Sending to API...');
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          steps: steps,
          device: 'Android Device',
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Data synced to network!');
        setStatus('Sync Complete');
      } else {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error: any) {
      Alert.alert('Sync Failed', error.message);
      setStatus('Sync Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Health Connect</ThemedText>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">System Status</ThemedText>
        <ThemedText style={[styles.statusText, !sdkAvailable && styles.errorText]}>
          {status}
        </ThemedText>
        {!sdkAvailable && Platform.OS === 'android' && (
          <ThemedText style={styles.hintText}>
            Note: This requires a Development Build, not Expo Go.
          </ThemedText>
        )}
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.primaryButton, !sdkAvailable && styles.buttonDisabled]} 
            onPress={connectAndFetch}
            disabled={!sdkAvailable}
          >
            <ThemedText style={styles.buttonText}>Connect Health Connect</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Step Data</ThemedText>
        <View style={styles.dataRow}>
          <ThemedText type="defaultSemiBold">Today's Steps:</ThemedText>
          <ThemedText type="title" style={styles.stepsValue}>
            {steps !== null ? steps.toLocaleString() : '--'}
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, (!sdkAvailable || !hasPermissions) && styles.buttonDisabled]} 
          onPress={connectAndFetch}
          disabled={!sdkAvailable || !hasPermissions}
        >
          <ThemedText style={styles.buttonText}>Refresh Data</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Network Settings</ThemedText>
        <ThemedText style={styles.label}>API Endpoint</ThemedText>
        <TextInput
          style={styles.input}
          value={apiEndpoint}
          onChangeText={setApiEndpoint}
          placeholder="https://your-api.com/data"
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={[styles.syncButton, (isSyncing || steps === null) && styles.buttonDisabled]} 
          onPress={sendToApi}
          disabled={isSyncing || steps === null}
        >
          {isSyncing ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.buttonText}>Send to API</ThemedText>}
        </TouchableOpacity>
        
        <ThemedText style={styles.hintText}>
          Ensure the server is reachable from the mobile device. For local development, use the computer's local network IP.
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingTop: 60, gap: 20 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, backgroundColor: 'transparent' },
  card: { padding: 20, borderRadius: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3, gap: 12 },
  statusText: { fontSize: 16, color: '#666', fontWeight: '500' },
  errorText: { color: '#d9534f' },
  hintText: { fontSize: 12, color: '#888', fontStyle: 'italic' },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
  stepsValue: { color: '#007AFF' },
  label: { fontSize: 14, color: '#888', marginBottom: -4 },
  input: { height: 48, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#333' },
  button: { backgroundColor: '#007AFF', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  syncButton: { backgroundColor: '#28a745', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonGroup: { marginTop: 8 },
  primaryButton: { backgroundColor: '#007AFF', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  outlineButton: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  outlineButtonText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
});
