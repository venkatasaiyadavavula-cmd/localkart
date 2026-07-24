import { isVideoFile } from './media';

describe('isVideoFile', () => {
  it('detects video mime types', () => {
    expect(isVideoFile({ type: 'video/mp4', name: 'clip.mp4' } as File)).toBe(true);
  });

  it('detects video by extension when mime is empty', () => {
    expect(isVideoFile({ type: '', name: 'promo.MOV' } as File)).toBe(true);
    expect(isVideoFile({ type: 'application/octet-stream', name: 'a.webm' } as File)).toBe(true);
  });

  it('rejects images', () => {
    expect(isVideoFile({ type: 'image/jpeg', name: 'photo.jpg' } as File)).toBe(false);
  });
});
