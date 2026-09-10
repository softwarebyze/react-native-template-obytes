import type { TxKeyPath } from '@/lib/i18n';

import * as React from 'react';
import { Pressable, Text, View } from '@/components/ui';
import { hapticLight } from '@/lib/haptics';
import {
  SETTINGS_ICON_SLOT,
  SETTINGS_ROW_MIN_HEIGHT,
  SETTINGS_ROW_PADDING_H,
  SETTINGS_ROW_PADDING_V,
} from '@/lib/ui/settings-layout';

import { SettingsChevron } from './settings-chevron';

type ItemProps = {
  text: TxKeyPath;
  value?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
};

export function SettingsItem({ text, value, icon, onPress }: ItemProps) {
  const isPressable = onPress !== undefined;
  return (
    <Pressable
      onPress={isPressable
        ? () => {
            hapticLight();
            onPress?.();
          }
        : undefined}
      pointerEvents={isPressable ? 'auto' : 'none'}
      className="flex-1 flex-row items-center justify-between"
      style={{
        minHeight: SETTINGS_ROW_MIN_HEIGHT,
        paddingHorizontal: SETTINGS_ROW_PADDING_H,
        paddingVertical: SETTINGS_ROW_PADDING_V,
      }}
    >
      <View className="flex-row items-center">
        {icon && (
          <View className="pr-2" style={{ width: SETTINGS_ICON_SLOT }}>
            {icon}
          </View>
        )}
        <Text tx={text} />
      </View>
      <View className="flex-row items-center">
        <Text className="text-neutral-600 dark:text-white">{value}</Text>
        {isPressable && (
          <View className="pl-2">
            <SettingsChevron />
          </View>
        )}
      </View>
    </Pressable>
  );
}
