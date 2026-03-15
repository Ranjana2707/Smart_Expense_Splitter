// ============================================================
// Inline error message component
// ============================================================

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  message: string;
}

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fdecea',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  text: {
    color: '#b71c1c',
    fontSize: 14,
    textAlign: 'center',
  },
});
