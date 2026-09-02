import { Link, Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import { SettingsHeaderButton } from '@/components/navigation/settings-header-button';
import { StackEscapeButton } from '@/components/navigation/stack-escape-button';
import { Pressable, Text, View } from '@/components/ui';
import {
  Feed as FeedIcon,
  Settings as SettingsIcon,
  Style as StyleIcon,
} from '@/components/ui/icons';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';
import { translate } from '@/lib/i18n';
import {
  pickerFormSheetOptions,
  settingsStackOptions,
} from '@/lib/navigation/native-stack-options';

export default function TabLayout() {
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const settingsHeader = settingsStackOptions();
  const languageHeader = pickerFormSheetOptions(translate('settings.language'));

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
  }
  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <FeedIcon color={color} />,
          headerRight: () => <FeedHeaderRight />,
          tabBarButtonTestID: 'feed-tab',
        }}
      />

      <Tabs.Screen
        name="style"
        options={{
          title: 'Style',
          headerShown: false,
          tabBarIcon: ({ color }) => <StyleIcon color={color} />,
          tabBarButtonTestID: 'style-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: settingsHeader.title,
          headerShown: settingsHeader.headerShown,
          headerStyle: settingsHeader.headerStyle,
          headerTintColor: settingsHeader.headerTintColor,
          headerShadowVisible: settingsHeader.headerShadowVisible,
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
      <Tabs.Screen
        name="language"
        options={{
          href: null,
          title: languageHeader.title,
          headerShown: languageHeader.headerShown,
          headerStyle: languageHeader.headerStyle,
          headerTintColor: languageHeader.headerTintColor,
          headerTitleStyle: languageHeader.headerTitleStyle,
          headerLeft: () => <StackEscapeButton />,
        }}
      />
    </Tabs>
  );
}

function FeedHeaderRight() {
  return (
    <View className="flex-row items-center gap-3 pr-1">
      <CreateNewPostLink />
      <SettingsHeaderButton />
    </View>
  );
}

function CreateNewPostLink() {
  return (
    <Link href="/feed/add-post" asChild>
      <Pressable>
        <Text className="px-3 text-primary-300">Create</Text>
      </Pressable>
    </Link>
  );
}
