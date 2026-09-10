import type { ErrorBoundaryProps } from 'expo-router';
import type { ViewProps } from 'react-native';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PostHogErrorBoundary, PostHogProvider } from 'posthog-react-native';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PostHogErrorFallback } from '@/components/posthog-error-fallback';
import { ConfirmDialogHost } from '@/components/ui/confirm-dialog';
import { useThemeConfig } from '@/components/ui/use-theme-config';
import { posthog } from '@/config/posthog';
import { hydrateAuth } from '@/features/auth/use-auth-store';
import { pickApprovedScreenParams } from '@/lib/analytics/screen-params';
import { APIProvider } from '@/lib/api';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import '@/lib/ignore-known-logs';
import '../global.css';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    posthog.captureException(error, { source: 'expo-router-error-boundary' });
  }, [error]);
  return <PostHogErrorFallback error={error} onRetry={retry} />;
}

export const unstable_settings = {
  initialRouteName: '(app)',
};

hydrateAuth();
loadSelectedTheme();
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hasHiddenSplash = React.useRef(false);
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const previousPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (previousPathname.current !== pathname) {
      posthog.screen(pathname, {
        previous_screen: previousPathname.current ?? null,
        ...pickApprovedScreenParams(params),
      });
      previousPathname.current = pathname;
    }
  }, [pathname, params]);

  const onLayoutRootView = React.useCallback(() => {
    if (hasHiddenSplash.current) {
      return;
    }

    hasHiddenSplash.current = true;
    SplashScreen.hide();
  }, []);

  return (
    <Providers onLayout={onLayoutRootView}>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

function Providers({
  children,
  onLayout,
}: {
  children: React.ReactNode;
  onLayout: ViewProps['onLayout'];
}) {
  const theme = useThemeConfig();
  return (
    <PostHogProvider
      client={posthog}
      autocapture={{
        captureScreens: false,
        captureTouches: true,
        propsToCapture: ['testID'],
        maxElementsCaptured: 20,
      }}
    >
      <PostHogErrorBoundary fallback={PostHogErrorFallback}>
        <GestureHandlerRootView
          onLayout={onLayout}
          style={styles.container}
          className={theme.dark ? 'dark' : undefined}
        >
          <KeyboardProvider>
            <ThemeProvider value={theme}>
              <APIProvider>
                <BottomSheetModalProvider>
                  {children}
                  <ConfirmDialogHost />
                  <FlashMessage position="top" />
                </BottomSheetModalProvider>
              </APIProvider>
            </ThemeProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
