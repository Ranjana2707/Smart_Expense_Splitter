// ============================================================
// Group Detail Screen — Expenses, Balances, Settlements
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import {
  fetchGroupById,
  fetchBalances,
  fetchSettlements,
} from '@/services/group.service';
import type { Group, Expense, Balance, Settlement } from '@/types';
import AddExpenseModal from '@/components/AddExpenseModal';
import SettlementCard from '@/components/SettlementCard';
import ErrorMessage from '@/components/ErrorMessage';
import { useFocusEffect } from 'expo-router';

type Tab = 'expenses' | 'balances' | 'settlements';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const groupId = parseInt(id ?? '0', 10);

  const [group, setGroup] = useState<Group | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [groupData, balanceData, settlementData] = await Promise.all([
        fetchGroupById(groupId),
        fetchBalances(groupId),
        fetchSettlements(groupId),
      ]);
      setGroup(groupData);
      setBalances(balanceData);
      setSettlements(settlementData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load group data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  // Cast expenses from group (the API returns them as part of the group object)
  const expenses: Expense[] = (group as any)?.expenses ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{group?.name ?? 'Group'}</Text>
          <Text style={styles.headerSub}>
            {group?.members?.length ?? 0} members
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorMessage message={error} />
        </View>
      ) : null}

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {(['expenses', 'balances', 'settlements'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <View>
            {expenses.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🧾</Text>
                <Text style={styles.emptyText}>No expenses yet</Text>
              </View>
            ) : (
              expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseCard}>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseIcon}>
                      <Text style={styles.expenseIconText}>💵</Text>
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDesc}>
                        {expense.description}
                      </Text>
                      <Text style={styles.expensePaidBy}>
                        Paid by {expense.paidBy.name}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {new Date(expense.createdAt).toLocaleDateString(
                          'en-IN',
                          {
                            day: 'numeric',
                            month: 'short',
                          },
                        )}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ₹{expense.amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Balances Tab */}
        {activeTab === 'balances' && (
          <View>
            {balances.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⚖️</Text>
                <Text style={styles.emptyText}>No balances</Text>
              </View>
            ) : (
              balances.map((balance) => (
                <View key={balance.userId} style={styles.balanceCard}>
                  <View style={styles.balanceAvatar}>
                    <Text style={styles.balanceAvatarText}>
                      {balance.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.balanceName}>{balance.userName}</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      balance.balance >= 0
                        ? styles.balancePositive
                        : styles.balanceNegative,
                    ]}
                  >
                    {balance.balance >= 0 ? '+' : ''}₹
                    {Math.abs(balance.balance).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <View>
            {settlements.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>All settled up!</Text>
              </View>
            ) : (
              settlements.map((settlement, index) => (
                <SettlementCard
                  key={`${settlement.from.id}-${settlement.to.id}-${index}`}
                  settlement={settlement}
                  groupId={groupId}
                  currentUserId={user?.id ?? 0}
                  onPaymentComplete={loadData}
                />
              ))
            )}
          </View>
        )}

        {/* Bottom spacer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — Add Expense */}
      {activeTab === 'expenses' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowExpenseModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.fabText}>Add Expense</Text>
        </TouchableOpacity>
      )}

      {/* Add Expense Modal */}
      {group && (
        <AddExpenseModal
          visible={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onExpenseAdded={loadData}
          groupId={groupId}
          members={group.members}
          currentUserId={user?.id ?? 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#11181C',
  },
  headerSub: {
    fontSize: 13,
    color: '#687076',
    marginTop: 2,
  },
  errorWrap: {
    paddingHorizontal: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0a7ea4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9BA1A6',
  },
  tabTextActive: {
    color: '#0a7ea4',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11181C',
  },
  // Expense card
  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseIconText: {
    fontSize: 18,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#11181C',
  },
  expensePaidBy: {
    fontSize: 13,
    color: '#687076',
    marginTop: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#11181C',
  },
  // Balance card
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  balanceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  balanceAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  balanceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#11181C',
  },
  balanceAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
  balancePositive: {
    color: '#4caf50',
  },
  balanceNegative: {
    color: '#e53935',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    left: 20,
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
