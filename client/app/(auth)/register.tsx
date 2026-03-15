// ============================================================
// Register Screen
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import ErrorMessage from '@/components/ErrorMessage';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      console.log('[Register] Starting registration...');
      console.log('[Register] URL should be: https://YOUR_NGROK_URL/api/register');
      console.log('[Register] Make sure ngrok is running: ngrok http 8080');
      console.log('[Register] Payload:', { name: name.trim(), email: email.trim() });
      
      await register({ name: name.trim(), email: email.trim(), password });
      
      console.log('[Register] Success! User registered.');
    } catch (err: any) {
      // FULL ERROR LOGGING IN REGISTER SCREEN
      console.log('========== REGISTER ERROR ==========');
      console.log(err);
      console.log(err.response);
      console.log(err.request);
      console.log('=====================================');
      
      // Check for network error (no response at all)
      if (!err?.response && err?.request) {
        console.log('[Register] NETWORK ERROR DETECTED');
        console.log('[Register] This means the request did NOT reach the server!');
        console.log('[Register] Check:');
        console.log('[Register] 1. Is ngrok running? Run: ngrok http 8080');
        console.log('[Register] 2. Is the ngrok URL correct in api.ts?');
        console.log('[Register] 3. Is the backend running on port 8080?');
        console.log('[Register] 4. Is there a firewall blocking?');
        setError('Cannot connect to server. Make sure ngrok is running and backend is running on port 8080.');
        return;
      }
      
      // Server responded with error
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed. Please try again.';
      console.log('[Register] Error message:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Smart Expense Splitter</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {error ? <ErrorMessage message={error} /> : null}

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href={'/(auth)/login' as any} asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#11181C',
  },
  subtitle: {
    fontSize: 15,
    color: '#687076',
    marginTop: 6,
  },
  form: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 14,
    color: '#11181C',
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    color: '#687076',
  },
  link: {
    fontSize: 15,
    color: '#0a7ea4',
    fontWeight: '600',
  },
});
