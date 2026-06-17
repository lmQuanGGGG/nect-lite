'use client';

import { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  accept?: string;
}

export default function CameraCapture({
  onCapture,
  accept = 'image/*,video/*',
}: CameraCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVideo(file.type.startsWith('video'));
    const url = URL.createObjectURL(file);
    setPreview(url);
    onCapture(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {preview && (
        <div
          style={{
            width: '100%',
            maxWidth: 320,
            aspectRatio: '3/4',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            background: 'var(--bg-card)',
            position: 'relative',
          }}
        >
          {isVideo ? (
            <video
              src={preview}
              controls
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={preview}
              alt="Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}

      <input
        id="camera-file-input"
        ref={fileRef}
        type="file"
        accept={accept}
        capture="environment"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      <button
        id="btn-pick-media"
        className="btn btn-secondary btn-full"
        onClick={() => fileRef.current?.click()}
        type="button"
      >
        {preview ? '🔄 Chọn lại' : '📷 Chụp ảnh / Chọn từ thư viện'}
      </button>
    </div>
  );
}
