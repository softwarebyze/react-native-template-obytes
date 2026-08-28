import { Feather } from '@expo/vector-icons';
import * as React from 'react';

import { TEMPLATE_PALETTE } from '@/lib/ui/template-palette';
import { isRTL } from '@/lib/i18n';

export function SettingsChevron() {
  return (
    <Feather
      name={isRTL ? 'chevron-left' : 'chevron-right'}
      size={22}
      color={TEMPLATE_PALETTE.accentDim}
    />
  );
}
