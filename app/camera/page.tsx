'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { postMoment } from '@/services/moment.service';
import { uploadMomentMedia } from '@/services/storage.service';
import CameraCapture from '@/components/CameraCapture';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

async function fetchMatchedIds(userId: string): Promise<string[]> {
  const snap = await getDocs(
    query(
      collection(db, 'matches'),
      where('userIds', 'array-contains', userId),
      where('status', '==', 'confirmed')
    )
  );
  const ids = new Set<string>();
  snap.docs.forEach((d) => {
    const userIds: string[] = d.data().userIds ?? [];
    userIds.forEach((id) => { if (id !== userId) ids.add(id); });
  });
  return [...ids];
}

export default function CameraPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!user || !file) return;
    setLoading(true);
    try {
      const matchIds = await fetchMatchedIds(user.uid);
      const mediaUrl = await uploadMomentMedia(user.uid, file);
      await postMoment({
        userId: user.uid,
        mediaUrl,
        isVideo: file.type.startsWith('video'),
        matchIds,
        caption: caption || undefined,
      });
      toast.success('Moment đã được đăng! 🎉');
      router.replace('/moment');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Đăng moment thất bại';
      if (msg.includes('LIMIT_EXCEEDED')) {
        toast.error('Bạn đã đăng quá 20 moments trong tháng này');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell showNav={false}>
      <Header
        title="Đăng Moment"
        showBack
        backHref="/moment"
      />
      <div className="page" style={{ paddingTop: 16, paddingBottom: 24 }}>
        <div className="page-content">
          <CameraCapture onCapture={setFile} accept="image/*,video/*" />

          <div className="input-group" style={{ marginTop: 16 }}>
            <label className="input-label" htmlFor="caption-input" style={{ fontWeight: 800 }}>Caption (tuỳ chọn)</label>
            <textarea
              id="caption-input"
              className="neo-input"
              rows={3}
              placeholder="Khoảnh khắc này..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={200}
            />
          </div>

          <button
            id="btn-post-moment"
            type="button"
            className="neo-btn neo-btn-primary"
            disabled={!file || loading}
            onClick={handlePost}
            style={{ marginTop: '16px', width: '100%', height: '56px', fontSize: '1rem' }}
          >
            {loading ? 'Đang đăng...' : '📸 Đăng Moment'}
          </button>

          <p className="text-muted text-center" style={{ marginTop: 12, fontSize: '0.8125rem' }}>
            Moment chỉ hiển thị với những người bạn đã match
          </p>
        </div>
      </div>
    </AppShell>
  );
}
