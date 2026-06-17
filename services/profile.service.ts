import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserModel } from '@/lib/types';

// collection: 'users/{uid}'
const usersCol = 'users';

export const getUser = async (userId: string): Promise<UserModel | null> => {
  const snap = await getDoc(doc(db, usersCol, userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserModel;
};

export const subscribeToUser = (
  userId: string,
  callback: (user: UserModel | null) => void
): Unsubscribe => {
  return onSnapshot(doc(db, usersCol, userId), (snap) => {
    if (!snap.exists()) {
      callback(null);
    } else {
      callback({ id: snap.id, ...snap.data() } as UserModel);
    }
  });
};

export const createUserProfile = async (userId: string, data: Partial<UserModel>): Promise<void> => {
  await setDoc(
    doc(db, usersCol, userId),
    {
      id: userId,
      username: '',
      avatarUrl: null,
      additionalPhotos: [],
      gender: 'Khác',
      age: 18,
      height: 160,
      bio: '',
      interests: [],
      lookingFor: 'Bạn chơi game',
      gameStyle: 'Casual',
      favoriteGames: [],
      rank: 'Gà Mờ',
      location: '',
      dateOfBirth: new Date(Date.now() - 18 * 365.25 * 24 * 3600 * 1000).toISOString(),
      maxDistance: 50,
      showDistance: true,
      minAge: 18,
      maxAge: 99,
      interestedInGender: 'Tất cả',
      filterCommonGame: false,
      isOnline: true,
      isVerified: false,
      isPremium: false,
      subscriptionTier: 'free',
      showActiveStatus: true,
      likeCount: 0,
      matchCount: 0,
      friendCount: 0,
      superLikeCount: 0,
      profileViews: 0,
      totalMatches: 0,
      totalLikes: 0,
      coinBalance: 0,
      isAdmin: false,
      incognitoMode: false,
      blockedUserIds: [],
      playTime: 0,
      winRate: 0,
      points: 0,
      gamingPlatforms: [],
      createdAt: serverTimestamp(),
      ...data,
    },
    { merge: true }
  );
};

export const updateUser = async (userId: string, data: Partial<UserModel>): Promise<void> => {
  await updateDoc(doc(db, usersCol, userId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};
