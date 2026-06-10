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

export default function SignupScreen({ onNavigateToLogin }: { onNavigateToLogin?: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingState, setLoadingState] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setErrorMsg('Lütfen tüm alanları doldurun.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoadingState(true);

    try {
      const { error } = await signUp(email, password, username);
      if (error) {
        setErrorMsg(error.message || 'Kayıt işlemi başarısız.');
      } else {
        setSuccessMsg('Kayıt başarılı! E-posta onaylandıktan sonra giriş yapabilirsiniz.');
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    } catch (err) {
      setErrorMsg('Beklenmedik bir hata oluştu.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Office Quest</Text>
          <Text style={styles.subtitle}>Görünmez operasyonel katkılarınızı puan ve rozete dönüştürün</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Yeni Hesap Oluştur</Text>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Kullanıcı Adı / Rumuz</Text>
            <TextInput
              style={styles.input}
              placeholder="KahveSever"
              placeholderTextColor="#767586"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="isim@sirket.com"
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
            style={styles.signupButton}
            onPress={handleSignup}
            disabled={loadingState}
          >
            {loadingState ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.signupButtonText}>Kayıt Ol</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={onNavigateToLogin || (() => router.push('/login'))}>
              <Text style={styles.footerLink}>Giriş Yap</Text>
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
  successText: {
    color: '#00505f',
    backgroundColor: '#acedff',
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
  signupButton: {
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
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
