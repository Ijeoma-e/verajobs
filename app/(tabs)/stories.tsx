import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { FontAwesome } from '@expo/vector-icons';

export default function StoriesScreen() {
  const { stories, addStory } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newStory, setNewStory] = useState({
    title: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    reflection: '',
  });

  const handleAddStory = () => {
    addStory({
      id: Math.random().toString(36).substring(7),
      ...newStory,
      tags: [],
    });
    setModalVisible(false);
    setNewStory({ title: '', situation: '', task: '', action: '', result: '', reflection: '' });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.storyCard}>
      <Text style={styles.storyTitle}>{item.title}</Text>
      <Text style={styles.storyPreview} numberOfLines={2}>{item.situation}</Text>
      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.detailButton}>
          <Text style={styles.detailButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={stories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Build your STAR+R story bank.</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.addButtonText}>Add First Story</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New STAR+R Story</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <FontAwesome name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            placeholder="Story Title (e.g., Conflict Resolution)"
            value={newStory.title}
            onChangeText={(t) => setNewStory({ ...newStory, title: t })}
          />

          <Text style={styles.inputLabel}>Situation</Text>
          <TextInput
            style={[styles.modalInput, styles.textArea]}
            multiline
            placeholder="Describe the context..."
            value={newStory.situation}
            onChangeText={(t) => setNewStory({ ...newStory, situation: t })}
          />

          <Text style={styles.inputLabel}>Task</Text>
          <TextInput
            style={[styles.modalInput, styles.textAreaSmall]}
            multiline
            placeholder="What was your responsibility?"
            value={newStory.task}
            onChangeText={(t) => setNewStory({ ...newStory, task: t })}
          />

          <Text style={styles.inputLabel}>Action</Text>
          <TextInput
            style={[styles.modalInput, styles.textArea]}
            multiline
            placeholder="What did you actually do?"
            value={newStory.action}
            onChangeText={(t) => setNewStory({ ...newStory, action: t })}
          />

          <Text style={styles.inputLabel}>Result</Text>
          <TextInput
            style={[styles.modalInput, styles.textAreaSmall]}
            multiline
            placeholder="What was the outcome?"
            value={newStory.result}
            onChangeText={(t) => setNewStory({ ...newStory, result: t })}
          />

          <Text style={styles.inputLabel}>Reflection</Text>
          <TextInput
            style={[styles.modalInput, styles.textAreaSmall]}
            multiline
            placeholder="What did you learn?"
            value={newStory.reflection}
            onChangeText={(t) => setNewStory({ ...newStory, reflection: t })}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleAddStory}>
            <Text style={styles.saveButtonText}>Save Story</Text>
          </TouchableOpacity>
          <View style={{ height: 50 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 15,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  storyPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  detailButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  textAreaSmall: {
    height: 60,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
