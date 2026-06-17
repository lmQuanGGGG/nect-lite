'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getUser, updateUser } from '@/services/profile.service';
import { UserModel } from '@/lib/types';
import AppShell from '@/components/AppShell';
import Header from '@/components/Header';
import toast from 'react-hot-toast';
import { clearDiscoverCache } from '../cache';

export default function MatchSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  
  // Settings state
  const [maxDistance, setMaxDistance] = useState(50);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(99);
  const [interestedInGender, setInterestedInGender] = useState('Tất cả');
  const [showDistance, setShowDistance] = useState(true);
  const [filterCommonGame, setFilterCommonGame] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const profile = await getUser(user.uid);
        if (profile) {
          if (profile.maxDistance !== undefined) setMaxDistance(profile.maxDistance);
          if (profile.minAge !== undefined) setMinAge(profile.minAge);
          if (profile.maxAge !== undefined) setMaxAge(profile.maxAge);
          if (profile.interestedInGender !== undefined) setInterestedInGender(profile.interestedInGender);
          if (profile.showDistance !== undefined) setShowDistance(profile.showDistance);
          if (profile.filterCommonGame !== undefined) setFilterCommonGame(profile.filterCommonGame);
        }
      } catch (err) {
        toast.error('Lỗi khi tải cài đặt');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, authLoading, router]);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ lấy vị trí');
      return;
    }
    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          if (user) {
            await updateUser(user.uid, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            clearDiscoverCache();
            toast.success('Đã cập nhật vị trí hiện tại!', {
              style: {
                border: '3px solid black',
                borderRadius: '12px',
                boxShadow: '3px 3px 0 black',
                fontWeight: 900
              }
            });
          }
        } catch (err) {
          toast.error('Lỗi lưu vị trí');
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        toast.error('Không thể lấy vị trí. Vui lòng cấp quyền trong trình duyệt!');
        setUpdatingLocation(false);
      }
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.uid, {
        maxDistance,
        minAge,
        maxAge,
        interestedInGender,
        showDistance,
        filterCommonGame,
      });
      clearDiscoverCache(); // Invalidate cache so DiscoverPage fetches new recommendations
      toast.success('Đã lưu cài đặt', {
        icon: '✅',
        style: {
          border: '3px solid black',
          borderRadius: '12px',
          boxShadow: '3px 3px 0 black',
          fontWeight: 900
        }
      });
      router.back();
    } catch (err) {
      toast.error('Lỗi khi lưu cài đặt');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell showNav={false}>
        <Header showBack backHref="/discover" title="Cài đặt vị trí & bộ lọc" />
        <div className="page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p style={{ fontWeight: 900, fontSize: '1.2rem' }}>Đang tải...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <Header 
        showBack 
        backHref="/discover" 
        title="Cài đặt vị trí & bộ lọc" 
        right={
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-primary)', 
              fontWeight: 900, 
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        }
      />
      
      <div className="page page-content" style={{ paddingBottom: '100px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Khoảng cách */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>Khoảng cách tối đa</h2>
            <button 
              onClick={handleUpdateLocation}
              disabled={updatingLocation}
              className="neo-btn"
              style={{ 
                padding: '8px 12px', 
                fontSize: '0.8rem', 
                background: 'var(--accent-orange)', 
                color: 'white',
                borderWidth: '2px',
                height: 'auto'
              }}
            >
              {updatingLocation ? '⏳ Đang lấy...' : '📍 Cập nhật vị trí'}
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Tìm người chơi trong bán kính {maxDistance} km
          </p>
          
          <input 
            type="range" 
            min="1" 
            max="2000" 
            value={maxDistance} 
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            style={{ width: '100%', marginBottom: '24px', accentColor: 'var(--accent-orange)' }}
          />
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {[10, 50, 100, 500].map(val => (
              <button
                key={val}
                onClick={() => setMaxDistance(val)}
                className="neo-btn"
                style={{ 
                  flex: 1, 
                  height: '40px', 
                  padding: '0', 
                  fontSize: '0.85rem',
                  background: maxDistance === val ? 'var(--accent-orange)' : 'var(--bg-surface)',
                  color: maxDistance === val ? 'white' : 'var(--text-primary)',
                  boxShadow: maxDistance === val ? '3px 3px 0 var(--neo-border)' : 'none',
                  borderWidth: '2px'
                }}
              >
                {val} km
              </button>
            ))}
          </div>
        </section>

        {/* Độ tuổi */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>Độ tuổi</h2>
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Từ {minAge} đến {maxAge} tuổi
          </p>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '8px', display: 'block' }}>Tối thiểu</label>
              <input 
                type="number" 
                className="neo-input"
                min="18" max={maxAge}
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '8px', display: 'block' }}>Tối đa</label>
              <input 
                type="number" 
                className="neo-input"
                min={minAge} max="99"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { label: '18-25', min: 18, max: 25 },
              { label: '26-35', min: 26, max: 35 },
              { label: '36+', min: 36, max: 99 }
            ].map(range => {
              const isSelected = minAge === range.min && maxAge === range.max;
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    setMinAge(range.min);
                    setMaxAge(range.max);
                  }}
                  className="neo-btn"
                  style={{ 
                    flex: 1, 
                    height: '40px', 
                    padding: '0', 
                    fontSize: '0.85rem',
                    background: isSelected ? 'var(--accent-orange)' : 'var(--bg-surface)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    boxShadow: isSelected ? '3px 3px 0 var(--neo-border)' : 'none',
                    borderWidth: '2px'
                  }}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Giới tính */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.5px' }}>Tìm kiếm</h2>
          </div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Giới tính bạn muốn tìm
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['Nam', 'Nữ', 'Tất cả'].map(gender => {
              const isSelected = interestedInGender === gender;
              return (
                <button
                  key={gender}
                  onClick={() => setInterestedInGender(gender)}
                  className="neo-btn"
                  style={{ 
                    flex: 1, 
                    height: '40px', 
                    padding: '0', 
                    fontSize: '0.85rem',
                    background: isSelected ? 'var(--accent-orange)' : 'transparent',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    boxShadow: isSelected ? '3px 3px 0 var(--neo-border)' : 'none',
                    borderWidth: isSelected ? '3px' : '0',
                    border: isSelected ? '3px solid var(--neo-border)' : 'none',
                  }}
                >
                  {gender}
                </button>
              );
            })}
          </div>
        </section>

        {/* Toggles */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Show Distance Toggle */}
          <div className="neo-box" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 900 }}>Hiển thị khoảng cách trên profile</span>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={showDistance} 
                onChange={(e) => setShowDistance(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-orange)' }}
              />
            </label>
          </div>

          {/* Filter Common Game Toggle */}
          <div className="neo-box" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, display: 'block', marginBottom: '4px' }}>Chỉ hiện người chơi chung game</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tắt → AI tự sắp xếp theo độ phù hợp</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={filterCommonGame} 
                onChange={(e) => setFilterCommonGame(e.target.checked)} 
                style={{ width: '20px', height: '20px', accentColor: 'var(--accent-orange)' }}
              />
            </label>
          </div>
        </section>
        
        {/* Helper info */}
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.05)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.1)', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Vị trí của bạn sẽ được cập nhật tự động để tìm người chơi gần bạn. Bạn có thể thay đổi khoảng cách matching bất cứ lúc nào.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
