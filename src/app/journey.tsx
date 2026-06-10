import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { UserBadge, BadgeRepository, BADGE_DEFINITIONS } from '@/repositories/BadgeRepository';
import { LinearGradient } from 'expo-linear-gradient';

interface JourneyNode {
  badgeName: string;
  displayName: string;
  icon: string;
  description: string;
  threshold: number;
  levelRequired: number;
  align: 'left' | 'center' | 'right';
}

export default function JourneyScreen() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);

  // Dynamic Level calculation
  const xpPerLevel = 200;
  const level = Math.floor((user?.points || 0) / xpPerLevel) + 1;

  // Journey nodes definition mapping to badge names
  const journeyNodes: JourneyNode[] = [
    {
      badgeName: 'Coffee Starter',
      displayName: 'Çaylak Kahveci',
      icon: '☕',
      description: 'Ofiste ilk kahveyi demle veya makineyi temizle.',
      threshold: 1,
      levelRequired: 1,
      align: 'left',
    },
    {
      badgeName: 'First Spark',
      displayName: 'İlk Kıvılcım',
      icon: '🔥',
      description: 'Gün içinde 2 görev üst üste tamamla.',
      threshold: 2,
      levelRequired: 2,
      align: 'right',
    },
    {
      badgeName: 'Supply Helper',
      displayName: 'Stok Yardımcısı',
      icon: '📦',
      description: '5 kez stok kontrolü veya takviyesi yap.',
      threshold: 5,
      levelRequired: 3,
      align: 'center',
    },
    {
      badgeName: 'Coffee Lover',
      displayName: 'Kahve Sever',
      icon: '☕☕',
      description: '10 kahve görevi tamamla.',
      threshold: 10,
      levelRequired: 5,
      align: 'left',
    },
    {
      badgeName: 'On Fire',
      displayName: 'Ofis Alevi',
      icon: '🔥🔥',
      description: 'Gün içinde 5 görev tamamla.',
      threshold: 5,
      levelRequired: 8,
      align: 'right',
    },
    {
      badgeName: 'Supply Guardian',
      displayName: 'Stok Muhafızı',
      icon: '📦📦',
      description: '25 kez stok kontrolü yap.',
      threshold: 25,
      levelRequired: 12,
      align: 'left',
    },
    {
      badgeName: 'Coffee Master',
      displayName: 'Kahve Ustası',
      icon: '☕☕☕',
      description: '50 kahve görevi tamamla.',
      threshold: 50,
      levelRequired: 15,
      align: 'right',
    },
  ];

  useEffect(() => {
    loadBadges();
  }, [user?.points]);

  const loadBadges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userBadges = await BadgeRepository.getUserBadges(user.id);
      setBadges(userBadges);
    } catch (err) {
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall progress percentage
  const badgeMap = new Map(badges.map(b => [b.badge_name, b]));
  const unlockedCount = badges.filter(b => b.is_unlocked).length;
  const progressPercent = Math.max(15, Math.round((unlockedCount / Math.max(badges.length, 1)) * 100));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Yolculuk</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>LVL {level}</Text>
          </View>
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsEmoji}>⭐️</Text>
          <Text style={styles.pointsText}>{user?.points || 0} XP</Text>
        </View>
      </View>

      {/* Progress Overview sticky-like panel */}
      <View style={styles.overviewContainer}>
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View>
              <Text style={styles.chapterLabel}>AKTİF SEKTÖR 1</Text>
              <Text style={styles.chapterTitle}>Ofis Labirentleri</Text>
            </View>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={['#4648d4', '#6b38d4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipEmoji}>🔥</Text>
              <Text style={styles.statChipText}>15 Gün Streak</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipEmoji}>🏆</Text>
              <Text style={styles.statChipText}>{unlockedCount} Rozet Açık</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Journey Scroll Map */}
      {loading && badges.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4648d4" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.mapScroll} showsVerticalScrollIndicator={false}>
          {/* Vertical roadmap items */}
          <View style={styles.nodesContainer}>
            {journeyNodes.map((node, index) => {
              const userBadge = badgeMap.get(node.badgeName);
              const isUnlocked = userBadge?.is_unlocked || false;
              const currentProgress = userBadge?.progress || 0;
              const isLevelLocked = level < node.levelRequired;
              
              // Decide state: unlocked, active (next lock/current progress), or future locked
              const isCurrent = !isUnlocked && !isLevelLocked;

              // Position styling based on align
              let alignStyle = styles.nodeAlignLeft;
              if (node.align === 'right') alignStyle = styles.nodeAlignRight;
              if (node.align === 'center') alignStyle = styles.nodeAlignCenter;

              return (
                <View key={node.badgeName} style={[styles.nodeRow, alignStyle]}>
                  {/* Connect Line (Visual only representation) */}
                  {index < journeyNodes.length - 1 && (
                    <View style={styles.connectorLine} />
                  )}

                  <Pressable 
                    style={({ pressed }) => [
                      styles.nodeButtonCircle,
                      isUnlocked && styles.nodeButtonUnlocked,
                      isCurrent && styles.nodeButtonCurrent,
                      isLevelLocked && styles.nodeButtonLocked,
                      pressed && styles.nodeButtonPressed
                    ]}
                    onPress={() => setSelectedNode(node)}
                  >
                    {isLevelLocked ? (
                      <Text style={styles.nodeLockIcon}>🔒</Text>
                    ) : isUnlocked ? (
                      <Text style={styles.nodeCheckIcon}>✓</Text>
                    ) : (
                      <Text style={styles.nodeEmoji}>{node.icon}</Text>
                    )}
                  </Pressable>

                  <View style={styles.nodeLabelCard}>
                    <Text style={[
                      styles.nodeLabelTitle, 
                      isLevelLocked && styles.nodeTextLocked,
                      isUnlocked && styles.nodeTextUnlocked
                    ]}>
                      {node.displayName}
                    </Text>
                    <Text style={styles.nodeLabelSub}>
                      {isLevelLocked 
                        ? `Lvl ${node.levelRequired} Kilidi` 
                        : isUnlocked 
                        ? 'Tamamlandı' 
                        : `${currentProgress} / ${node.threshold} İlerleme`}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Boss milestone node at the end */}
            <View style={styles.bossNodeContainer}>
              <View style={styles.bossNodeBox}>
                <Text style={styles.bossIcon}>🏆</Text>
                <Text style={styles.bossTitle}>CEO Karşılaşması</Text>
                <Text style={styles.bossSub}>Sektör 1 Final Boss Mücadelesi</Text>
                <View style={styles.bossLockTag}>
                  <Text style={styles.bossLockTagText}>SEVİYE 20 GEREKLİ</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Node Detail Sheet (Modal) */}
      {selectedNode && (
        <View style={styles.detailCardOverlay}>
          <Pressable style={styles.overlayDismiss} onPress={() => setSelectedNode(null)} />
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailEmoji}>{selectedNode.icon}</Text>
              <View style={styles.detailTextCol}>
                <Text style={styles.detailTitle}>{selectedNode.displayName}</Text>
                <Text style={styles.detailSub}>{selectedNode.badgeName}</Text>
              </View>
              <Pressable style={styles.closeDetailButton} onPress={() => setSelectedNode(null)}>
                <Text style={styles.closeDetailText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.detailDesc}>{selectedNode.description}</Text>

            <View style={styles.detailStats}>
              <View style={styles.detailStatItem}>
                <Text style={styles.detailStatLabel}>Gereken Hedef</Text>
                <Text style={styles.detailStatVal}>{selectedNode.threshold} Görev</Text>
              </View>
              <View style={styles.detailStatItem}>
                <Text style={styles.detailStatLabel}>Senin Durumun</Text>
                <Text style={styles.detailStatVal}>
                  {badgeMap.get(selectedNode.badgeName)?.is_unlocked 
                    ? 'ROZET KAZANILDI' 
                    : `${badgeMap.get(selectedNode.badgeName)?.progress || 0} Tamamlandı`}
                </Text>
              </View>
            </View>

            <Pressable style={styles.closeButton} onPress={() => setSelectedNode(null)}>
              <Text style={styles.closeButtonText}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      )}
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
  overviewContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#4648d4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  chapterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#767586',
    letterSpacing: 0.5,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1b1b23',
    marginTop: 2,
  },
  progressPercent: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4648d4',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#efecf8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f2fe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statChipEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  statChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b38d4',
  },
  mapScroll: {
    paddingBottom: 140,
  },
  nodesContainer: {
    paddingVertical: 20,
    position: 'relative',
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginVertical: 16,
    position: 'relative',
  },
  nodeAlignLeft: {
    justifyContent: 'flex-start',
  },
  nodeAlignRight: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  nodeAlignCenter: {
    justifyContent: 'center',
  },
  connectorLine: {
    position: 'absolute',
    top: 50,
    left: '50%',
    width: 4,
    height: 70,
    backgroundColor: '#e4e1ed',
    zIndex: 0,
  },
  nodeButtonCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ffffff',
    borderWidth: 4,
    borderColor: '#e4e1ed',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  nodeButtonUnlocked: {
    backgroundColor: '#4648d4',
    borderColor: '#ffe16d',
  },
  nodeButtonCurrent: {
    backgroundColor: '#ffffff',
    borderColor: '#6b38d4',
    borderWidth: 4,
  },
  nodeButtonLocked: {
    backgroundColor: '#efecf8',
    borderColor: '#c7c4d7',
  },
  nodeButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  nodeEmoji: {
    fontSize: 22,
  },
  nodeLockIcon: {
    fontSize: 18,
  },
  nodeCheckIcon: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  nodeLabelCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginLeft: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 120,
  },
  nodeLabelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b1b23',
  },
  nodeLabelSub: {
    fontSize: 9,
    color: '#767586',
    marginTop: 2,
    fontWeight: '500',
  },
  nodeTextLocked: {
    color: '#767586',
  },
  nodeTextUnlocked: {
    color: '#4648d4',
  },
  bossNodeContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
  },
  bossNodeBox: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#efecf8',
    borderRadius: 22,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#c7c4d7',
    padding: 20,
    alignItems: 'center',
  },
  bossIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  bossTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#767586',
  },
  bossSub: {
    fontSize: 11,
    color: '#767586',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  bossLockTag: {
    backgroundColor: '#c7c4d7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bossLockTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },

  // Detail Sheet modal
  detailCardOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(27,27,35,0.4)',
    zIndex: 99,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  overlayDismiss: {
    position: 'absolute',
    inset: 0,
  },
  detailCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1b1b23',
  },
  detailSub: {
    fontSize: 10,
    color: '#767586',
    fontWeight: '500',
  },
  closeDetailButton: {
    padding: 4,
  },
  closeDetailText: {
    fontSize: 14,
    color: '#767586',
    fontWeight: 'bold',
  },
  detailDesc: {
    fontSize: 13,
    color: '#767586',
    lineHeight: 18,
    marginBottom: 16,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  detailStatItem: {
    flex: 1,
    backgroundColor: '#fcf8ff',
    borderWidth: 1,
    borderColor: '#efecf8',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#767586',
    marginBottom: 4,
  },
  detailStatVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4648d4',
    textAlign: 'center',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#4648d4',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
