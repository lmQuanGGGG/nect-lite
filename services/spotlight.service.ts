import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  startAfter,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorMedia, MentorModel } from '@/lib/types';

const mentorMediaCol = 'mentor_media';
const mentorProfilesCol = 'mentor_profiles';
const usersCol = 'users';

export interface SpotlightPageResult {
  posts: MentorMedia[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// Get public Spotlight feed (all mentor_media, latest first)
// Mirrors Flutter: getMentorMedia
export const getSpotlightFeed = async (
  limitCount = 8,
  afterDoc?: QueryDocumentSnapshot<DocumentData> | null
): Promise<SpotlightPageResult> => {
  const constraints = [
    orderBy('createdAt', 'desc'),
    limit(limitCount + 1),
  ];

  const q = afterDoc ? query(
    collection(db, mentorMediaCol),
    ...constraints,
    startAfter(afterDoc)
  ) : query(collection(db, mentorMediaCol), ...constraints);

  const snap = await getDocs(q);
  const pageDocs = snap.docs.slice(0, limitCount);

  return {
    posts: pageDocs.map((d) => ({ id: d.id, ...d.data() } as MentorMedia)),
    lastDoc: pageDocs[pageDocs.length - 1] ?? afterDoc ?? null,
    hasMore: snap.docs.length > limitCount,
  };
};

// Lấy tổng số post spotlight
export const getTotalSpotlightCount = async (): Promise<number> => {
  try {
    const coll = collection(db, mentorMediaCol);
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (e) {
    console.error('Lỗi getTotalSpotlightCount:', e);
    return 0;
  }
};

// Lắng nghe (subscribe) real-time danh sách Spotlight
export const subscribeToSpotlightFeed = (
  limitCount: number,
  onData: (posts: MentorMedia[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(
    collection(db, mentorMediaCol),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const posts = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as MentorMedia)
      );
      onData(posts);
    },
    onError
  );
};

// Lấy số lượng spotlight đã xem của user
export const getTotalViewedSpotlightCountForUser = async (userId: string): Promise<number> => {
  try {
    const q = query(collection(db, mentorMediaCol), where('viewedBy', 'array-contains', userId));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (e) {
    console.error('Lỗi getTotalViewedSpotlightCount:', e);
    return 0;
  }
};

// Get approved mentors with user info
// Mirrors Flutter: getApprovedMentors
export const getApprovedMentors = async (): Promise<
  Array<MentorModel & { username: string; avatarUrl: string }>
> => {
  const snap = await getDocs(
    query(
      collection(db, mentorProfilesCol),
      where('status', '==', 'approved'),
      limit(50)
    )
  );

  const results: Array<MentorModel & { username: string; avatarUrl: string }> = [];

  for (const d of snap.docs) {
    try {
      const userSnap = await getDoc(doc(db, usersCol, d.id));
      const userData = userSnap.data() ?? {};
      results.push({
        ...(d.data() as MentorModel),
        userId: d.id,
        username: userData.username ?? '',
        avatarUrl: userData.avatarUrl ?? '',
      });
    } catch {
      // Skip if user not found
    }
  }

  return results;
};

// Toggle like on a mentor media post
// Mirrors Flutter: toggleLikeMentorMedia
export const toggleLikeMentorMedia = async (
  docId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> => {
  const ref = doc(db, mentorMediaCol, docId);
  await updateDoc(ref, {
    likes: currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
};

// Mark spotlight as viewed (Lưu vào users document để tối ưu băng thông)
export const markSpotlightViewed = async (docId: string, userId: string): Promise<void> => {
  const ref = doc(db, usersCol, userId);
  await updateDoc(ref, {
    seenSpotlightIds: arrayUnion(docId),
  });
};
