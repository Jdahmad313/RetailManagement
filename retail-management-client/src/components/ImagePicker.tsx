import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, Trash2, Camera, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  recommendedText?: string;
  maxDimension?: number;
}

export const compressImageFile = (
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<{ dataUrl: string; sizeKb: number }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not initialize canvas context'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const sizeKb = Math.round((dataUrl.length * (3 / 4)) / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const ImagePicker: React.FC<ImagePickerProps> = ({
  value,
  onChange,
  label = 'Product Image',
  recommendedText = 'Recommended: 600x600 px (Auto-compressed)',
  maxDimension = 800
}) => {
  // Detect active tab from current value
  const isBase64 = value?.startsWith('data:image');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>(isBase64 || !value ? 'upload' : 'url');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [compressedKb, setCompressedKb] = useState<number | null>(
    isBase64 ? Math.round((value.length * (3 / 4)) / 1024) : null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const { dataUrl, sizeKb } = await compressImageFile(file, maxDimension);
      setCompressedKb(sizeKb);
      onChange(dataUrl);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setCompressedKb(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{label}</label>
        {recommendedText && (
          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>{recommendedText}</span>
        )}
      </div>

      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.25rem' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('upload'); setErrorMsg(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'upload' ? 700 : 500,
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: activeTab === 'upload' ? '#eff6ff' : 'transparent',
            color: activeTab === 'upload' ? '#2563eb' : '#64748b',
            cursor: 'pointer'
          }}
        >
          <Upload size={14} /> Upload from Gallery / Camera
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('url'); setErrorMsg(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'url' ? 700 : 500,
            borderRadius: '0.25rem',
            border: 'none',
            backgroundColor: activeTab === 'url' ? '#eff6ff' : 'transparent',
            color: activeTab === 'url' ? '#2563eb' : '#64748b',
            cursor: 'pointer'
          }}
        >
          <LinkIcon size={14} /> Web Image Link (URL)
        </button>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#b91c1c', fontSize: '0.75rem', backgroundColor: '#fef2f2', padding: '0.375rem 0.5rem', borderRadius: '0.25rem' }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Active Tab Panel */}
      {activeTab === 'upload' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '0.5rem',
              padding: '1rem',
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.375rem'
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', color: '#3b82f6' }}>
              <Camera size={22} />
              <Upload size={22} />
            </div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1e293b' }}>
              {isProcessing ? 'Optimizing image...' : 'Choose from Gallery / Take Photo'}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              Drag & drop or tap to browse • Automatically compressed to lightweight WebP
            </div>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={value?.startsWith('data:') ? '' : (value || '')}
            onChange={(e) => {
              setCompressedKb(null);
              onChange(e.target.value);
            }}
            placeholder="https://images.unsplash.com/... or any image link"
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.25rem',
              fontSize: '0.8125rem'
            }}
          />
        </div>
      )}

      {/* Live Preview Bar */}
      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            backgroundColor: '#f1f5f9',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            marginTop: '0.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
            <img
              src={value}
              alt="Preview"
              style={{
                width: 48,
                height: 48,
                objectFit: 'cover',
                borderRadius: '0.25rem',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                flexShrink: 0
              }}
              onError={(e) => {
                // If broken URL
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                  {value.startsWith('data:image') ? 'Gallery Photo Attached' : 'Web Link Attached'}
                </span>
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {value.startsWith('data:image')
                  ? `Optimized size: ~${compressedKb ?? Math.round((value.length * 0.75) / 1024)} KB`
                  : value}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.3125rem 0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: '#b91c1c',
              backgroundColor: '#fee2e2',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ) : null}
    </div>
  );
};
