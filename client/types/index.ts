// ============================================================
// Smart Expense Splitter — Type Definitions
// ============================================================

// ---- Auth ----
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

// ---- Groups ----
export interface Group {
  id: number;
  name: string;
  description?: string;
  members: GroupMember[];
  createdAt: string;
}

export interface GroupMember {
  id: number;
  name: string;
  email: string;
}

export interface CreateGroupPayload {
  name: string;
  description?: string;
  memberEmails: string[];
}

// ---- Expenses ----
export interface Expense {
  id: number;
  description: string;
  amount: number;
  paidBy: GroupMember;
  groupId: number;
  splitAmong: GroupMember[];
  createdAt: string;
}

export interface CreateExpensePayload {
  description: string;
  amount: number;
  paidById: number;
  groupId: number;
  splitAmongIds: number[];
}

// ---- Balances ----
export interface Balance {
  userId: number;
  userName: string;
  balance: number; // positive = owed money, negative = owes money
}

// ---- Settlements ----
export interface Settlement {
  from: GroupMember;
  to: GroupMember;
  amount: number;
}

// ---- Payments ----
export interface Payment {
  id: number;
  fromUser: GroupMember;
  toUser: GroupMember;
  amount: number;
  groupId: number;
  groupName: string;
  paidAt: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface MarkPaidPayload {
  fromUserId: number;
  toUserId: number;
  amount: number;
  groupId: number;
}
