import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Unsubscribe,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MatchModel, MessageModel } from '@/lib/types';

const matchesCol = 'matches';
const chatsCol = 'chats';

const toMillis = (value: unknown): number => {
  if (!value) return 0;
  if (typeof value === 'string') {
    const time = Date.parse(value);
    return Number.isNaN(time) ? 0 : time;
  }
  if (
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
};

// Stream matches for current user (realtime)
// Mirrors Flutter: getUserMatchesStream
export const subscribeToMatches = (
  userId: string,
  callback: (matches: MatchModel[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, matchesCol),
    where('userIds', 'array-contains', userId),
    where('status', '==', 'confirmed')
  );

  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MatchModel));
    
    // Sort in memory by lastMessageTime or updatedAt (descending)
    matches.sort((a, b) => {
      const aTime = toMillis(a.lastMessageTime) || toMillis(a.updatedAt);
      const bTime = toMillis(b.lastMessageTime) || toMillis(b.updatedAt);
      return bTime - aTime;
    });
    
    callback(matches);
  });
};

// Stream messages for a match (realtime)
// Mirrors Flutter: messagesStream
export const subscribeToMessages = (
  matchId: string,
  callback: (messages: MessageModel[]) => void,
  messageLimit = 50
): Unsubscribe => {
  const q = query(
    collection(db, chatsCol, matchId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(messageLimit)
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() } as MessageModel)
    );
    callback(messages.reverse());
  });
};

// Send text message
// Mirrors Flutter: sendMessage
export const sendMessage = async (
  matchId: string,
  senderId: string,
  text: string
): Promise<void> => {
  await addDoc(collection(db, chatsCol, matchId, 'messages'), {
    senderId,
    text,
    timestamp: serverTimestamp(),
    type: 'text',
  });

  await updateDoc(doc(db, matchesCol, matchId), {
    lastMessage: text,
    lastMessageTime: serverTimestamp(),
    lastMessageSenderId: senderId,
    lastMessageRead: false,
    updatedAt: serverTimestamp(),
  });
};

// Send image/video message
// Mirrors Flutter: sendMessageWithMedia
export const sendMediaMessage = async (
  matchId: string,
  senderId: string,
  mediaUrl: string,
  isVideo: boolean,
  caption?: string
): Promise<void> => {
  await addDoc(collection(db, chatsCol, matchId, 'messages'), {
    senderId,
    mediaUrl,
    isVideo,
    caption: caption ?? null,
    timestamp: serverTimestamp(),
    type: 'media',
  });

  await updateDoc(doc(db, matchesCol, matchId), {
    lastMessage: isVideo ? 'Đã gửi video' : 'Đã gửi hình ảnh',
    lastMessageTime: serverTimestamp(),
    lastMediaUrl: mediaUrl,
    lastIsVideo: isVideo,
    lastMessageSenderId: senderId,
    lastMessageRead: false,
    updatedAt: serverTimestamp(),
  });
};

// Mark as read
// Mirrors Flutter: markMatchAsRead
export const markAsRead = async (matchId: string, currentUserId: string): Promise<void> => {
  // Only mark if we're not the sender
  await updateDoc(doc(db, matchesCol, matchId), {
    lastMessageRead: true,
  });
};
