import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  limit,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserModel, SwipeAction } from '@/lib/types';

const usersCol = 'users';
const swipeHistoryCol = 'swipe_history';
const swipeLatestCol = 'swipe_latest';
const matchesCol = 'matches';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get candidate users with full local filtering using cursor pagination loop
export const getRecommendations = async (
  currentUser: UserModel,
  excludeIds: string[],
  limitCount = 100
): Promise<UserModel[]> => {
  const excluded = new Set([currentUser.id, ...excludeIds]);
  const results: UserModel[] = [];
  let lastVisible: DocumentSnapshot | null = null;
  let loops = 0;
  let totalFetched = 0;

  // Pre-calculate geo bounds if location exists
  let minLat: number | null = null;
  let maxLat: number | null = null;
  if (currentUser.latitude && currentUser.longitude) {
    const radiusKm = currentUser.maxDistance ?? 50;
    const latDelta = radiusKm / 111.0;
    minLat = currentUser.latitude - latDelta;
    maxLat = currentUser.latitude + latDelta;
  }

  // Loop until we find enough valid recommendations or run out of users
  while (results.length < limitCount) {
    loops++;
    
    // SAFEGUARD: Stop after 5 loops (max 500 users fetched) to protect Firestore bill
    if (loops > 5) {
      console.log(`[Recommender Filter] ⚠️ Dừng khẩn cấp sau 5 vòng lặp (đã quét 500 người) để tiết kiệm chi phí.`);
      break;
    }

    let qFilters: any[] = [];

    // Filter by Gender directly in query (if not "All")
    if (currentUser.interestedInGender && currentUser.interestedInGender !== 'Tất cả') {
      qFilters.push(where('gender', '==', currentUser.interestedInGender));
    }

    // Filter by Latitude Bounding Box directly in query
    if (minLat !== null && maxLat !== null) {
      qFilters.push(where('latitude', '>=', minLat));
      qFilters.push(where('latitude', '<=', maxLat));
      qFilters.push(orderBy('latitude'));
    }

    // Combine query
    let q = query(collection(db, usersCol), ...qFilters, limit(100));

    if (lastVisible) {
      q = query(collection(db, usersCol), ...qFilters, startAfter(lastVisible), limit(100));
    }

    const snap = await getDocs(q);
    if (snap.empty) {
      console.log(`[Recommender Filter] 🏁 Cạn kiệt Database sau ${loops} vòng lặp.`);
      break; // No more users in DB
    }

    totalFetched += snap.docs.length;
    lastVisible = snap.docs[snap.docs.length - 1];

    for (const d of snap.docs) {
      if (excluded.has(d.id)) continue;
      const user = { id: d.id, ...d.data() } as UserModel;

      // Local filter: incognitoMode (because Firestore only allows inequality on 1 field, and we used it for latitude)
      if (user.incognitoMode === true) continue;

      // 1. Calculate Distance if coordinates exist
      if (currentUser.latitude && currentUser.longitude && user.latitude && user.longitude) {
        user.distanceKm = calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          user.latitude,
          user.longitude
        );
      } else {
        user.distanceKm = undefined;
      }

      // 2. Apply Filters
      const minAge = currentUser.minAge ?? 18;
      const maxAge = currentUser.maxAge ?? 99;
      const interestedInGender = currentUser.interestedInGender ?? 'Tất cả';
      const maxDistance = currentUser.maxDistance ?? 50;
      const filterGame = currentUser.filterCommonGame ?? false;

      const ageOk = user.age >= minAge && user.age <= maxAge;
      const genderOk = interestedInGender === 'Tất cả' || user.gender === interestedInGender;
      const distanceOk = user.distanceKm === undefined || user.distanceKm <= maxDistance;
      const gameOk =
        !filterGame ||
        (user.favoriteGames || []).some((g) => (currentUser.favoriteGames || []).includes(g));

      if (ageOk && genderOk && distanceOk && gameOk) {
        results.push(user);
        if (results.length >= limitCount) break; // Stop processing if we hit limit exactly
      }
    }
  }

  console.log(`[Recommender Filter] 🔍 Tải ${totalFetched} người qua ${loops} vòng lặp -> Còn lại ${results.length} người phù hợp bộ lọc gốc.`);

  if (results.length === 0) return [];

  try {
    console.log(`[AI Recommend] 🤖 Đang gửi ${results.length} người cho AI chấm điểm...`);
    const currentUserMap = { ...currentUser, user_id: currentUser.id };
    delete (currentUserMap as any).id;

    const candidateUsersList = results.map((u) => {
      const userMap = { ...u, user_id: u.id };
      delete (userMap as any).id;
      return userMap;
    });

    const body = JSON.stringify({
      current_user: currentUserMap,
      candidate_users: candidateUsersList,
    });

    const response = await fetch('https://web-production-188ce.up.railway.app/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    if (response.ok) {
      const data = await response.json();
      const recs = data.recommendations || [];
      const aiResults: UserModel[] = [];

      for (const e of recs) {
        const userId = e.user_id;
        const score = e.score || e.match_score || e.compatibility_score || 0;
        
        // Ngưỡng điểm để "đậu": Hệ 100 thì lấy > 50, hệ 1 thì lấy > 0.5
        const threshold = (score <= 1 && score > 0) ? 0.5 : 50;

        if (score >= threshold) {
          const user = results.find((u) => u.id === userId);
          if (user) {
            aiResults.push(user);
          }
        }
      }
      
      console.log(`[AI Recommend] ✅ AI đã chấm xong! Lọc bỏ người không hợp, còn lại ${aiResults.length} người xuất sắc nhất.`);
      return aiResults;
    } else {
      console.warn(`[AI Recommend] ⚠️ API lỗi (${response.status}), fallback dùng danh sách lọc gốc.`);
      return results;
    }
  } catch (err) {
    console.warn(`[AI Recommend] ⚠️ Lỗi kết nối AI:`, err);
    console.log(`[AI Recommend] ⚠️ Fallback dùng danh sách lọc gốc.`);
    return results;
  }
};

