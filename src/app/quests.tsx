import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Modal, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Quest, QuestRepository } from '@/repositories/QuestRepository';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { triggerLocalNotification } from '@/config/notifications';

// Predefined mock photos that user can select as "photo proof"
const MOCK_PROOF_PHOTOS = [
  { id: 'p1', label: '☕ Kahve Makinesi Kanıtı', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500' },
  { id: 'p2', label: '📦 Düzenli Mutfak Dolabı', url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=500' },
  { id: 'p3', label: '🧹 Boş Çöp Kutusu', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=500' },
  { id: 'p4', label: '✨ Düzenli Çalışma Masası', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500' },
];

export default function QuestsScreen() {
  const { user, isMock, refreshProfile } = useAuth();
  const router = useRouter();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Success Feedback Overlay
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [multiplierUsed, setMultiplierUsed] = useState(1);
  const [newXPTotal, setNewXPTotal] = useState(0);

  // Dynamic Level calculation
  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const allQuests = await QuestRepository.getAllQuests();
      setQuests(allQuests);
    } catch (err) {
      console.error('Error fetching quests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestSelect = (quest: Quest) => {
    setSelectedQuest(quest);
    setSelectedPhoto(null); // Reset photo
  };

  const handleCompleteQuest = async () => {
    if (!selectedQuest || !user) return;
    setCompleting(true);

    try {
      // Use selected mock photo or fall back to a default
      const finalPhoto = selectedPhoto || MOCK_PROOF_PHOTOS[0].url;
      
      const result = await QuestRepository.completeQuest(
        user.id,
        selectedQuest.name,
        selectedQuest.category,
        selectedQuest.points,
        finalPhoto
      );

      if (result && result.success) {
        setEarnedXP(result.pointsEarned);
        setMultiplierUsed(result.multiplierUsed);
        setNewXPTotal(result.newPointsTotal);
        setShowSuccess(true);
        
        // Save current name for notifications before resetting selectedQuest
        const completedQuestName = selectedQuest.name;

        setSelectedQuest(null);

        // Instantly refresh profile in the Zustand auth store
        await refreshProfile();

        // Trigger Local Notification for success
        triggerLocalNotification(
          'Görev Tamamlandı! 🎉',
          `"${completedQuestName}" başarıyla tamamlandı. +${result.pointsEarned} XP kazandın!`
        );

        // Check and trigger mock badge unlock if coffee quest
        if (completedQuestName.toLowerCase().includes('kahve')) {
          setTimeout(() => {
            triggerLocalNotification(
              'Rozet Açıldı! ☕🎉',
              'Tebrikler! "Çaylak Kahveci" rozetinin kilidi açıldı!'
            );
          }, 3000);
        }

        // Simulate competitive/social push notification after 10 seconds
        setTimeout(() => {
          triggerLocalNotification(
            'Sosyal Akış Güncellemesi ⚡️',
            'Sarah "Filtre Kahve Hazırlama" görevini tamamladı. Sıralamada seni geçmek üzere!'
          );
        }, 10000);
      }
    } catch (err) {
      console.error('Error completing quest:', err);
    } finally {
      setCompleting(false);
    }
  };

  // Filtered Quests
  const filteredQuests = selectedCategory === 'Tümü'
    ? quests
    : quests.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());

  // Category tags mapping
  const categoryFilters = ['Tümü', 'Mutfak', 'Stok', 'Gün Başı', 'Gün Sonu'];

  // Categories helper color mapping
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Mutfak':
        return { bg: '#ffe16d', color: '#221b00', emoji: '🍳' };
      case 'Stok':
        return { bg: '#e9ddff', color: '#23005c', emoji: '📦' };
      case 'Gün Başı':
        return { bg: '#e1e0ff', color: '#07006c', emoji: '☀️' };
      case 'Gün Sonu':
        return { bg: '#ffdad6', color: '#ba1a1a', emoji: '🌙' };
      default:
        return { bg: '#efecf8', color: '#767586', emoji: '🎯' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Görevler</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LVL {level}</Text>
          </View>
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsEmoji}>⭐️</Text>
          <Text style={styles.pointsText}>{user?.points || 0} XP</Text>
        </View>
      </View>

      {/* Category Horizontal Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categoryFilters.map((cat, idx) => {
            const isActive = selectedCategory === cat;
            return (
              <Pressable
                key={idx}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Quests List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4648d4" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          {/* Active Hero Quest Card (Featured) */}
          {selectedCategory === 'Tümü' && (
            <Pressable 
              style={styles.featuredCard}
              onPress={() => {
                const heroQuest = quests.find(q => q.name.includes('Kahve')) || quests[0];
                if (heroQuest) handleQuestSelect(heroQuest);
              }}
            >
              <Image 
                style={styles.featuredImage}
                source={{ uri: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' }}
              />
              <LinearGradient
                colors={['transparent', 'rgba(70, 72, 212, 0.85)', 'rgba(70, 72, 212, 0.98)']}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredCardBadgeRow}>
                  <View style={styles.featuredTag}>
                    <Text style={styles.featuredTagText}>ÖNE ÇIKAN GÖREV</Text>
                  </View>
                  <View style={styles.featuredXPBadge}>
                    <Text style={styles.featuredXPText}>+50 XP</Text>
                  </View>
                </View>
                <Text style={styles.featuredTitle}>Kahve Bilgesi</Text>
                <Text style={styles.featuredMeta}>🍳 Mutfak • 10 Dakika</Text>
              </LinearGradient>
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>Mevcut Görevler</Text>

          {filteredQuests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Bu kategoride aktif görev bulunamadı.</Text>
            </View>
          ) : (
            filteredQuests.map((quest) => {
              const catStyle = getCategoryStyles(quest.category);
              return (
                <Pressable
                  key={quest.id}
                  style={({ pressed }) => [styles.questCard, pressed && styles.questCardPressed]}
                  onPress={() => handleQuestSelect(quest)}
                >
                  <View style={[styles.questIconContainer, { backgroundColor: catStyle.bg + '25' }]}>
                    <Text style={styles.questEmoji}>{catStyle.emoji}</Text>
                  </View>
                  <View style={styles.questDetails}>
                    <View style={styles.questMetaRow}>
                      <View style={[styles.categoryTag, { backgroundColor: catStyle.bg }]}>
                        <Text style={[styles.categoryTagText, { color: catStyle.color }]}>{quest.category}</Text>
                      </View>
                      <Text style={styles.questDuration}>⚡️ Hızlı</Text>
                    </View>
                    <Text style={styles.questName}>{quest.name}</Text>
                  </View>
                  <View style={styles.questXPContainer}>
                    <Text style={styles.questPoints}>+{quest.points} XP</Text>
                    <Text style={styles.questArrow}>➡️</Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Quest Detail / Capture Bottom Modal */}
      <Modal
        visible={selectedQuest !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedQuest(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismissArea} onPress={() => setSelectedQuest(null)} />
          <View style={styles.modalContent}>
            {/* Modal Drag Indicator */}
            <View style={styles.dragIndicator} />

            {selectedQuest && (
              <>
                {/* Image & Header */}
                <View style={styles.modalHeaderImageContainer}>
                  <Image 
                    style={styles.modalHeaderImage}
                    source={{ uri: selectedQuest.category === 'Mutfak' ? 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500' : 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=500' }}
                  />
                  <View style={styles.modalHeaderTags}>
                    <View style={[styles.categoryTag, { backgroundColor: getCategoryStyles(selectedQuest.category).bg }]}>
                      <Text style={[styles.categoryTagText, { color: getCategoryStyles(selectedQuest.category).color }]}>
                        {selectedQuest.category}
                      </Text>
                    </View>
                    {user && user.current_multiplier > 1 && (
                      <View style={styles.streakMultiplierTag}>
                        <Text style={styles.streakMultiplierText}>Çarpan x{user.current_multiplier}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Quest Title & Desc */}
                <View style={styles.modalInfoSection}>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalQuestTitle}>{selectedQuest.name}</Text>
                    <View>
                      <Text style={styles.modalXPText}>+{selectedQuest.points} XP</Text>
                      <Text style={styles.modalXPSub}>TABAN PUAN</Text>
                    </View>
                  </View>
                  <Text style={styles.modalQuestDesc}>
                    Bu görevi tamamlamak ve ofis düzenine katkıda bulunmak için görevi tamamladığınızı gösteren bir fotoğraf kanıtı yükleyin.
                  </Text>
                </View>

                {/* Photo Proof Selector */}
                <View style={styles.proofSection}>
                  <Text style={styles.proofSectionTitle}>GÖREV KANITI (MOCK FOTOĞRAF SEÇİN)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.proofPhotosRow}>
                    {MOCK_PROOF_PHOTOS.map((photo) => {
                      const isSelected = selectedPhoto === photo.url;
                      return (
                        <Pressable
                          key={photo.id}
                          style={[styles.proofCard, isSelected && styles.proofCardActive]}
                          onPress={() => setSelectedPhoto(photo.url)}
                        >
                          <Image style={styles.proofImage} source={{ uri: photo.url }} />
                          <View style={styles.proofCardFooter}>
                            <Text style={styles.proofCardLabel} numberOfLines={1}>{photo.label}</Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedTick}>
                              <Text style={styles.selectedTickText}>✓</Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <Pressable 
                    style={styles.cancelButton}
                    onPress={() => setSelectedQuest(null)}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </Pressable>
                  <Pressable 
                    style={[styles.completeButton, completing && styles.completeButtonDisabled]}
                    onPress={handleCompleteQuest}
                    disabled={completing}
                  >
                    {completing ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.completeButtonText}>Görevi Tamamla</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Success Celebration Overlay */}
      <Modal
        visible={showSuccess}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSuccess(false)}
      >
        <View style={styles.successOverlayContainer}>
          <View style={styles.successCard}>
            <View style={styles.successEmojiContainer}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
            <Text style={styles.successTitle}>Görev Tamamlandı!</Text>
            <Text style={styles.successDescription}>
              Harika iş! Ofisin kahramanı oldun ve işi başarıyla bitirdin.
            </Text>

            <View style={styles.successStatsRow}>
              <View style={styles.successStatCard}>
                <Text style={styles.successStatLabel}>KAZANILAN</Text>
                <Text style={styles.successStatVal}>+{earnedXP} XP</Text>
                {multiplierUsed > 1 && (
                  <Text style={styles.successStatSub}>x{multiplierUsed} Çarpan Dahil</Text>
                )}
              </View>
              <View style={styles.successStatCard}>
                <Text style={styles.successStatLabel}>YENİ PUANIN</Text>
                <Text style={styles.successStatVal}>{newXPTotal} XP</Text>
              </View>
            </View>

            <Pressable 
              style={styles.successCloseButton}
              onPress={() => setShowSuccess(false)}
            >
              <Text style={styles.successCloseButtonText}>Harika, Devam Et!</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fcf8ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4648d4',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
  },
  levelBadge: {
    backgroundColor: '#ffe16d',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#221b00',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(70, 72, 212, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(70, 72, 212, 0.15)',
  },
  pointsEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4648d4',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: '#efecf8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#6b38d4',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767586',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  featuredCard: {
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 24,
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  featuredCardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  featuredTag: {
    backgroundColor: '#ffe16d',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#221b00',
  },
  featuredXPBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  featuredXPText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  featuredMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b1b23',
    marginBottom: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#767586',
    fontStyle: 'italic',
  },
  questCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  questCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  questIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questEmoji: {
    fontSize: 20,
  },
  questDetails: {
    flex: 1,
  },
  questMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
  },
  categoryTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  questDuration: {
    fontSize: 9,
    color: '#767586',
    fontWeight: '600',
  },
  questName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b1b23',
  },
  questXPContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  questPoints: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6b38d4',
  },
  questArrow: {
    fontSize: 12,
    color: '#c7c4d7',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 27, 35, 0.4)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 24,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    backgroundColor: '#e4e1ed',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderImageContainer: {
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  modalHeaderImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  modalHeaderTags: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  streakMultiplierTag: {
    backgroundColor: '#eb5e28',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#eb5e28',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  streakMultiplierText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalQuestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b1b23',
    flex: 1,
    marginRight: 16,
  },
  modalXPText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4648d4',
    textAlign: 'right',
  },
  modalXPSub: {
    fontSize: 7,
    fontWeight: '800',
    color: '#767586',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  modalQuestDesc: {
    fontSize: 13,
    color: '#767586',
    lineHeight: 18,
  },
  proofSection: {
    marginBottom: 24,
  },
  proofSectionTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#767586',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  proofPhotosRow: {
    gap: 12,
    paddingBottom: 4,
  },
  proofCard: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#efecf8',
    overflow: 'hidden',
    position: 'relative',
  },
  proofCardActive: {
    borderColor: '#4648d4',
  },
  proofImage: {
    width: '100%',
    height: 70,
    objectFit: 'cover',
  },
  proofCardFooter: {
    height: 26,
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: '#ffffff',
  },
  proofCardLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#1b1b23',
  },
  selectedTick: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4648d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTickText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c7c4d7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#767586',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#4648d4',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonDisabled: {
    backgroundColor: '#c7c4d7',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Success overlay
  successOverlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(27, 27, 35, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  successEmojiContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffe16d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 36,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b1b23',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 12,
    color: '#767586',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  successStatsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  successStatCard: {
    flex: 1,
    backgroundColor: '#efecf8',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successStatLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#767586',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  successStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4648d4',
  },
  successStatSub: {
    fontSize: 8,
    fontWeight: '700',
    color: '#eb5e28',
    marginTop: 2,
  },
  successCloseButton: {
    width: '100%',
    backgroundColor: '#6b38d4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
