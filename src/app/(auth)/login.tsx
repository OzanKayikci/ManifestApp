import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { SymbolView } from 'expo-symbols';

export default function LoginScreen({ onNavigateToSignup }: { onNavigateToSignup?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Lütfen tüm alanları doldurun.');
      return;
    }
    setErrorMsg('');
    setLoadingState(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setErrorMsg(error.message || 'Giriş yapılamadı.');
      } else {
        router.replace('/');
      }
    } catch (err) {
      setErrorMsg('Beklenmedik bir hata oluştu.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google sign in for hackathon demo
    alert('Google ile Giriş, Supabase OAuth yapılandırmasından sonra aktif olacaktır.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🏆</Text>
          </View>
          <Text style={styles.title}>Office Quest</Text>
          <Text style={styles.subtitle}>Ofis operasyonlarını oyunlaştıran sosyal feed uygulaması</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="ofis@sirket.com"
              placeholderTextColor="#767586"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#767586"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loadingState}
          >
            {loadingState ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonText}>Google ile Devam Et</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Hesabınız yok mu? </Text>
            <TouchableOpacity onPress={onNavigateToSignup || (() => router.push('/signup'))}>
              <Text style={styles.footerLink}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6063ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4648d4',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#464554',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1b1b23',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#efecf8',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1b23',
    marginBottom: 20,
  },
  errorText: {
    color: '#ba1a1a',
    backgroundColor: '#ffdad6',
    padding: 12,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#464554',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f5f2fe',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1b1b23',
    borderWidth: 1,
    borderColor: '#c7c4d7',
  },
  loginButton: {
    backgroundColor: '#4648d4',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c7c4d7',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#767586',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c7c4d7',
  },
  googleButtonText: {
    color: '#1b1b23',
    fontSize: 15,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#767586',
  },
  footerLink: {
    fontSize: 14,
    color: '#4648d4',
    fontWeight: '600',
  },
});