// Get all userIds that current user has swiped
// Mirrors Flutter: getSwipedUserIds
export const getSwipedUserIds = async (userId: string): Promise<string[]> => {
  const snap = await getDocs(
    query(collection(db, swipeHistoryCol), where('userId', '==', userId))
  );
  const ids = snap.docs.map((d) => d.data().targetUserId as string);
  return [...new Set(ids)];
};

// Save a swipe action — writes to swipe_history (log) + swipe_latest (fast lookup)
// Mirrors Flutter: saveSwipeHistory
export const saveSwipe = async (
  userId: string,
  targetUserId: string,
  action: SwipeAction
): Promise<void> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

  await addDoc(collection(db, swipeHistoryCol), {
    userId,
    targetUserId,
    action,
    timestamp: serverTimestamp(),
    expiresAt,
  });

  const latestDocId = `${userId}_${targetUserId}`;
  await setDoc(doc(db, swipeLatestCol, latestDocId), {
    userId,
    targetUserId,
    action,
    timestamp: serverTimestamp(),
  });
};

// Check if target has already liked current user (mutual like)
// Mirrors Flutter: checkMutualLike
export const checkMutualLike = async (
  userId: string,
  targetUserId: string
): Promise<boolean> => {
  const snap = await getDocs(
    query(
      collection(db, swipeHistoryCol),
      where('userId', '==', targetUserId),
      where('targetUserId', '==', userId),
      where('action', '==', 'like'),
      limit(1)
    )
  );
  return !snap.empty;
};

// Create a confirmed match between two users
// Mirrors Flutter: createNewMatch
export const createMatch = async (
  userA: string,
  userB: string,
  game = ''
): Promise<string> => {
  const docRef = await addDoc(collection(db, matchesCol), {
    userIds: [userA, userB],
    game,
    matchedAt: serverTimestamp(),
    isActive: true,
    confirmations: { [userA]: true, [userB]: true },
    status: 'confirmed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

// Check if match already exists between two users
export const getExistingMatch = async (
  userA: string,
  userB: string
): Promise<string | null> => {
  const snap = await getDocs(
    query(
      collection(db, matchesCol),
      where('userIds', 'array-contains', userA),
      where('isActive', '==', true)
    )
  );
  for (const d of snap.docs) {
    const ids: string[] = d.data().userIds ?? [];
    if (ids.includes(userB)) return d.id;
  }
  return null;
};

// Get users who swiped right on current user
export const getLikedMeUserIds = async (userId: string): Promise<string[]> => {
  try {
    const snap = await getDocs(
      query(
        collection(db, swipeLatestCol),
        where('targetUserId', '==', userId),
        where('action', '==', 'like')
      )
    );
    const ids = snap.docs.map((d) => d.data().userId as string);
    return [...new Set(ids)];
  } catch (error) {
    console.warn('[LikeMe] Query swipe_latest cần index, fallback lọc client-side:', error);
    const snap = await getDocs(
      query(collection(db, swipeLatestCol), where('targetUserId', '==', userId))
    );
    const ids = snap.docs
      .filter((d) => d.data().action === 'like')
      .map((d) => d.data().userId as string);
    return [...new Set(ids)];
  }
};
