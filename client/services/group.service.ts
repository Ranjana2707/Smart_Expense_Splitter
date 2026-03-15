// ============================================================
// Group API service
// ============================================================

import api from './api';
import type {
  Group,
  CreateGroupPayload,
  Balance,
  Settlement,
} from '@/types';

export async function fetchGroups(): Promise<Group[]> {
  const { data } = await api.get<Group[]>('/groups');
  return data;
}

export async function fetchGroupById(id: number): Promise<Group> {
  const { data } = await api.get<Group>(`/groups/${id}`);
  return data;
}

export async function createGroup(payload: CreateGroupPayload): Promise<Group> {
  const { data } = await api.post<Group>('/groups', payload);
  return data;
}

export async function fetchBalances(groupId: number): Promise<Balance[]> {
  const { data } = await api.get<Balance[]>(`/groups/${groupId}/balances`);
  return data;
}

export async function fetchSettlements(groupId: number): Promise<Settlement[]> {
  const { data } = await api.get<Settlement[]>(`/groups/${groupId}/settlements`);
  return data;
}
