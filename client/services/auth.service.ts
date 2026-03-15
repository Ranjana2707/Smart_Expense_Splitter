// ============================================================
// Auth API service
// ============================================================

import api from './api';
import type { AuthResponse, LoginPayload, RegisterPayload } from '@/types';

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', payload);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', payload);
  return data;
}
