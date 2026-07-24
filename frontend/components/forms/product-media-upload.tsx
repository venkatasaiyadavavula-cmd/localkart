'use client';

import { Image as ImageIcon, Video, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const MAX_IMAGES_DEFAULT = 5;
const MAX_VIDEOS_DEFAULT = 3;

type UploadSectionVariant = 'card' | 'plain';

interface ProductImagesUploadSectionProps {
  variant?: UploadSectionVariant;
  cardClassName?: string;
  existingUrls?: string[];
  newPreviewUrls: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting?: (index: number) => void;
  onRemoveNew: (index: number) => void;
  maxImages?: number;
  required?: boolean;
  /** Grid style used on the seller “Add product” page */
  layout?: 'grid' | 'flex';
}

export function ProductImagesUploadSection({
  variant = 'plain',
  cardClassName,
  existingUrls = [],
  newPreviewUrls,
  onUpload,
  onRemoveExisting,
  onRemoveNew,
  maxImages = MAX_IMAGES_DEFAULT,
  required = false,
  layout = 'flex',
}: ProductImagesUploadSectionProps) {
  const total = existingUrls.length + newPreviewUrls.length;
  const canAddMore = total < maxImages;

  const thumbnails = (
    <div
      className={cn(
        layout === 'grid' ? 'mb-3 grid grid-cols-4 gap-2' : 'flex flex-wrap gap-3',
      )}
    >
      {existingUrls.map((url, index) => (
        <div
          key={`img-existing-${index}`}
          className={cn(
            'relative overflow-hidden border',
            layout === 'grid'
              ? 'aspect-square rounded-xl border-gray-100'
              : 'h-24 w-24 rounded-lg',
          )}
        >
          <img src={url} alt="" className="h-full w-full object-cover" />
          {onRemoveExisting ? (
            <button
              type="button"
              onClick={() => onRemoveExisting(index)}
              className={cn(
                'absolute flex items-center justify-center text-white',
                layout === 'grid'
                  ? 'top-1 right-1 h-5 w-5 rounded-full bg-black/60'
                  : '-right-1 -top-1 rounded-full bg-destructive p-0.5',
              )}
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ))}
      {newPreviewUrls.map((url, index) => (
        <div
          key={`img-new-${index}`}
          className={cn(
            'relative overflow-hidden border',
            layout === 'grid'
              ? 'aspect-square rounded-xl border-gray-100'
              : 'h-24 w-24 rounded-lg',
          )}
        >
          <img src={url} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onRemoveNew(index)}
            className={cn(
              'absolute flex items-center justify-center text-white',
              layout === 'grid'
                ? 'top-1 right-1 h-5 w-5 rounded-full bg-black/60'
                : '-right-1 -top-1 rounded-full bg-destructive p-0.5',
            )}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {canAddMore ? (
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-colors',
            layout === 'grid'
              ? 'aspect-square rounded-xl border-gray-200 hover:border-primary/40 hover:bg-primary/5'
              : 'h-24 w-24 rounded-lg border-muted-foreground/30 hover:border-primary',
          )}
        >
          <ImageIcon
            className={cn(
              'text-muted-foreground',
              layout === 'grid' ? 'mb-1 h-5 w-5 text-gray-300' : 'h-6 w-6',
            )}
          />
          <span
            className={cn(
              'text-muted-foreground',
              layout === 'grid' ? 'text-[10px] font-medium text-gray-400' : 'mt-1 text-xs',
            )}
          >
            {layout === 'grid' ? 'Add photo' : 'Upload'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onUpload}
          />
        </label>
      ) : null}
    </div>
  );

  const body = (
    <div className="space-y-3">
      {variant === 'plain' ? (
        <Label>
          Product Images{required ? ' *' : ''}{' '}
          <span className="text-muted-foreground font-normal">
            ({total}/{maxImages})
          </span>
        </Label>
      ) : null}
      {thumbnails}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className={cn('border-gray-100 shadow-sm', cardClassName)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold text-gray-700">
            Product Images{required ? ' *' : ''}
            <span className="ml-2 text-xs font-semibold text-gray-400">
              ({total}/{maxImages})
            </span>
          </CardTitle>
          {required ? (
            <CardDescription className="text-xs">At least one photo is required</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{thumbnails}</CardContent>
      </Card>
    );
  }

  return body;
}

interface ProductVideosUploadSectionProps {
  variant?: UploadSectionVariant;
  cardClassName?: string;
  existingUrls?: string[];
  newPreviewUrls: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveExisting?: (index: number) => void;
  onRemoveNew: (index: number) => void;
  maxVideos?: number;
  layout?: 'grid' | 'flex';
  showUploadFeeNote?: boolean;
}

function VideoThumbnail({
  previewUrl,
  layout,
  onRemove,
}: {
  previewUrl?: string;
  layout: 'grid' | 'flex';
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden border bg-muted',
        layout === 'grid'
          ? 'aspect-square rounded-xl border-violet-100 bg-violet-50/50'
          : 'h-24 w-24 rounded-lg',
      )}
    >
      {previewUrl ? (
        <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Video className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'absolute flex items-center justify-center text-white',
          layout === 'grid'
            ? 'top-1 right-1 h-5 w-5 rounded-full bg-black/60'
            : '-right-1 -top-1 rounded-full bg-destructive p-0.5',
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ProductVideosUploadSection({
  variant = 'plain',
  cardClassName,
  existingUrls = [],
  newPreviewUrls,
  onUpload,
  onRemoveExisting,
  onRemoveNew,
  maxVideos = MAX_VIDEOS_DEFAULT,
  layout = 'flex',
  showUploadFeeNote = true,
}: ProductVideosUploadSectionProps) {
  const total = existingUrls.length + newPreviewUrls.length;
  const canAddMore = total < maxVideos;

  const thumbnails = (
    <div
      className={cn(
        layout === 'grid' ? 'mb-3 grid grid-cols-4 gap-2' : 'flex flex-wrap gap-3',
      )}
    >
      {existingUrls.map((url, index) => (
        <VideoThumbnail
          key={`vid-existing-${index}`}
          previewUrl={url}
          layout={layout}
          onRemove={() => onRemoveExisting?.(index)}
        />
      ))}
      {newPreviewUrls.map((url, index) => (
        <VideoThumbnail
          key={`vid-new-${index}`}
          previewUrl={url}
          layout={layout}
          onRemove={() => onRemoveNew(index)}
        />
      ))}
      {canAddMore ? (
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-colors',
            layout === 'grid'
              ? 'aspect-square rounded-xl border-violet-200 bg-violet-50/30 hover:border-violet-400 hover:bg-violet-50'
              : 'h-24 w-24 rounded-lg border-muted-foreground/30 hover:border-primary',
          )}
        >
          <Video
            className={cn(
              layout === 'grid' ? 'mb-1 h-5 w-5 text-violet-400' : 'h-6 w-6 text-muted-foreground',
            )}
          />
          <span
            className={cn(
              layout === 'grid'
                ? 'text-[10px] font-medium text-violet-500'
                : 'mt-1 text-xs text-muted-foreground',
            )}
          >
            {layout === 'grid' ? 'Add video' : 'Upload'}
          </span>
          <input
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={onUpload}
          />
        </label>
      ) : null}
    </div>
  );

  const feeNote = showUploadFeeNote ? (
    <p className="text-xs text-muted-foreground">₹10 per video upload charge applies</p>
  ) : null;

  if (variant === 'card') {
    return (
      <Card className={cn('border-violet-100 shadow-sm', cardClassName)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-extrabold text-gray-700">
            Product Videos{' '}
            <span className="text-xs font-semibold text-violet-600">(optional, max {maxVideos})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Short clips help customers see your product — separate from photos above
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {thumbnails}
          {feeNote}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Label>
        Product Videos{' '}
        <span className="text-muted-foreground font-normal">
          (optional, max {maxVideos}) — {total}/{maxVideos}
        </span>
      </Label>
      {thumbnails}
      {feeNote}
    </div>
  );
}

export { MAX_IMAGES_DEFAULT, MAX_VIDEOS_DEFAULT };
