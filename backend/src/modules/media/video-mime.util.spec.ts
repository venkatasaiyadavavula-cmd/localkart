import { normalizeVideoMime } from './video-mime.util';

describe('normalizeVideoMime', () => {
  it('accepts standard video mime types', () => {
    expect(normalizeVideoMime('video/mp4', 'clip.mp4')).toBe('video/mp4');
  });

  it('infers mime from extension when browser sends octet-stream', () => {
    expect(normalizeVideoMime('application/octet-stream', 'promo.MOV')).toBe('video/quicktime');
    expect(normalizeVideoMime('', 'clip.webm')).toBe('video/webm');
  });

  it('rejects unknown types', () => {
    expect(normalizeVideoMime('image/jpeg', 'photo.jpg')).toBeNull();
  });
});
