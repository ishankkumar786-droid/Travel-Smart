import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, getThemeColors } from '@/constants/colors';
import { FontSizes, FontWeights, Spacing, Radius } from '@/constants/typography';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();
  const isDark = useColorScheme() === 'dark';
  const theme = getThemeColors(isDark);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Min 8 characters';
    if (password !== confirmPw) e.confirmPw = 'Passwords don\'t match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSignUpPress = async () => {
    if (!isLoaded || !validate()) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });

      // Send verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Signup failed';
      Alert.alert('Signup Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(tabs)');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed';
      Alert.alert('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const inputBg = isDark ? Colors.darkCardElevated : Colors.gray50;

  const renderInput = (
    icon: string, placeholder: string, value: string,
    onChange: (t: string) => void, errorKey: string,
    options?: { secure?: boolean; keyboard?: any }
  ) => (
    <View style={styles.inputGroup}>
      <View style={[styles.inputWrap, { backgroundColor: inputBg, borderColor: errors[errorKey] ? Colors.error : 'transparent' }]}>
        <Ionicons name={icon as any} size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={(t) => { onChange(t); setErrors((p) => ({ ...p, [errorKey]: '' })); }}
          secureTextEntry={options?.secure && !showPw}
          keyboardType={options?.keyboard || 'default'}
          autoCapitalize={options?.keyboard === 'email-address' ? 'none' : 'sentences'}
        />
        {options?.secure && (
          <TouchableOpacity onPress={() => setShowPw(!showPw)}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {errors[errorKey] ? <Text style={styles.err}>{errors[errorKey]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            {pendingVerification ? 'Verify Email' : 'Create Account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {pendingVerification 
              ? `We've sent a code to ${email}` 
              : 'Join us to save trips & get personalized recommendations'}
          </Text>

          <View style={styles.form}>
            {!pendingVerification ? (
              <>
                {renderInput('person-outline', 'Full Name', name, setName, 'name')}
                {renderInput('mail-outline', 'Email address', email, setEmail, 'email', { keyboard: 'email-address' })}
                {renderInput('lock-closed-outline', 'Password (min 8 chars)', password, setPassword, 'password', { secure: true })}
                {renderInput('shield-checkmark-outline', 'Confirm password', confirmPw, setConfirmPw, 'confirmPw', { secure: true })}

                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={onSignUpPress} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {renderInput('key-outline', 'Enter verification code', code, setCode, 'code', { keyboard: 'number-pad' })}
                
                <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={onPressVerify} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Complete</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={{ alignSelf: 'center', marginTop: 10 }} onPress={() => setPendingVerification(false)}>
                  <Text style={{ color: theme.textSecondary }}>Change Email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={{ color: theme.textSecondary, fontSize: FontSizes.base }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}><Text style={styles.link}>Sign In</Text></TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  back: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', marginBottom: 10 },
  content: { flex: 1, justifyContent: 'center' },
  title: { fontSize: FontSizes['3xl'], fontWeight: FontWeights.bold, marginBottom: 8 },
  subtitle: { fontSize: FontSizes.base, marginBottom: 32, lineHeight: 22 },
  form: { gap: 16 },
  inputGroup: { gap: 4 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 15 : 4, gap: 12, borderWidth: 1.5 },
  input: { flex: 1, fontSize: FontSizes.base },
  err: { fontSize: FontSizes.xs, color: Colors.error, marginLeft: 4 },
  btn: { backgroundColor: Colors.accent, paddingVertical: 17, borderRadius: Radius.lg, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  link: { fontSize: FontSizes.base, fontWeight: FontWeights.semibold, color: Colors.accent },
});
