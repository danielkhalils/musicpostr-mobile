import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';

export default function NotFoundScreen() {
  const { session, user } = useAuth();
  const isAuthenticated = Boolean(session && user);

  return <Redirect href={(isAuthenticated ? '/(tabs)' : '/login') as any} />;
}
