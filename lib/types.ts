// TypeScript types mirroring Flutter models exactly.
// Field names match Firestore schema from gamenect_new Flutter app.

import { Timestamp } from 'firebase/firestore';

// ─── USER ───────────────────────────────────────────────────────────────────
export interface UserModel {
  id: string;
  username: string;
  avatarUrl?: string;
  additionalPhotos: string[];
  gender: string;
  age: number;
  height: number;
  bio: string;
  interests: string[];
  lookingFor: string;
  gameStyle: string;
  favoriteGames: string[];
  rank: string;
  location: string;
  dateOfBirth: string; // ISO8601 string
  latitude?: number;
  longitude?: number;
  distanceKm?: number | null;
  address?: string;
  city?: string;
  country?: string;
  // Matching settings
  maxDistance: number;
  showDistance: boolean;
  minAge: number;
  maxAge: number;
  interestedInGender: string;
  filterCommonGame: boolean;
  // Status
  isOnline: boolean;
  isVerified: boolean;
  isPremium: boolean;
  subscriptionTier: string;
  showActiveStatus: boolean;
  lastActiveTime?: string;
  lastSeen?: string;
  // Stats
  likeCount: number;
  matchCount: number;
  friendCount: number;
  superLikeCount: number;
  profileViews: number;
  totalMatches: number;
  totalLikes: number;
  coinBalance: number;
  createdAt?: string | Timestamp;
  isAdmin: boolean;
  incognitoMode: boolean;
  blockedUserIds: string[];
  education?: string;
  occupation?: string;
  playTime: number;
  winRate: number;
  points: number;
  gamingPlatforms: string[];
}

// ─── MATCH ───────────────────────────────────────────────────────────────────
export interface MatchModel {
  id: string;
  userIds: string[];
  game: string;
  matchedAt: string | Timestamp;
  isActive: boolean;
  confirmations: Record<string, boolean>;
  status: 'pending' | 'partial' | 'confirmed' | 'cancelled' | 'expired';
  cancelReason?: string;
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
  confirmedAt?: string | Timestamp;
  cancelledAt?: string | Timestamp;
  expiresAt?: string | Timestamp;
  // Chat preview
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  lastMessageSenderId?: string;
  lastMessageRead?: boolean;
  lastMediaUrl?: string;
  lastIsVideo?: boolean;
  isMentorMatch?: boolean;
}

// ─── MESSAGE ─────────────────────────────────────────────────────────────────
export type MessageType = 'text' | 'media' | 'voice' | 'call' | 'game' | 'react';

export interface MessageModel {
  id: string;
  senderId: string;
  text?: string;
  caption?: string;
  mediaUrl?: string;
  isVideo?: boolean;
  audioUrl?: string;
  duration?: number;
  type: MessageType;
  timestamp: Timestamp;
  isRecalled?: boolean;
  isForwarded?: boolean;
  reactions?: Array<{ userId: string; emoji: string }>;
  repliedToId?: string;
  repliedToText?: string;
  repliedToSender?: string;
  callStatus?: 'ended' | 'missed' | 'declined' | 'cancelled';
  emoji?: string;
  gameId?: string;
  gameName?: string;
}

// ─── MOMENT ─────────────────────────────────────────────────────────────────
export interface MomentModel {
  id: string;
  userId: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  isVideo: boolean;
  createdAt: Timestamp | string;
  matchIds: string[];
  reactions: Array<{ userId: string; emoji: string }>;
  replies: Array<{ userId: string; text: string; repliedAt: Timestamp }>;
  caption?: string;
}

// ─── MENTOR PROFILE ──────────────────────────────────────────────────────────
export interface MentorModel {
  userId: string;
  games: string[];
  bio: string;
  achievements: string;
  rating: number;
  totalReviews: number;
  followerCount: number;
  totalStreams: number;
  totalGiftsReceived: number;
  status: 'pending' | 'approved' | 'rejected' | 'none';
  appliedAt: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  rejectReason?: string;
}

// ─── MENTOR MEDIA (Spotlight) ────────────────────────────────────────────────
export interface MentorMedia {
  id: string;
  mentorId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption: string;
  duration?: number;
  month: string;
  createdAt: Timestamp;
  likes: string[];
}

// ─── SWIPE ───────────────────────────────────────────────────────────────────
export type SwipeAction = 'like' | 'dislike' | 'superlike';

export interface SwipeHistory {
  id: string;
  userId: string;
  targetUserId: string;
  action: SwipeAction;
  timestamp: Timestamp;
}
