import {
  APPLE_TOUCH_ICON_PATH,
  FAVICON_PNG_PATH,
  webAssetUrl,
} from '@/lib/web-share-meta';

describe('webAssetUrl', () => {
  it('stays root-relative when no deploy origin is set', () => {
    expect(webAssetUrl(APPLE_TOUCH_ICON_PATH, {})).toBe('/apple-touch-icon.png');
    expect(webAssetUrl(FAVICON_PNG_PATH, {})).toBe('/favicon.png');
  });

  it('uses VERCEL_URL so preview and production each get HTTPS icon URLs', () => {
    expect(
      webAssetUrl(APPLE_TOUCH_ICON_PATH, {
        VERCEL_URL: 'my-app.vercel.app',
      }),
    ).toBe(
      'https://my-app.vercel.app/apple-touch-icon.png',
    );
  });

  it('prefers EXPO_PUBLIC_WEB_ORIGIN over VERCEL_URL', () => {
    expect(
      webAssetUrl('/favicon.png', {
        EXPO_PUBLIC_WEB_ORIGIN: 'https://example.com/',
        VERCEL_URL: 'example.vercel.app',
      }),
    ).toBe('https://example.com/favicon.png');
  });
});
