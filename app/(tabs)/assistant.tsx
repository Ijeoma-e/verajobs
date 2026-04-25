import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { askAssistant } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width } = Dimensions.get('window');

export default function AssistantScreen() {
  const [messages, setMessages] = useState<any[]>([
    { id: 1, text: "Hi, I'm Vera. I can help you find jobs, evaluate them, or tailor your CV. What are we looking for today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const { user } = useStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async (text: string | null, audioUri: string | null = null) => {
    if (!text && !audioUri) return;

    const displayMsg = text || "🎤 [Voice Message]";
    const userMsg = { id: Date.now(), text: displayMsg, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await askAssistant(text, audioUri, user, user?.preferences || '');
      const aiMsg = { 
        id: Date.now() + 1, 
        text: result.response_text, 
        sender: 'ai',
        intent: result.intent,
        companies: result.suggested_companies,
        searchUrl: result.search_query ? `https://www.google.com/search?q=${encodeURIComponent(result.search_query + " jobs")}` : null,
        action: result.search_query ? "Open Search Results" : null
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 2, text: "Sorry, I'm having trouble connecting right now.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    handleSend(null, uri);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={100}
    >
      <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={styles.background} />
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
            {msg.sender === 'ai' && (
              <View style={styles.aiAvatar}>
                <FontAwesome name="bolt" size={14} color="#fff" />
              </View>
            )}
            <View style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : styles.aiText]}>
                {msg.text}
              </Text>
              
              {/* Discovery Companies */}
              {msg.companies && (
                <View style={styles.companiesGrid}>
                  {msg.companies.map((c: any, i: number) => (
                    <View key={i} style={styles.companyCard}>
                      <Text style={styles.companyName}>{c.name}</Text>
                      <Text style={styles.companyReason}>{c.reason}</Text>
                    </View>
                  ))}
                </View>
              )}

              {msg.action && (
                <TouchableOpacity style={styles.actionBox} onPress={() => Linking.openURL(msg.searchUrl)}>
                  <Text style={styles.actionText}>{msg.action}</Text>
                  <FontAwesome name="external-link" size={10} color="#4F46E5" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.aiWrapper}>
            <View style={styles.aiAvatar}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.aiText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TouchableOpacity 
          style={[styles.micButton, recording && styles.micButtonActive]} 
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <FontAwesome name={recording ? "stop" : "microphone"} size={20} color={recording ? "#EF4444" : "#4F46E5"} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Ask Vera anything..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend(input)}
        />
        
        <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(input)}>
          <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.sendButtonGradient}>
            <FontAwesome name="arrow-up" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  userWrapper: {
    justifyContent: 'flex-end',
  },
  aiWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 14,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
    fontWeight: '500',
  },
  aiText: {
    color: '#0F172A',
  },
  companiesGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companyCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    borderRadius: 12,
    width: '100%',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  companyReason: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
