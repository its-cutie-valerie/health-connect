import { StyleSheet, Linking } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

export default function TabTwoScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="gearshape.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Settings & Info
        </ThemedText>
      </ThemedView>
      <ThemedText>Configuration and support for Health Connect synchronization.</ThemedText>
      <Collapsible title="Account & Integration">
        <ThemedText>
          This application integrates with Android Health Connect to read activity data.
          To manage which applications can access your data, please see your system settings.
        </ThemedText>
        <ExternalLink href="https://support.google.com/android/answer/12201211">
          <ThemedText type="link">Manage Health Connect</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Sync Frequency">
        <ThemedText>
          Currently, synchronization is manually triggered via the main dashboard.
          Ensure you have a stable network connection when initiating a sync.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Developer Support">
        <ThemedText>
          For technical issues or feature requests, contact development.
        </ThemedText>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
