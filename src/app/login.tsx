import React from 'react';
import { AuthScreenContent } from '@/components/AuthScreenContent';
import { signIn, signUp } from '@/services/auth.service';

export default function LoginScreen() {
  return <AuthScreenContent initialMode="login" />;
}

