import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
  onSnapshot,
  Unsubscribe,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MomentModel } from '@/lib/types';

const momentsCol = 'moments';

export interface MomentPageResult {
  moments: MomentModel[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// Get moments visible to current user (matchIds arrayContains userId)
// Mirrors Flutter: getMomentsForUser
export const getMomentsForUser = async (
  userId: string,
  limitCount = 8,
  afterDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<MomentPageResult> => {
  const constraints = [
    where('matchIds', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount + 1),
  ];

  const q = afterDoc ? query(
    collection(db, momentsCol),
    ...constraints,
    startAfter(afterDoc)
  ) : query(collection(db, momentsCol), ...constraints);

  const snap = await getDocs(q);
  const pageDocs = snap.docs.slice(0, limitCount);

  return {
    moments: pageDocs.map((d) => ({ id: d.id, ...d.data() } as MomentModel)),
    lastDoc: pageDocs[pageDocs.length - 1] ?? afterDoc ?? null,
    hasMore: snap.docs.length > limitCount,
  };
};

// Lấy tổng số moment visible cho user
export const getTotalMomentCountForUser = async (userId: string): Promise<number> => {
  try {
    const q = query(collection(db, momentsCol), where('matchIds', 'array-contains', userId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (e) {
    console.error('Lỗi getTotalMomentCountForUser:', e);
    return 0;
  }
};

// Lắng nghe (subscribe) real-time danh sách Moment cho user
export const subscribeToMomentsForUser = (
  userId: string,
  limitCount: number,
  onData: (moments: MomentModel[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, momentsCol),
    where('matchIds', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const moments = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as MomentModel)
      );
      onData(moments);
    },
    onError
  );
};

// Lấy tổng số moment đã xem của user
export const getTotalViewedMomentCountForUser = async (userId: string): Promise<number> => {
  try {
    const q = query(collection(db, momentsCol), where('viewedBy', 'array-contains', userId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (e) {
    console.error('Lỗi getTotalViewedMomentCountForUser:', e);
    return 0;
  }
};

// Post new moment — saves to 'moments' collection
// Mirrors Flutter: postMoment
export const postMoment = async ({
  userId,
  mediaUrl,
  isVideo,
  matchIds,
  caption,
  thumbnailUrl,
}: {
  userId: string;
  mediaUrl: string;
  isVideo: boolean;
  matchIds: string[];
  caption?: string;
  thumbnailUrl?: string;
}): Promise<void> => {
  // Moment is visible to self + all match partners
  const visibleToUserIds = Array.from(new Set([userId, ...matchIds]));

  await addDoc(collection(db, momentsCol), {
    userId,
    mediaUrl,
    isVideo,
    thumbnailUrl: thumbnailUrl ?? null,
    createdAt: serverTimestamp(),
    matchIds: visibleToUserIds,
    reactions: [],
    replies: [],
    caption: caption ?? null,
  });
};

// Add emoji reaction to a moment
// Mirrors Flutter: addReactionToMoment
export const addReactionToMoment = async (
  momentId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  await updateDoc(doc(db, momentsCol, momentId), {
    reactions: arrayUnion({ userId, emoji }),
  });
};

export const removeReactionFromMoment = async (
  momentId: string,
  userId: string,
  emoji: string
): Promise<void> => {
  await updateDoc(doc(db, momentsCol, momentId), {
    reactions: arrayRemove({ userId, emoji }),
  });
};

// Add text reply to a moment
// Mirrors Flutter: addReplyToMoment
export const addReplyToMoment = async (
  momentId: string,
  userId: string,
  text: string
): Promise<void> => {
  await updateDoc(doc(db, momentsCol, momentId), {
    replies: arrayUnion({ userId, text, repliedAt: Timestamp.now() }),
  });
};

// Mark a moment as viewed (Lưu vào users document để tối ưu băng thông)
export const markMomentViewed = async (momentId: string, userId: string): Promise<void> => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    seenMomentIds: arrayUnion(momentId),
  });
};
