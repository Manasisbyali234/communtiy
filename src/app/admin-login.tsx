import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminStore } from '../store/adminStore';
import { adminApiClient } from '../api/adminClient';

export default function AdminLogin() {
  const router = useRouter();
  const login = useAdminStore((s) => s.login);
  const isAuthenticated = useAdminStore((s) => s.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) router.replace('/(admin)/dashboard' as any);
  }, [isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) { setError('Email and password are required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await adminApiClient.post('/admin-auth/login', { email, password });
      const { token, admin } = res.data.data;
      login(admin, token);
      router.replace('/(admin)/dashboard' as any);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚙️</Text>
            </View>
          </View>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.subtitle}>Sign in with your admin credentials</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@example.com"
            placeholderTextColor="#7A9472"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor="#7A9472"
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.btnText}>Sign In to Admin Panel</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFDF6' },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: {
    width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 32,
    shadowColor: '#1A2D1A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 6,
    borderWidth: 1, borderColor: '#C8DABC',
  },
  iconWrap: { alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#C8E6C9', alignItems: 'center', justifyContent: 'center',
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '800', color: '#1A2D1A', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#4A6741', textAlign: 'center', marginBottom: 28 },
  errorBox: { backgroundColor: '#FFCDD2', borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: '#B71C1C', fontSize: 13 },
  label: { fontSize: 13, fontWeight: '600', color: '#4A6741', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#EDF4EC', borderWidth: 1, borderColor: '#C8DABC',
    borderRadius: 10, padding: 14, color: '#1A2D1A', fontSize: 15,
  },
  btn: {
    backgroundColor: '#2D6A2D', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 28,
  },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
