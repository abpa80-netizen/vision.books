import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, RefreshCw, Link as LinkIcon, Check, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  aspectRatio?: '3/4' | '16/9' | 'square' | 'auto';
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Couverture / Image',
  helpText = 'Sélectionnez une image (PNG, JPG, WebP) depuis votre ordinateur',
  aspectRatio = '3/4',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '3/4':
        return 'aspect-[3/4] max-w-[200px]';
      case '16/9':
        return 'aspect-[16/9] w-full max-w-md';
      case 'square':
        return 'aspect-square max-w-[180px]';
      default:
        return 'aspect-[3/4] max-w-[200px]';
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('L\'image dépasse la taille maximale autorisée (25 Mo).');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      // Fallback: load as local base64 so user can continue without blocking
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyUrl = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowUrlInput(false);
      setCustomUrl('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300">{label}</label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-amber-500 hover:text-amber-400 flex items-center gap-1"
          >
            <LinkIcon className="h-3 w-3" />
            <span>{showUrlInput ? 'Fermer URL' : 'Ou coller une URL'}</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Optional URL input toggle */}
      {showUrlInput && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://.../mon-image.jpg"
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-400"
          >
            Appliquer
          </button>
        </div>
      )}

      {/* Preview if image exists */}
      {value ? (
        <div className="space-y-3">
          <div className={`relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-md ${getAspectClass()}`}>
            <img
              src={value}
              alt="Aperçu sélectionné"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
                <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800 active:scale-95 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-500 ${isUploading ? 'animate-spin' : ''}`} />
              <span>Remplacer l'image</span>
            </button>

            <button
              type="button"
              onClick={() => onChange('')}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Supprimer</span>
            </button>
          </div>
        </div>
      ) : (
        /* Dropzone if no image */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/80'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-3">
            {isUploading ? (
              <RefreshCw className="h-6 w-6 animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6 stroke-[2.2]" />
            )}
          </div>

          <div className="text-xs font-bold text-white">
            {isUploading ? 'Téléversement en cours...' : 'Cliquez pour téléverser une image'}
          </div>
          <div className="mt-1 text-[11px] text-neutral-400">
            {helpText}
          </div>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-neutral-800/80 px-2.5 py-0.5 text-[10px] text-neutral-400">
            <span>Glisser-déposer accepté</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
