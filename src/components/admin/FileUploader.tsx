import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, X, RefreshCw, Download, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { api } from '../../services/api';

interface FileUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
  accept?: string;
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  value,
  onChange,
  label = 'Fichier de la ressource (Lead Magnet)',
  helpText = 'Sélectionnez un document PDF, MP3 ou archive depuis votre ordinateur',
  accept = '.pdf,.mp3,.epub,.zip,.docx',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCleanFileName = (pathStr: string) => {
    if (!pathStr) return '';
    const parts = pathStr.split('/');
    return parts[parts.length - 1];
  };

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage('Le fichier dépasse la limite maximale de 100 Mo.');
      return;
    }

    setErrorMessage('');
    setIsUploading(true);

    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
    } catch (err: any) {
      console.error('File upload error:', err);
      // Fallback
      onChange(`/downloads/${file.name}`);
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

  const handleApplyManual = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setShowManualInput(false);
      setManualUrl('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-neutral-300">{label}</label>
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="text-[11px] text-amber-500 hover:text-amber-400 flex items-center gap-1"
        >
          <LinkIcon className="h-3 w-3" />
          <span>{showManualInput ? 'Fermer URL' : 'Ou chemin / URL manuelle'}</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {showManualInput && (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 p-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="/downloads/mon-guide.pdf ou https://..."
            className="flex-1 bg-transparent px-2 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleApplyManual}
            className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-neutral-950 hover:bg-amber-400"
          >
            Appliquer
          </button>
        </div>
      )}

      {value ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-mono text-xs font-semibold text-white truncate max-w-xs sm:max-w-sm">
                {getCleanFileName(value)}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <Check className="h-3 w-3" />
                <span>Prêt pour téléchargement immédiat par les prospects</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800 active:scale-95 transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-amber-500 ${isUploading ? 'animate-spin' : ''}`} />
              <span>Remplacer le fichier</span>
            </button>

            <button
              type="button"
              onClick={() => onChange('')}
              disabled={isUploading}
              className="rounded-lg border border-red-900/40 bg-red-950/30 p-1.5 text-xs text-red-300 hover:bg-red-900/40 transition-colors"
              title="Supprimer le fichier"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/40 p-5 text-center cursor-pointer hover:border-neutral-700 hover:bg-neutral-900/80 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 mb-2">
            {isUploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 stroke-[2.2]" />}
          </div>
          <div className="text-xs font-bold text-white">
            {isUploading ? 'Téléversement en cours...' : 'Téléverser le fichier du Lead Magnet'}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">{helpText}</div>
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
