import React from 'react';
import { AuthScreenContent } from '@/components/AuthScreenContent';
import { signIn, signUp } from '@/services/auth.service';

export default function RegisterScreen() {
  return <AuthScreenContent initialMode="register" />;
}

