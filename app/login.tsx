import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const validateLogin = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!isLoaded || !validateLogin()) return;
    setLoading(true);
    
    try {
      const signInAttempt = await signIn.create({
        identifier: email.trim(),
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(tabs)');
      } else if (signInAttempt.status === 'needs_first_factor' || signInAttempt.status === 'needs_second_factor') {
        // Handle MFA or new device verification
        const firstFactor = signInAttempt.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code');
        const secondFactor = signInAttempt.supportedSecondFactors?.find((f: any) => f.strategy === 'email_code');

        if (signInAttempt.status === 'needs_first_factor' && firstFactor) {
          await signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: (firstFactor as any).emailAddressId });
          setPendingVerification(true);
        } else if (signInAttempt.status === 'needs_second_factor' && secondFactor) {
          await signIn.prepareSecondFactor({ strategy: 'email_code' });
          setPendingVerification(true);
        } else {
          Alert.alert('Login Incomplete', 'Further steps required, but email verification is not available.');
        }
      } else {
        console.log(JSON.stringify(signInAttempt, null, 2));
        Alert.alert('Login Incomplete', 'Further steps required (e.g. MFA).');
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Login failed';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !code.trim()) {
      setErrors({ code: 'Code is required' });
      return;
    }
    setLoading(true);

    try {
      let attempt;
      if (signIn.status === 'needs_first_factor') {
        attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      } else if (signIn.status === 'needs_second_factor') {
        attempt = await signIn.attemptSecondFactor({ strategy: 'email_code', code });
      } else {
        throw new Error('Invalid sign-in state');
      }

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.log(JSON.stringify(attempt, null, 2));
        Alert.alert('Verification Incomplete', 'Further steps required.');
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {pendingVerification ? 'Verify it\'s you' : 'Welcome back'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {pendingVerification 
              ? `We sent a verification code to ${email}` 
              : 'Sign in to access your saved trips'}
          </Text>

          <View style={styles.form}>
            {!pendingVerification ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>EMAIL</Text>
                  <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: errors.email ? Colors.error : 'transparent' }]}>
                    <Ionicons name="mail-outline" size={20} color={theme.textSecondary} />
                    <TextInput style={[styles.input, { color: theme.text }]} placeholder="your@email.com" placeholderTextColor={theme.textSecondary} value={email} onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  {errors.email && <Text style={styles.err}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>PASSWORD</Text>
                  <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: errors.password ? Colors.error : 'transparent' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />
                    <TextInput style={[styles.input, { color: theme.text }]} placeholder="Enter password" placeholderTextColor={theme.textSecondary} value={password} onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }} secureTextEntry={!showPw} />
                    <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                      <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.err}>{errors.password}</Text>}
                </View>

                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>VERIFICATION CODE</Text>
                  <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: errors.code ? Colors.error : 'transparent' }]}>
                    <Ionicons name="key-outline" size={20} color={theme.textSecondary} />
                    <TextInput 
                      style={[styles.input, { color: theme.text, letterSpacing: 2 }]} 
                      placeholder="Enter code" 
                      placeholderTextColor={theme.textSecondary} 
                      value={code} 
                      onChangeText={(t) => { setCode(t); setErrors((p) => ({ ...p, code: undefined })); }} 
                      keyboardType="number-pad" 
                      maxLength={6}
                    />
                  </View>
                  {errors.code && <Text style={styles.err}>{errors.code}</Text>}
                </View>

                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={onPressVerify} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Login</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} onPress={() => setPendingVerification(false)}>
                  <Text style={{ color: theme.textSecondary, fontSize: FontSizes.sm }}>Back to login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {!pendingVerification && (
            <View style={styles.footer}>
              <Text style={{ color: theme.textSecondary, fontSize: FontSizes.base }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/signup')}><Text style={styles.link}>Sign Up</Text></TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  back: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', marginBottom: 20 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, marginBottom: 8 },
  subtitle: { fontSize: FontSizes.base, marginBottom: 40 },
  form: { gap: 20 },
  inputGroup: { gap: 6 },
  label: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold, letterSpacing: 1, marginLeft: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 16 : 4, gap: 12, borderWidth: 1.5 },
  input: { flex: 1, fontSize: FontSizes.base },
  err: { fontSize: FontSizes.xs, color: Colors.error, marginLeft: 4 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 17, borderRadius: Radius.lg, alignItems: 'center', marginTop: 10 },
  btnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  link: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.accent },
});
