'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  preview?: string | null;
  variant?: 'avatar' | 'document';
}

export function FileUpload({
  onUpload,
  accept = 'image/jpeg,image/png',
  maxSizeMB = 5,
  label = 'Upload File',
  preview,
  variant = 'document',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(preview || null);

  const handleFile = useCallback(async (file: File) => {
    setError('');

    const allowedTypes = accept.split(',').map(t => t.trim());
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Maximum: ${maxSizeMB}MB`);
      return;
    }

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setPreviewUrl(preview || null);
    } finally {
      setUploading(false);
    }
  }, [accept, maxSizeMB, onUpload, preview]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (variant === 'avatar') {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-alt border-2 border-dashed border-border hover:border-primary transition-colors group"
          disabled={uploading}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Upload size={20} className="text-text-secondary group-hover:text-primary" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <span className="text-xs text-text-secondary">{label}</span>
        {error && <span className="text-xs text-danger">{error}</span>}
        <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-text-primary">{label}</label>}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        }`}
      >
        {previewUrl && accept.includes('image') ? (
          <div className="relative inline-block">
            <img src={previewUrl} alt="Preview" className="max-h-32 rounded-lg mx-auto" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {accept.includes('image') ? (
              <Image size={32} className="mx-auto text-text-secondary" />
            ) : (
              <FileText size={32} className="mx-auto text-text-secondary" />
            )}
            <p className="text-sm text-text-secondary">
              {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-text-tertiary">Max {maxSizeMB}MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" />
    </div>
  );
}
