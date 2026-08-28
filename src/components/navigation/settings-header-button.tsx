import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Settings as SettingsIcon } from '@/components/ui/icons';
import { hapticLight } from '@/lib/haptics';
import { TEMPLATE_PALETTE } from '@/lib/ui/template-palette';

export function SettingsHeaderButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => {
        hapticLight();
        router.push('/settings');
      }}
      hitSlop={8}
    >
      <SettingsIcon color={TEMPLATE_PALETTE.accentDim} />
    </Pressable>
  );
}
