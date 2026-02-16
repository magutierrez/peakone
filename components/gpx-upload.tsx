'use client';

import { useCallback, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface GPXUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  fileName: string | null;
  onClear: () => void;
}

export function GPXUpload({ onFileLoaded, fileName, onClear }: GPXUploadProps) {
  const t = useTranslations('GPXUpload');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoaded(content, file.name);
      };
      reader.readAsText(file);
    },
    [onFileLoaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.gpx')) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  if (fileName) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <span className="flex-1 truncate text-sm font-medium text-foreground">{fileName}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t('removeFile')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => inputRef.current?.click()}
      className="group flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
      role="button"
      tabIndex={0}
      aria-label={t('uploadAriaLabel')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Upload className="h-5 w-5" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{t('dragDrop')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('clickSelect')}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".gpx"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
