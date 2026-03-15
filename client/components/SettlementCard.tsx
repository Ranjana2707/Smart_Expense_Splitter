// ============================================================
// Settlement card with UPI Pay Now + QR code
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { Settlement } from '@/types';
import { markPaid } from '@/services/payment.service';

interface Props {
  settlement: Settlement;
  groupId: number;
  currentUserId: number;
  onPaymentComplete: () => void;
}

export default function SettlementCard({
  settlement,
  groupId,
  currentUserId,
  onPaymentComplete,
}: Props) {
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCurrentUserPayer = settlement.from.id === currentUserId;

  // Build UPI deep link
  const upiUrl = `upi://pay?pa=${settlement.to.email}@upi&pn=${encodeURIComponent(
    settlement.to.name,
  )}&am=${settlement.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    'Expense Settlement',
  )}`;

  const handlePayNow = async () => {
    try {
      const supported = await Linking.canOpenURL(upiUrl);
      if (supported) {
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert('UPI Not Available', 'No UPI app found on this device.');
      }
    } catch {
      Alert.alert('Error', 'Failed to open UPI app');
    }
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      await markPaid({
        fromUserId: settlement.from.id,
        toUserId: settlement.to.id,
        amount: settlement.amount,
        groupId,
      });
      Alert.alert('Success', 'Payment marked as completed');
      onPaymentComplete();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to mark payment',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {settlement.from.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.names}>
            {settlement.from.name} → {settlement.to.name}
          </Text>
          <Text style={styles.amount}>₹{settlement.amount.toFixed(2)}</Text>
        </View>
      </View>

      {isCurrentUserPayer && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.payBtn} onPress={handlePayNow}>
            <Text style={styles.payBtnText}>💳 Pay Now (UPI)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => setShowQR(!showQR)}
          >
            <Text style={styles.qrBtnText}>
              {showQR ? 'Hide QR' : 'Show QR'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.markBtn}
            onPress={handleMarkPaid}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.markBtnText}>✓ Mark Paid</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {showQR && (
        <View style={styles.qrContainer}>
          <QRCode value={upiUrl} size={200} />
          <Text style={styles.qrHint}>Scan to pay via UPI</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  names: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e65100',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  payBtn: {
    flex: 1,
    backgroundColor: '#4caf50',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  qrBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrBtnText: {
    color: '#11181C',
    fontWeight: '600',
    fontSize: 13,
  },
  markBtn: {
    flex: 1,
    backgroundColor: '#0a7ea4',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  markBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  qrHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#687076',
  },
});
