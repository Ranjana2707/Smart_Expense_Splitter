// ============================================================
// Payment History Screen
// ============================================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { fetchPayments } from '@/services/payment.service';
import type { Payment } from '@/types';
import ErrorMessage from '@/components/ErrorMessage';

export default function PaymentHistoryScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    try {
      setError('');
      const data = await fetchPayments();
      setPayments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPayments();
    }, [loadPayments]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPayments();
  };

  const renderPayment = ({ item }: { item: Payment }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.statusDot,
            item.status === 'COMPLETED' ? styles.dotGreen : styles.dotOrange,
          ]}
        />
        <View style={styles.info}>
          <Text style={styles.names}>
            {item.fromUser.name} → {item.toUser.name}
          </Text>
          <Text style={styles.group}>{item.groupName}</Text>
          <Text style={styles.date}>
            {new Date(item.paidAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{item.amount.toFixed(2)}</Text>
          <Text
            style={[
              styles.status,
              item.status === 'COMPLETED'
                ? styles.statusGreen
                : styles.statusOrange,
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <Text style={styles.subtitle}>Track all your settlements</Text>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <ErrorMessage message={error} />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPayment}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyText}>No payments yet</Text>
              <Text style={styles.emptySubtext}>
                Settle expenses to see payment history
              </Text>
            </View>
          }
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#11181C',
  },
  subtitle: {
    fontSize: 14,
    color: '#687076',
    marginTop: 4,
  },
  errorWrap: {
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  dotGreen: {
    backgroundColor: '#4caf50',
  },
  dotOrange: {
    backgroundColor: '#ff9800',
  },
  info: {
    flex: 1,
  },
  names: {
    fontSize: 15,
    fontWeight: '600',
    color: '#11181C',
  },
  group: {
    fontSize: 13,
    color: '#687076',
    marginTop: 2,
  },
  date: {
    fontSize: 12,
    color: '#9BA1A6',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#11181C',
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  statusGreen: {
    color: '#4caf50',
  },
  statusOrange: {
    color: '#ff9800',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
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
  emptySubtext: {
    fontSize: 14,
    color: '#687076',
    marginTop: 4,
  },
});
