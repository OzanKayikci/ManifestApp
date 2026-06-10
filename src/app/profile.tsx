import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRepository } from '@/repositories/UserRepository';
import { supabase } from '@/config/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// ─── Avatar upload to Supabase Storage ────────────────────────────────────────
async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  try {
    const fileExt = 'jpg';
    const filePath = `${userId}/avatar.${fileExt}`;

    let fileBody: any;

    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      fileBody = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      fileBody = decode(base64);
    }

    const { error } = await supabase.storage
      .from('avatar-photos')
      .upload(filePath, fileBody, {
        contentType: 'image/jpeg',
        upsert: true, // overwrite existing avatar
      });

    if (error) {
      console.error('Avatar upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatar-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    console.error('Avatar upload failed:', err);
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile, isMock } = useAuth();

  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;
  const currentXPInLevel = (user?.points || 0) % xpPerLevel;
  const progressPercent = Math.min(
    Math.max(Math.round((currentXPInLevel / xpPerLevel) * 100), 0),
    100
  );
  const xpToNextLevel = xpPerLevel - currentXPInLevel;

  // username edit state
  const [username, setUsername] = useState(user?.username || '');

  // avatar state: localUri = picked but not saved; remoteUri = saved on Supabase
  const remoteAvatar = (user as any)?.avatar_url as string | undefined;
  const fallbackAvatar = UserRepository.getUserAvatar(user?.username || '');
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const displayAvatar = localAvatarUri || remoteAvatar || fallbackAvatar;

  // save states
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;

  const animPress = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  const animRelease = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  // ── Pick photo from gallery ──────────────────────────────────────────────────
  const handlePickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'İzin Gerekli',
          'Galeri fotoğraflarına erişmek için izin vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],   // square crop for avatar
        quality: 0.85,
      });

      if (!result.canceled && result.assets.length > 0) {
        setLocalAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Gallery pick error:', err);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir sorun oluştu.');
    }
  };

  // ── Save changes (avatar + username) ──────────────────────────────────────
  const handleSave = async () => {
    if (!user?.id || !username.trim()) return;
    setSaving(true);

    try {
      let avatarUrl: string | undefined = remoteAvatar;

      // 1. Upload avatar if user picked a new one
      if (localAvatarUri) {
        setUploading(true);
        if (!isMock) {
          const url = await uploadAvatar(user.id, localAvatarUri);
          if (!url) {
            Alert.alert('Hata', 'Profil fotoğrafı yüklenirken bir sorun oluştu.');
            setUploading(false);
            setSaving(false);
            return;
          }
          avatarUrl = url;
        } else {
          // In mock mode just keep the local URI as the display avatar
          avatarUrl = localAvatarUri;
        }
        setUploading(false);
      }

      // 2. Update users table
      if (!isMock) {
        const updates: Record<string, any> = { username: username.trim() };
        if (avatarUrl) updates.avatar_url = avatarUrl;

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (error) {
          Alert.alert('Hata', 'Profil güncellenirken bir sorun oluştu.');
          setSaving(false);
          return;
        }
        await refreshProfile();
      }

      // Clear local preview (the persisted one will come from refreshProfile)
      setLocalAvatarUri(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      Alert.alert('Hata', 'Beklenmedik bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const team = UserRepository.getUserTeam(user?.username || '');
  const isBusy = saving || uploading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Section ── */}
        <View style={styles.avatarSection}>
          <Pressable
            style={styles.avatarWrapper}
            onPress={handlePickAvatar}
            disabled={isBusy}
          >
            {/* Photo ring to indicate it's tappable */}
            <View style={[
              styles.avatarRing,
              localAvatarUri ? styles.avatarRingChanged : null,
            ]}>
              {uploading ? (
                <View style={styles.avatarUploadingOverlay}>
                  <ActivityIndicator color="#fff" size="large" />
                </View>
              ) : null}
              <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
            </View>

            {/* Edit badge */}
            <LinearGradient
              colors={localAvatarUri ? ['#4caf50', '#66bb6a'] : ['#4648d4', '#6b38d4']}
              style={styles.avatarEditBadge}
            >
              <Text style={styles.avatarEditIcon}>
                {localAvatarUri ? '✓' : '📷'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.avatarHint}>
            {localAvatarUri ? 'Seçildi – kaydetmeyi unutma!' : 'Fotoğrafa dokun ve değiştir'}
          </Text>
          <Text style={styles.levelTitle}>Seviye {level} Kahraman</Text>
          <Text style={styles.teamTag}>{team} Departmanı</Text>
        </View>

        {/* ── Stats Bento ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardCenter]}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statLabel}>TOPLAM XP</Text>
            <Text style={styles.statValue}>{(user?.points || 0).toLocaleString()}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={styles.statIcon}>🏅</Text>
            <Text style={styles.statLabel}>SEVİYE</Text>
            <Text style={styles.statValue}>{level}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCenter]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statLabel}>ÇARPAN</Text>
            <Text style={styles.statValue}>×{(user?.current_multiplier || 1.0).toFixed(1)}</Text>
          </View>
        </View>

        {/* ── Form Fields ── */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Profil Bilgileri</Text>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Kullanıcı Adı</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputIconText}>👤</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Kullanıcı adını gir"
                placeholderTextColor="#767586"
                returnKeyType="done"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>E-posta (Salt Okunur)</Text>
            <View style={[styles.inputContainer, styles.inputDisabled]}>
              <Text style={styles.inputIconText}>🔒</Text>
              <TextInput
                style={[styles.input, styles.inputTextDisabled]}
                value={user?.id ? 'kullanici@officequest.app' : '—'}
                editable={false}
                placeholderTextColor="#767586"
              />
            </View>
          </View>
        </View>

        {/* ── Journey Progress Card ── */}
        <LinearGradient
          colors={['#6063ee', '#8455ef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.journeyCard}
        >
          <Text style={styles.journeyDecor}>🏆</Text>
          <Text style={styles.journeyTitle}>Yolculuk İlerlemesi</Text>
          <Text style={styles.journeyDesc}>
            Seviye {level + 1}'e ulaşmak için{' '}
            <Text style={{ fontWeight: '700' }}>{xpToNextLevel} XP</Text> daha kazanman gerekiyor.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Seviye {level}</Text>
            <Text style={styles.progressLabel}>%{progressPercent} Tamamlandı</Text>
            <Text style={styles.progressLabel}>Seviye {level + 1}</Text>
          </View>
        </LinearGradient>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Sticky Save Button ── */}
      <View style={styles.stickyBar}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            style={[styles.saveBtn, isBusy && styles.saveBtnDisabled]}
            onPress={handleSave}
            onPressIn={animPress}
            onPressOut={animRelease}
            disabled={isBusy}
          >
            <LinearGradient
              colors={saved ? ['#4caf50', '#66bb6a'] : ['#4648d4', '#6063ee']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              {isBusy ? (
                <View style={styles.saveBtnRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={[styles.saveBtnText, { marginLeft: 10 }]}>
                    {uploading ? 'Fotoğraf yükleniyor...' : 'Kaydediliyor...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.saveBtnText}>
                  {saved ? '✓  Değişiklikler Kaydedildi!' : '💾  Değişiklikleri Kaydet'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(198,196,215,0.3)',
    backgroundColor: 'rgba(252,248,255,0.9)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#efecf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#4648d4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4648d4',
    letterSpacing: -0.3,
  },
  headerSpacer: { width: 40 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // ── Avatar ──
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarRing: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 3,
    borderColor: '#4648d4',
    padding: 2,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  avatarRingChanged: {
    borderColor: '#4caf50',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(70,72,212,0.5)',
    borderRadius: 60,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditIcon: {
    fontSize: 16,
  },
  avatarHint: {
    fontSize: 12,
    color: '#767586',
    fontWeight: '500',
    marginBottom: 6,
  },
  levelTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#464554',
    marginBottom: 4,
  },
  teamTag: {
    fontSize: 12,
    fontWeight: '500',
    color: '#767586',
    backgroundColor: '#efecf8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f5f2fe',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e4e1ed',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardCenter: { backgroundColor: '#f5f2fe' },
  statCardHighlight: {
    backgroundColor: '#efecf8',
    borderColor: 'rgba(96,99,238,0.2)',
    borderWidth: 1,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#767586',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1b23',
  },

  // ── Form ──
  formSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767586',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  fieldWrapper: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#464554',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c7c4d7',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  inputDisabled: {
    backgroundColor: '#f5f2fe',
    opacity: 0.7,
  },
  inputIconText: { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1b1b23',
    fontWeight: '400',
  },
  inputTextDisabled: { color: '#767586' },

  // ── Journey Card ──
  journeyCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  journeyDecor: {
    position: 'absolute',
    right: 16,
    top: 12,
    fontSize: 80,
    opacity: 0.1,
  },
  journeyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  journeyDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Sticky Save ──
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 12,
    backgroundColor: 'rgba(252,248,255,0.92)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(198,196,215,0.2)',
  },
  saveBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.75 },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
