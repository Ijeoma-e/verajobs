import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useStore } from '@/store/useStore';
import { askAssistant, discoverJobs } from '@/services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Avatar, Card, IconButton } from 'react-native-paper';

const { width } = Dimensions.get('window');

export default function AssistantScreen() {
  const { user, discoveredJobs, setDiscoveredJobs, markDiscoveredJobAsSeen } = useStore();
  const [messages, setMessages] = useState<any[]>([
    { id: 1, text: "Hi, I'm Vera. Identity synced. Ready to scan for your next high-fit role?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const isPreparing = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unseenJobs = discoveredJobs.filter(j => !j.isSeen);
    if (unseenJobs.length > 0) {
      setTimeout(() => {
        const report = {
          id: 'report-' + Date.now(),
          text: `Aura Intelligence Alert: I've identified ${unseenJobs.length} new high-fit roles while your identity was synced. Scanning background portals was successful.`,
          sender: 'ai',
          discoveredJobs: unseenJobs
        };
        setMessages(prev => [...prev, report]);
        unseenJobs.forEach(j => markDiscoveredJobAsSeen(j.id));
      }, 1000);
    }
  }, []);

  const handleSend = async (text: string | null, audioUri: string | null = null) => {
    if (!text && !audioUri) return;

    const displayMsg = text || "🎤 [Voice Memo]";
    const userMsg = { id: Date.now(), text: displayMsg, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    if (!audioUri) setInput('');
    setLoading(true);

    try {
      // Agentic Intent Detection: If user mentions "scan" or "find jobs"
      const lowerText = (text || "").toLowerCase();
      if (lowerText.includes("scan") || lowerText.includes("find jobs")) {
        setMessages(prev => [...prev, { id: Date.now() + 5, text: "Initiating Autonomous Discovery Loop... Scoping career portals.", sender: 'ai' }]);
        
        const existingUrls = discoveredJobs.map(j => j.url);
        const result = await discoverJobs(user?.preferences || "", user?.baseCV || "", existingUrls);
        
        setDiscoveredJobs([...result.discoveredJobs, ...discoveredJobs]);
        
        const aiMsg = { 
          id: Date.now() + 1, 
          text: result.message, 
          sender: 'ai',
          discoveredJobs: result.discoveredJobs
        };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      const result = await askAssistant(text, audioUri, user, user?.preferences || '');
      const aiMsg = { 
        id: Date.now() + 1, 
        text: result.response_text, 
        sender: 'ai',
        intent: result.intent,
        companies: result.suggested_companies,
        searchUrl: result.search_query ? `https://www.google.com/search?q=${encodeURIComponent(result.search_query + " jobs")}` : null,
        action: result.search_query ? "Explore Roles" : null
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.message || "My apologies, I'm momentarily offline.";
      setMessages(prev => [...prev, { id: Date.now() + 2, text: `Error: ${errorMsg}`, sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  async function startRecording() {
    if (isPreparing.current || recording) return;
    
    try {
      isPreparing.current = true;
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
      setRecording(null);
    } finally {
      isPreparing.current = false;
    }
  }

  async function stopRecording() {
    // If it's still preparing, we can't stop it yet. 
    // This is a race condition when the user taps very quickly.
    if (isPreparing.current) {
      // Wait a bit and try again, or just wait for it to finish preparing
      let checkCount = 0;
      while (isPreparing.current && checkCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        checkCount++;
      }
    }

    if (!recording) return;
    
    try {
      const status = await recording.getStatusAsync();
      if (status.canRecord) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        
        if (uri) {
          handleSend(null, uri);
        }
      } else {
        setRecording(null);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setRecording(null);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient colors={['#FDFDFF', '#F3F4FF', '#EBEBFF']} style={styles.background} pointerEvents="none" />
      
      {/* Aura Header */}
      <View style={styles.auraHeader}>
        <Text style={styles.headerTitle}>Vera</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Aura Active</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageWrapper, msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper]}>
            {msg.sender === 'ai' && (
              <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.aiAvatar}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#fff" />
              </LinearGradient>
            )}
            <View style={[styles.messageBubble, msg.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.messageText, msg.sender === 'user' ? styles.userText : styles.aiText]}>
                {msg.text}
              </Text>
              
              {/* Discovery Companies */}
              {msg.companies && (
                <View style={styles.companiesGrid}>
                  {msg.companies.map((c: any, i: number) => (
                    <View key={i} style={styles.auraCompanyCard}>
                      <Text style={styles.auraCompanyName}>{c.name}</Text>
                      <Text style={styles.auraCompanyReason}>{c.reason}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Agentic Discovered Jobs */}
              {msg.discoveredJobs && (
                <View style={styles.discoveredGrid}>
                  {msg.discoveredJobs.map((j: any) => (
                    <TouchableOpacity key={j.id} style={styles.discoveredCard} onPress={() => Linking.openURL(j.url)}>
                      <View style={styles.discHeader}>
                        <View style={styles.discBadge}>
                          <Text style={styles.discBadgeText}>{j.score}</Text>
                        </View>
                        <Text style={styles.discCompany}>{j.company}</Text>
                      </View>
                      <Text style={styles.discTitle}>{j.title}</Text>
                      <Text style={styles.discReason} numberOfLines={2}>{j.reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {msg.action && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(msg.searchUrl)}>
                  <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.actionGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                    <Text style={styles.actionBtnText}>{msg.action}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={14} color="#fff" style={{ marginLeft: 6 }} />
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.aiWrapper}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.aiAvatar}>
              <ActivityIndicator size="small" color="#fff" />
            </LinearGradient>
            <View style={[styles.messageBubble, styles.aiBubble, { paddingVertical: 10 }]}>
              <Text style={[styles.aiText, { fontStyle: 'italic', opacity: 0.6 }]}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modern Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputGlass}>
          <TouchableOpacity 
            style={[styles.micBtn, recording && styles.micBtnActive]} 
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <MaterialCommunityIcons name={recording ? "stop" : "microphone"} size={22} color={recording ? "#EF4444" : "#6366F1"} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Talk to Vera..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend(input)}
          />
          
          <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend(input)}>
            <LinearGradient colors={['#6366F1', '#8B5CF6']} style={styles.sendGradient}>
              <MaterialCommunityIcons name="arrow-up" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  auraHeader: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -1 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34, 197, 94, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E', marginRight: 6 },
  onlineText: { fontSize: 11, fontWeight: '800', color: '#22C55E', textTransform: 'uppercase' },
  chatList: { flex: 1 },
  chatContent: { padding: 20, paddingBottom: 100 },
  messageWrapper: { flexDirection: 'row', marginBottom: 20, alignItems: 'flex-end' },
  userWrapper: { justifyContent: 'flex-end' },
  aiWrapper: { justifyContent: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  messageBubble: { maxWidth: width * 0.75, padding: 16, borderRadius: 24 },
  userBubble: { backgroundColor: '#6366F1', borderBottomRightRadius: 4, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  aiBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EEF2FF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFFFFF', fontWeight: '500' },
  aiText: { color: '#0F172A', fontWeight: '400' },
  companiesGrid: { marginTop: 15, gap: 8 },
  auraCompanyCard: { backgroundColor: '#F9FAFF', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#EEF0FF' },
  auraCompanyName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  auraCompanyReason: { fontSize: 11, color: '#64748B', marginTop: 3 },
  discoveredGrid: { marginTop: 15, gap: 10 },
  discoveredCard: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  discHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  discBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  discBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  discCompany: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  discTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  discReason: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 18 },
  actionBtn: { marginTop: 15, borderRadius: 12, overflow: 'hidden' },
  actionGradient: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  inputContainer: { position: 'absolute', bottom: 0, width: '100%', paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  inputGlass: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 32, padding: 8, borderWidth: 1, borderColor: '#EEF2FF', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F5FF', justifyContent: 'center', alignItems: 'center' },
  micBtnActive: { backgroundColor: '#FEE2E2' },
  input: { flex: 1, paddingHorizontal: 15, fontSize: 15, color: '#0F172A' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
