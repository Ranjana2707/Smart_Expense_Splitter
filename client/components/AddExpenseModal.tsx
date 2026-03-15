// ============================================================
// Modal for adding a new expense to a group
// ============================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { GroupMember, CreateExpensePayload } from '@/types';
import { createExpense } from '@/services/expense.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  groupId: number;
  members: GroupMember[];
  currentUserId: number;
}

export default function AddExpenseModal({
  visible,
  onClose,
  onExpenseAdded,
  groupId,
  members,
  currentUserId,
}: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState<number>(currentUserId);
  const [selectedMembers, setSelectedMembers] = useState<number[]>(
    members.map((m) => m.id),
  );
  const [loading, setLoading] = useState(false);

  const toggleMember = (id: number) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter a description');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Validation', 'Please enter a valid amount');
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert('Validation', 'Select at least one member to split with');
      return;
    }

    const payload: CreateExpensePayload = {
      description: description.trim(),
      amount: parsedAmount,
      paidById,
      groupId,
      splitAmongIds: selectedMembers,
    };

    setLoading(true);
    try {
      await createExpense(payload);
      setDescription('');
      setAmount('');
      setSelectedMembers(members.map((m) => m.id));
      onExpenseAdded();
      onClose();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to add expense',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Add Expense</Text>

          <TextInput
            style={styles.input}
            placeholder="Description"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            style={styles.input}
            placeholder="Amount (₹)"
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Paid by selector */}
          <Text style={styles.label}>Paid by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.chip,
                  paidById === m.id && styles.chipActive,
                ]}
                onPress={() => setPaidById(m.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    paidById === m.id && styles.chipTextActive,
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Split among */}
          <Text style={styles.label}>Split among</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.chip,
                  selectedMembers.includes(m.id) && styles.chipActive,
                ]}
                onPress={() => toggleMember(m.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedMembers.includes(m.id) && styles.chipTextActive,
                  ]}
                >
                  {m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnSubmit]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnSubmitText}>Add</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#11181C',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#11181C',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  chipText: {
    fontSize: 14,
    color: '#687076',
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#f0f0f0',
  },
  btnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#687076',
  },
  btnSubmit: {
    backgroundColor: '#0a7ea4',
  },
  btnSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
