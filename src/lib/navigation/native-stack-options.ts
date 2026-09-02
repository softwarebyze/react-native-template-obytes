import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import { Platform } from 'react-native';
import { translate } from '@/lib/i18n';
import { interFont } from '@/lib/ui/fonts';
import { TEMPLATE_PALETTE } from '@/lib/ui/template-palette';

const headerTitleStyle = {
  color: TEMPLATE_PALETTE.accent,
  ...interFont('bold'),
  fontSize: 17,
} as const;

const headerStyle = {
  backgroundColor: TEMPLATE_PALETTE.surface,
} as const;

export function settingsStackOptions(): NativeStackNavigationOptions {
  return {
    title: translate('settings.title'),
    headerShown: true,
    headerStyle: { backgroundColor: TEMPLATE_PALETTE.bg },
    headerTintColor: TEMPLATE_PALETTE.accent,
    headerTransparent: Platform.OS === 'ios',
    headerShadowVisible: false,
    headerLargeTitleShadowVisible: false,
    headerLargeStyle: { backgroundColor: 'transparent' },
    headerLargeTitle: Platform.OS === 'ios',
    headerBlurEffect: 'none',
    headerBackButtonDisplayMode: 'minimal',
  };
}

/** Language / other pickers — form sheet with a way home on web refresh. */
export function pickerFormSheetOptions(title: string): NativeStackNavigationOptions {
  return {
    presentation: 'formSheet',
    sheetGrabberVisible: true,
    sheetAllowedDetents: [0.32],
    sheetCornerRadius: 16,
    title,
    headerShown: true,
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal',
    headerStyle,
    headerTintColor: TEMPLATE_PALETTE.accent,
    headerTitleStyle,
    contentStyle: { backgroundColor: TEMPLATE_PALETTE.surface },
  };
}
