import { UserModel } from '@/lib/types';

export const discoverCache = {
  candidates: [] as UserModel[],
  currentIndex: 0,
  hasFetched: false,
  timestamp: 0,
};

export const clearDiscoverCache = () => {
  discoverCache.hasFetched = false;
  discoverCache.candidates = [];
  discoverCache.currentIndex = 0;
};
