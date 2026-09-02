import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { getHeaderTitle, Header } from '@react-navigation/elements';

import { StackEscapeButton } from '@/components/navigation/stack-escape-button';

/** JS header that always shows the escape chevron, even when canGoBack is false. */
export function AlwaysOnEscapeHeader({ options, route }: NativeStackHeaderProps) {
  return (
    <Header
      title={getHeaderTitle(options, route.name)}
      headerLeft={() => <StackEscapeButton />}
      headerTransparent={options.headerTransparent}
      headerTintColor={options.headerTintColor}
      headerStyle={options.headerStyle}
      headerShadowVisible={options.headerShadowVisible}
      headerTitleStyle={options.headerTitleStyle}
      headerBackButtonDisplayMode={options.headerBackButtonDisplayMode}
    />
  );
}
