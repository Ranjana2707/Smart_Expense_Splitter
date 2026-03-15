// ============================================================
// Expense API service
// ============================================================

import api from './api';
import type { Expense, CreateExpensePayload } from '@/types';

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await api.post<Expense>('/expenses', payload);
  return data;
}
