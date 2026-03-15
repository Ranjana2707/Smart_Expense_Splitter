// ============================================================
// Full-screen loading spinner
// ============================================================

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface Props {
  color?: string;
}

export default function LoadingSpinner({ color = '#0a7ea4' }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
