import { Text } from 'react-native';
import { HeaderButton } from 'expo-router/react-navigation';

import { goBackOrHome } from '@/lib/navigation/go-back-or-home';
import { TEMPLATE_PALETTE } from '@/lib/ui/template-palette';

type Props = {
  accessibilityLabel?: string;
};

/** Always-visible leading chevron. Not a native-stack back control (those hide when canGoBack is false). */
export function StackEscapeButton({ accessibilityLabel = 'Back' }: Props) {
  return (
    <HeaderButton
      accessibilityLabel={accessibilityLabel}
      testID="stack-escape-button"
      onPress={() => {
        goBackOrHome();
      }}
    >
      <Text style={{ fontSize: 28, lineHeight: 28, color: TEMPLATE_PALETTE.accent }}>‹</Text>
    </HeaderButton>
  );
}
