// ============================================================
// Modal for creating a new group
// ============================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { CreateGroupPayload } from '@/types';
import { createGroup } from '@/services/group.service';

interface Props {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function CreateGroupModal({
  visible,
  onClose,
  onGroupCreated,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a group name');
      return;
    }

    const memberEmails = emails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    const payload: CreateGroupPayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      memberEmails,
    };

    setLoading(true);
    try {
      await createGroup(payload);
      setName('');
      setDescription('');
      setEmails('');
      onGroupCreated();
      onClose();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create group',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Create Group</Text>

          <TextInput
            style={styles.input}
            placeholder="Group Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={styles.input}
            placeholder="Description (optional)"
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
          />

          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Member emails (comma-separated)"
            placeholderTextColor="#999"
            value={emails}
            onChangeText={setEmails}
            multiline
            numberOfLines={3}
          />

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
                <Text style={styles.btnSubmitText}>Create</Text>
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
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
