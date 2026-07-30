'use client';

import { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { uploadMediaFile } from '@/lib/utils/media';

function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url) || url.toLowerCase().includes('pdf');
}

export function SellerDocumentUploadField({
  label,
  hint,
  value,
  onChange,
  accept = 'image/*,.pdf,application/pdf',
  disabled,
}: {
  label: string;
  hint?: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  accept?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMediaFile(file);
      onChange(url);
    } catch {
      // apiClient interceptor surfaces errors
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePreview = value && !isPdfUrl(value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}

      {value ? (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          {showImagePreview ? (
            <img src={value} alt="" className="h-20 w-20 rounded-md object-cover border" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-700">Document uploaded</p>
            <p className="text-xs text-muted-foreground truncate">{value}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-1 h-8 text-destructive"
              disabled={disabled || isUploading}
              onClick={() => onChange(undefined)}
            >
              <X className="mr-1 h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 transition-colors hover:border-primary/50 hover:bg-primary/5',
            (disabled || isUploading) && 'pointer-events-none opacity-60',
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium">Upload file</span>
              <span className="mt-1 text-xs text-muted-foreground">JPG, PNG, or PDF</span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept={accept}
            disabled={disabled || isUploading}
            onChange={handleFile}
          />
        </label>
      )}

      {value && !isUploading ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Replace file
        </Button>
      ) : null}
    </div>
  );
}
