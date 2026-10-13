import React, { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { MediaItem } from '../../../types';
import { Upload, Trash2, Image, Copy, Check } from 'lucide-react';

export const MediaView: React.FC = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const res = await api.get<{ success: boolean; media: MediaItem[] }>('/api/media');
      if (res.success) {
        setMediaList(res.media || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        await api.post('/api/media/upload', {
          filename: file.name,
          data: base64Data,
          category: 'gallery',
        });
        loadMedia();
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this media asset?')) return;
    try {
      await api.delete(`/api/media/${id}`);
      loadMedia();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleCopyUrl = (id: number, path: string) => {
    navigator.clipboard.writeText(`/${path}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      <div
        style={{
          background: '#131B2E',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#F8FAFC' }}>
            Media Asset Library
          </h3>
          <div style={{ color: '#94A3B8', fontSize: '0.8rem', marginTop: '4px' }}>
            Upload vehicle photos, tour gallery images & banner creatives
          </div>
        </div>

        <label
          style={{
            padding: '10px 18px',
            background: '#2563EB',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Upload size={16} />
          <span>{isUploading ? 'Uploading...' : 'Upload Media File'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '20px',
        }}
      >
        {mediaList.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '60px',
              textAlign: 'center',
              color: '#64748B',
              background: '#131B2E',
              borderRadius: '16px',
            }}
          >
            No media uploaded yet. Click "Upload Media File" to add car photos.
          </div>
        ) : (
          mediaList.map(m => (
            <div
              key={m.id}
              style={{
                background: '#131B2E',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  height: '140px',
                  background: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`/${m.file_path}`}
                  alt={m.original_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => {
                    // Fallback icon if image error
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div
                style={{
                  padding: '12px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#F8FAFC',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {m.original_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                    {Math.round(m.file_size / 1024)} KB • {m.category}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '8px',
                  }}
                >
                  <button
                    onClick={() => handleCopyUrl(m.id, m.file_path)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: copiedId === m.id ? '#10B981' : '#60A5FA',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedId === m.id ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedId === m.id ? 'Copied' : 'Copy Path'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(m.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
