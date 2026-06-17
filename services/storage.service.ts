import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Upload user avatar — path: users/{userId}/avatar.jpg
// Mirrors Flutter: uploadImageBytes
export const uploadAvatar = async (
  userId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/avatar.jpg`);
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(storageRef);
};

// Upload additional profile photo
export const uploadAdditionalPhoto = async (
  userId: string,
  file: File,
  index: number
): Promise<string> => {
  const storageRef = ref(storage, `users/${userId}/photos/photo_${index}.jpg`);
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(storageRef);
};

// Upload moment media (image or video)
export const uploadMomentMedia = async (
  userId: string,
  file: File
): Promise<string> => {
  const ext = file.type.includes('video') ? 'mp4' : 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const storageRef = ref(storage, `moments/${userId}/${fileName}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(storageRef);
};

// Upload chat media
export const uploadChatMedia = async (
  matchId: string,
  file: File
): Promise<string> => {
  const ext = file.type.includes('video') ? 'mp4' : 'jpg';
  const fileName = `${Date.now()}.${ext}`;
  const storageRef = ref(storage, `chats/${matchId}/${fileName}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(storageRef);
};
