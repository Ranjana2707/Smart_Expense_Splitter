// ============================================================
// Payment API service
// ============================================================

import api from './api';
import type { Payment, MarkPaidPayload } from '@/types';

export async function fetchPayments(): Promise<Payment[]> {
  const { data } = await api.get<Payment[]>('/payments/history');
  return data;
}

export async function markPaid(payload: MarkPaidPayload): Promise<Payment> {
  const { data } = await api.post<Payment>('/payments/mark-paid', payload);
  return data;
}
