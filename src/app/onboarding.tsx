import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_DONE_KEY = 'onboarding_completed';

const steps = [
  {
    title: 'Görevleri Tamamla',
    description: 'Günlük ofis görevlerini destansı maceralara dönüştür. Gönderilen her e-posta kazanılan bir savaş!',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfGiGPsiG_BFvIdiqsGF3JQF3yN5vrjuNfwFFY_5qu_keLhuLusn2sxm0Kie5Mt6FdyEx9daqGO0BS5CFF6aAofCfCr4sWAuuf4tI9264B8qwJCs9mgDLfMsoUlqiyA5U8FmZBcSZSZk--V79JQppNyvjJWk7Qr09ukqjKVhdsSqjOOoIj34r4lQ91m5rohdPzFdBC86nftXUlzwUP7yHXdnaL1OXO2ah4ZuGNTyQD5OBgPLQjGbV6Iw7l3oJB1IifsC6mt2jMQg1Q',
    gradient: ['#4648d4', '#6b38d4'] as [string, string],
    emoji: '⚔️',
  },
  {
    title: 'Fotoğraf Yükle',
    description: 'Kahramanlıklarının kanıtını çek. İster temiz bir masa ister tamamlanan bir sunum — fotoğrafla kazan.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8ksEjHjuC6lUfW6DMvo9kJbkNBtrhZNDJtDUZXAKgysXCcxr0KahpTwBwA6G3spx8eP67signLwMd4AcqdXAW-Ht9ln5RmqhlZEX0_8UL4tkO__aPNbz40IRcD2sGmt-g4LFTys2WDc03v7XuvVju4qY33_CiAR4SCYaGNRN0smxcnBu03gfMKWfFaTuvvJ4LluiqofcDx2fKCrLipKWaQJz6XyqGDQC295ZvUdX9asfIfe9nqMBmw4riEzcXfra_5L0M5t177yNR',
    gradient: ['#6b38d4', '#4648d4'] as [string, string],
    emoji: '📸',
  },
  {
    title: 'XP Kazan',
    description: 'Kurumsal merdiveni gerçek anlamda tırman. Seviyeni yükselt ve özel ofis ayrıcalıklarının kilidini aç.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACLHavot8T9HW-64zLKGQzmvy__AL1pD-5fB5SGb55c0vUpbeaXG-Ke7AY04FJs_Ya95IaLa7LoO33doU5ZqMOx2UlPwK7KfMiv5wJhViPy4EapyTwYt2tk69mWayblFtC8k0zQ_RX0qAJ9ppQMBt7-Kb75ETm9VjZLWuoyBre1hEMLiMZlElQqlYOwHcfeWZA8PawBZoTF4rhuR5whHQCT0w3RX7PxPH0zlscWngacNCKahQkIpp6hICS67jJagHCbVeMIt5Onk7C',
    gradient: ['#705d00', '#c9a900'] as [string, string],
    emoji: '✨',
  },
  {
    title: 'Kahraman Ol',
    description: 'Global sıralamadaki yerini al. Departmanının hak ettiği efsane sen ol.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnElubegy1_NoqvmeRf8aIkMAjM9uwdzbUEVyMOcKLj7MP3Jpt4ZZwzTvYDgsV9JHdXI550VrNBVVpsbYcpq9axdiVs5PHdlnVnvn5RjxlRpxiRQyxMzvSUHVOrWUKi73Eew60OYaz6c2LCTHzJvsZKvqMxzFmlVkpKgV-pAJJMzh8MIf8TccCpCsIfL9m6iIHiKx4VYAFO6j-j5hr55x-xEeVBYtoYr4PY-WZgJO31dk1W05g-tzgDhp9XFsg2c6h9TydN3zS4xCH',
    gradient: ['#4648d4', '#8455ef'] as [string, string],
    emoji: '🏆',
  },
];

interface OnboardingProps {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: OnboardingProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = () => {
    const last = steps.length - 1;
    setCurrentStep(last);
    scrollRef.current?.scrollTo({ x: last * SCREEN_WIDTH, animated: true });
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    onDone();
  };

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const step = Math.round(x / SCREEN_WIDTH);
    if (step !== currentStep) {
      setCurrentStep(step);
    }
  };

  const pressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const isLast = currentStep === steps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Office Quest</Text>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {steps.map((step, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: step.image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.15)']}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Emoji Badge */}
              <View style={styles.emojiBadge}>
                <Text style={styles.emojiText}>{step.emoji}</Text>
              </View>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicators}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <Animated.View style={[styles.btnWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <Pressable
            style={styles.nextBtn}
            onPress={handleNext}
            onPressIn={pressIn}
            onPressOut={pressOut}
          >
            <LinearGradient
              colors={['#4648d4', '#6063ee']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? '🚀  Maceraya Başla' : 'Devam →'}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {!isLast && (
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Atla</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  logoText: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    fontSize: 22,
    fontWeight: '800',
    color: '#4648d4',
    letterSpacing: -0.5,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    // paging done by ScrollView pagingEnabled
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: SCREEN_WIDTH - 40,
    aspectRatio: 1,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  emojiBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 50,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiText: {
    fontSize: 24,
  },
  textBlock: {
    alignItems: 'center',
    maxWidth: 300,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1b23',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 15,
    fontWeight: '400',
    color: '#464554',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  indicators: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#4648d4',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#c7c4d7',
  },
  btnWrapper: {
    width: '100%',
  },
  nextBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  nextBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  skipText: {
    color: '#767586',
    fontSize: 14,
    fontWeight: '500',
  },
});
