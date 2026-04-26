import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, Platform } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? Colors.dark.primary : Colors.light.primary,
        tabBarInactiveTintColor: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
          borderTopWidth: isDark ? 1 : 0,
          borderTopColor: isDark ? Colors.dark.border : Colors.light.border,
          height: 60,
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
        },
        headerShown: useClientOnlyValue(false, true),
        headerStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
          borderBottomWidth: isDark ? 1 : 0,
          borderBottomColor: isDark ? Colors.dark.border : Colors.light.border,
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '900',
          color: isDark ? Colors.dark.text : Colors.light.text,
          fontSize: 22,
          letterSpacing: -0.5,
        },
        headerBackTitleVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pipeline',
          tabBarIcon: ({ color }) => <FontAwesome name="list" size={28} color={color} style={{ marginBottom: -3 }} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                {({ pressed }) => (
                  <FontAwesome
                    name="plus-circle"
                    size={25}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Vera',
          tabBarIcon: ({ color }) => <FontAwesome name="comment" size={28} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={28} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
      <Tabs.Screen
        name="appearance"
        options={{
          title: 'Appearance',
          tabBarIcon: ({ color }) => <FontAwesome name="paint-brush" size={28} color={color} style={{ marginBottom: -3 }} />,
        }}
      />
    </Tabs>
  );
}
