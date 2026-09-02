import Constants from 'expo-constants';
import PostHog from 'posthog-react-native';

import { isPostHogProjectToken } from '@/lib/analytics/posthog-context';

const extra = Constants.expoConfig?.extra as {
  posthogProjectToken?: string;
  posthogHost?: string;
  appEnv?: string;
} | undefined;

const projectKey = extra?.posthogProjectToken;
const host = extra?.posthogHost || 'https://us.i.posthog.com';

/** Placeholder analytics wiring. Set POSTHOG_PROJECT_TOKEN in EAS env (not EXPO_PUBLIC_*). */
export const posthogConfig = {
  projectToken: projectKey || '',
  host,
  enabled: isPostHogProjectToken(projectKey),
  appEnv: extra?.appEnv || process.env.EXPO_PUBLIC_APP_ENV || 'development',
};

/**
 * Disabled-safe client. Root layout imports `{ posthog }`.
 * Without a real phc_ token, capture/screen/exception are no-ops.
 */
export const posthog = new PostHog(
  posthogConfig.enabled ? posthogConfig.projectToken : 'phc_disabled_placeholder',
  {
    host: posthogConfig.host,
    disabled: !posthogConfig.enabled,
    enableSessionReplay: false,
    persistence: posthogConfig.enabled ? 'file' : 'memory',
    captureAppLifecycleEvents: posthogConfig.enabled,
  },
);

if (!posthogConfig.enabled && __DEV__) {
  console.warn('PostHog is off. Set POSTHOG_PROJECT_TOKEN in .env or EAS env to enable analytics.');
}
