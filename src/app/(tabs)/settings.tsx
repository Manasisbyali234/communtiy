import React, { useState } from 'react';
import { StyleSheet, Text, View, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useThemeStore } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { colors, spacing, typography, roundness } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const showToast = useToastStore((state) => state.showToast);

  const { themeMode, setThemeMode } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    // Guard will automatically pick this up and redirect to auth Stack
  };

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    showToast(`Switched to ${mode === 'dark' ? 'Dark' : 'Light'} Mode`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Navbar */}
      <View style={[styles.navbar, { borderBottomColor: colors.borderSecondary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text, fontSize: typography.sizes.lg }]}>
          Settings
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Theme Settings Group */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
          THEME MODE
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderRadius: roundness.md }]}>
          <View style={styles.itemRow}>
            <Ionicons
              name={themeMode === 'dark' ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={colors.text}
              style={styles.itemIcon}
            />
            <Text style={[styles.itemText, { color: colors.text, fontSize: typography.sizes.md }]}>
              Dark Theme Mode
            </Text>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(value) => handleThemeChange(value ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications mock Group */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
          NOTIFICATIONS
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderRadius: roundness.md }]}>
          <View style={[styles.itemRow, { borderBottomColor: colors.borderSecondary }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} style={styles.itemIcon} />
            <Text style={[styles.itemText, { color: colors.text, fontSize: typography.sizes.md }]}>
              Push Notifications
            </Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.itemRow}>
            <Ionicons name="mail-outline" size={20} color={colors.text} style={styles.itemIcon} />
            <Text style={[styles.itemText, { color: colors.text, fontSize: typography.sizes.md }]}>
              Email Updates
            </Text>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Help & About mock Group */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: typography.sizes.xs }]}>
          ABOUT
        </Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border, borderRadius: roundness.md }]}>
          <TouchableOpacity style={[styles.itemRow, { borderBottomColor: colors.borderSecondary }]}>
            <Ionicons name="shield-outline" size={20} color={colors.text} style={styles.itemIcon} />
            <Text style={[styles.itemText, { color: colors.text, fontSize: typography.sizes.md }]}>
              Privacy & Security
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemRow}>
            <Ionicons name="document-text-outline" size={20} color={colors.text} style={styles.itemIcon} />
            <Text style={[styles.itemText, { color: colors.text, fontSize: typography.sizes.md }]}>
              Terms of Service
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.border,
              borderRadius: roundness.md,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} style={styles.itemIcon} />
          <Text style={[styles.logoutText, { color: colors.error, fontSize: typography.sizes.md }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <Text style={[styles.appVersion, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
          Version 1.0.0 (Expo SDK 56)
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  sectionCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginTop: 30,
    justifyContent: 'center',
  },
  logoutText: {
    fontWeight: '700',
  },
  appVersion: {
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '500',
  },
});
