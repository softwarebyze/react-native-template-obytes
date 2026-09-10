/** Route params that are safe to send as PostHog screen properties. */
const POSTHOG_SCREEN_PARAM_KEYS = ['id'] as const;

type ScreenParamKey = (typeof POSTHOG_SCREEN_PARAM_KEYS)[number];

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
    return value[0];
  }
  return undefined;
}

/** Pick allowlisted, non-sensitive search params. Drops tokens, emails, and other deep-link fields. */
export function pickApprovedScreenParams(
  params: Record<string, unknown>,
): Partial<Record<ScreenParamKey, string>> {
  const approved: Partial<Record<ScreenParamKey, string>> = {};
  for (const key of POSTHOG_SCREEN_PARAM_KEYS) {
    const value = firstString(params[key]);
    if (value !== undefined) {
      approved[key] = value;
    }
  }
  return approved;
}
