'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { updateUser } from '@/services/profile.service';
import { uploadAvatar, uploadAdditionalPhoto } from '@/services/storage.service';
import InterestTag from '@/components/InterestTag';
import toast from 'react-hot-toast';

// Matches Flutter app interest list
const INTEREST_OPTIONS = [
  'Gaming', 'Anime', 'Music', 'Sports', 'Travel', 'Cooking', 'Movies', 'Books',
  'Photography', 'Art', 'Fitness', 'Technology', 'Fashion', 'Dance', 'Yoga',
  'Hiking', 'Cars', 'Pets', 'Coffee', 'Foodie',
];

const GAME_STYLE_OPTIONS = ['Casual', 'Competitive', 'Story-Driven', 'Co-op', 'RPG', 'FPS', 'MOBA', 'Battle Royale'];

const LOOKING_FOR_OPTIONS = ['Bạn chơi game', 'Hẹn hò', 'Bạn bè', 'Networking'];

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 — Basic info
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');

  // Step 2 — Preferences
  const [lookingFor, setLookingFor] = useState('Bạn chơi game');
  const [gameStyle, setGameStyle] = useState('Casual');
  const [interestedInGender, setInterestedInGender] = useState('Tất cả');

  // Step 3 — Interests
  const [interests, setInterests] = useState<string[]>([]);

  // Step 4 — Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 5 — Additional photos
  const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const handleAdditionalPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (additionalFiles.length >= 4) { toast.error('Tối đa 4 ảnh phụ'); return; }
    setAdditionalFiles((prev) => [...prev, f]);
    setAdditionalPreviews((prev) => [...prev, URL.createObjectURL(f)]);
  };

  const toggleInterest = (i: string) => {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : prev.length < 10 ? [...prev, i] : prev
    );
  };

  const calcAge = (dob: string): number => {
    if (!dob) return 18;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let avatarUrl: string | undefined;
      let additionalPhotos: string[] = [];

      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.uid, avatarFile);
      }

      for (let i = 0; i < additionalFiles.length; i++) {
        const url = await uploadAdditionalPhoto(user.uid, additionalFiles[i], i);
        additionalPhotos.push(url);
      }

      await updateUser(user.uid, {
        username,
        bio,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        gender,
        height: height ? parseInt(height) : 160,
        age: calcAge(dateOfBirth),
        lookingFor,
        gameStyle,
        interestedInGender,
        interests,
        avatarUrl,
        additionalPhotos,
      });

      toast.success('Hồ sơ đã được tạo! 🎉');
      router.replace('/discover');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu hồ sơ';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ paddingTop: 48 }}>
      {/* Step bar */}
      <div className="step-bar">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`step-dot${i + 1 < step ? ' done' : i + 1 === step ? ' active' : ''}`}
          />
        ))}
      </div>

      {/* Step 1 — Basic info */}
      {step === 1 && (
        <div className="animate-slideUp">
          <h2 style={{ marginBottom: 4 }}>Thông tin cơ bản</h2>
          <p className="text-muted mb-4">Cho mọi người biết về bạn</p>

          <div className="input-group">
            <label className="input-label" htmlFor="ob-username">Tên hiển thị *</label>
            <input id="ob-username" className="input" placeholder="Tên của bạn" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="ob-dob">Ngày sinh *</label>
            <input id="ob-dob" type="date" className="input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} max={new Date(Date.now() - 18 * 365 * 24 * 3600000).toISOString().split('T')[0]} />
          </div>

          <div className="input-group">
            <label className="input-label">Giới tính *</label>
            <div className="gender-grid">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`gender-chip${gender === g ? ' selected' : ''}`}
                  onClick={() => setGender(g)}
                  id={`gender-${g}`}
                >
                  {g === 'Nam' ? '♂ Nam' : g === 'Nữ' ? '♀ Nữ' : '⚧ Khác'}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="ob-height">Chiều cao (cm)</label>
            <input id="ob-height" type="number" className="input" placeholder="160" value={height} onChange={(e) => setHeight(e.target.value)} min={100} max={250} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="ob-bio">Giới thiệu bản thân</label>
            <textarea id="ob-bio" className="input" rows={3} placeholder="Kể về bản thân, sở thích, phong cách chơi game..." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
          </div>
        </div>
      )}

      {/* Step 2 — Preferences */}
      {step === 2 && (
        <div className="animate-slideUp">
          <h2 style={{ marginBottom: 4 }}>Tìm kiếm gì?</h2>
          <p className="text-muted mb-4">Giúp chúng tôi tìm đúng người cho bạn</p>

          <div className="input-group">
            <label className="input-label">Bạn đang tìm kiếm</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {LOOKING_FOR_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  id={`looking-${o}`}
                  className={`gender-chip${lookingFor === o ? ' selected' : ''}`}
                  onClick={() => setLookingFor(o)}
                  style={{ textAlign: 'left', paddingLeft: 16 }}
                >
                  {lookingFor === o ? '✅' : '○'} {o}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Phong cách chơi game</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GAME_STYLE_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  id={`style-${g}`}
                  className={`gender-chip${gameStyle === g ? ' selected' : ''}`}
                  onClick={() => setGameStyle(g)}
                  style={{ flex: 'none' }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Muốn kết bạn với</label>
            <div className="gender-grid">
              {['Nam', 'Nữ', 'Tất cả'].map((g) => (
                <button
                  key={g}
                  type="button"
                  id={`interested-${g}`}
                  className={`gender-chip${interestedInGender === g ? ' selected' : ''}`}
                  onClick={() => setInterestedInGender(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Interests */}
      {step === 3 && (
        <div className="animate-slideUp">
          <h2 style={{ marginBottom: 4 }}>Sở thích</h2>
          <p className="text-muted mb-4">Chọn tối đa 10 sở thích ({interests.length}/10)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTEREST_OPTIONS.map((i) => (
              <InterestTag
                key={i}
                label={i}
                selectable
                selected={interests.includes(i)}
                onClick={() => toggleInterest(i)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Avatar */}
      {step === 4 && (
        <div className="animate-slideUp">
          <h2 style={{ marginBottom: 4 }}>Ảnh đại diện</h2>
          <p className="text-muted mb-4">Ảnh đẹp giúp bạn có nhiều match hơn</p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: '50%',
                border: '3px dashed var(--accent-border)',
                overflow: 'hidden',
                background: 'var(--bg-input)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('ob-avatar-input')?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : '📷'}
            </div>
            <input id="ob-avatar-input" type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <button
              id="btn-pick-avatar"
              type="button"
              className="btn btn-secondary"
              onClick={() => document.getElementById('ob-avatar-input')?.click()}
            >
              {avatarPreview ? '🔄 Đổi ảnh' : '📷 Chọn ảnh'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5 — Additional photos */}
      {step === 5 && (
        <div className="animate-slideUp">
          <h2 style={{ marginBottom: 4 }}>Thêm ảnh (tuỳ chọn)</h2>
          <p className="text-muted mb-4">Tối đa 4 ảnh phụ</p>

          <div className="grid-2">
            {additionalPreviews.map((url, i) => (
              <div key={i} style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-input)' }}>
                <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
            {additionalPreviews.length < 4 && (
              <div
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed var(--border-strong)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                }}
                onClick={() => document.getElementById('ob-add-photo')?.click()}
              >
                +
              </div>
            )}
          </div>
          <input id="ob-add-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAdditionalPhoto} />
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
        {step > 1 && (
          <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)} style={{ flex: 1 }}>
            ← Quay lại
          </button>
        )}

        {step < TOTAL_STEPS ? (
          <button
            id="btn-next-step"
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={step === 1 && (!username || !gender || !dateOfBirth)}
            onClick={() => setStep(step + 1)}
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            id="btn-finish-onboarding"
            type="button"
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={loading}
            onClick={handleFinish}
          >
            {loading ? 'Đang lưu...' : '🎉 Bắt đầu khám phá!'}
          </button>
        )}
      </div>
    </div>
  );
}
