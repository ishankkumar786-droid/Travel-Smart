import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { TripProvider } from '@/contexts/TripContext';
import { Colors } from '@/constants/colors';

// Customize navigation themes
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.accent,
    background: Colors.darkBg,
    card: Colors.darkCard,
    text: Colors.darkText,
    border: Colors.darkBorder,
  },
};

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.lightBg,
    card: Colors.lightCard,
    text: Colors.lightText,
    border: Colors.lightBorder,
  },
};

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SafeAreaProvider>
          <AuthProvider>
            <TripProvider>
              <ThemeProvider value={isDark ? CustomDarkTheme : CustomLightTheme}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                  }}
                >
                  <Stack.Screen name="index" />
                  <Stack.Screen name="auth" options={{ animation: 'fade' }} />
                  <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="plan-trip" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                  <Stack.Screen name="loading" options={{ animation: 'fade' }} />
                  <Stack.Screen name="itinerary" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="contribute" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
                </Stack>
                <StatusBar style={isDark ? 'light' : 'dark'} />
              </ThemeProvider>
            </TripProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
