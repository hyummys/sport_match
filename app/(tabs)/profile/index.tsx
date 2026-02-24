import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useProfile } from '../../../hooks/useProfile';
import { COLORS } from '../../../lib/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { getUserStats } = useProfile();

  const [stats, setStats] = useState({ hostedCount: 0, participatedCount: 0 });

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        getUserStats(user.id).then(setStats);
      }
    }, [user?.id])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 프로필 카드 */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={40} color={COLORS.textTertiary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.nickname}>
                {user?.nickname || '사용자'}
              </Text>
              <Text style={styles.region}>
                {user?.region || '지역 미설정'}
              </Text>
              <View style={styles.mannerRow}>
                <Feather name="star" size={14} color="#F59E0B" />
                <Text style={styles.mannerText}>
                  매너점수 {user?.manner_score?.toFixed(1) ?? '0.0'}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={styles.editProfileBtnText}>프로필 수정</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 카드 */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.hostedCount}</Text>
            <Text style={styles.statLabel}>방 생성</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.participatedCount}</Text>
            <Text style={styles.statLabel}>참가</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {user?.manner_score?.toFixed(1) ?? '0.0'}
            </Text>
            <Text style={styles.statLabel}>매너점수</Text>
          </View>
        </View>

        {/* 메뉴 */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/my-matches')}
          >
            <Feather name="calendar" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>활동 내역</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={() => router.push('/profile/settings')}
          >
            <Feather name="settings" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>설정</Text>
            <Feather
              name="chevron-right"
              size={20}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  scrollContent: { padding: 20, paddingBottom: 40 },
  // Profile card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: { marginLeft: 16, flex: 1 },
  nickname: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  region: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  mannerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  mannerText: { fontSize: 13, color: COLORS.textSecondary },
  editProfileBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editProfileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Stats card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  // Menu
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text },
  // Logout
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.error },
});
