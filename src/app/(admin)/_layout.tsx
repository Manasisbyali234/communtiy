import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAdminStore } from '../../store/adminStore';

export default function AdminLayout() {
  const { isAuthenticated } = useAdminStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inAdminGroup = segments[0] === '(admin)';
    if (!isAuthenticated && inAdminGroup) {
      router.replace('/admin-login' as any);
    }
  }, [isAuthenticated, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
