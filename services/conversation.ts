import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  intent?: string;
  companies?: string[];
  searchUrl?: string;
  action?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Create a new conversation
export const createConversation = async (userId: string): Promise<string> => {
  const conversationsRef = collection(db, 'conversations');
  const newConversation = {
    userId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
};

// Get user's current conversation (or create one if none exists)
export const getUserConversation = async (userId: string): Promise<Conversation | null> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return null;
  }
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    userId: doc.data().userId,
    messages: doc.data().messages || [],
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  };
};

// Add a message to conversation
export const addMessageToConversation = async (
  conversationId: string,
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    timestamp: new Date(),
  };
  
  await updateDoc(conversationRef, {
    messages: [...(await getConversationMessages(conversationId)), newMessage],
    updatedAt: new Date(),
  });
};

// Get messages from a conversation
export const getConversationMessages = async (conversationId: string): Promise<Message[]> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  const docSnap = await getDoc(conversationRef);
  
  if (docSnap.exists()) {
    return docSnap.data().messages || [];
  }
  
  return [];
};

// Clear conversation history
export const clearConversation = async (conversationId: string): Promise<void> => {
  const conversationRef = doc(db, 'conversations', conversationId);
  await updateDoc(conversationRef, {
    messages: [],
    updatedAt: new Date(),
  });
};