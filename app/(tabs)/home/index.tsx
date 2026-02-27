import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { Sport, RoomWithDetails } from '../../../lib/types';
import { COLORS } from '../../../lib/constants';
import { useRooms } from '../../../hooks/useRooms';
import { useUserSports } from '../../../hooks/useUserSports';
import { useAuthStore } from '../../../stores/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { getRecruitingRooms } = useRooms();
  const { getUserSports } = useUserSports();
  const user = useAuthStore((s) => s.user);
  const [sports, setSports] = useState<Sport[]>([]);
  const [recentRooms, setRecentRooms] = useState<RoomWithDetails[]>([]);
  const [hasInterests, setHasInterests] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 탭 포커스 시마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setIsLoading(true);

    // 관심 종목 조회 (종목 상세 포함)
    let sportIds: string[] = [];
    if (user) {
      const { data: userSportsData } = await getUserSports(user.id);
      if (userSportsData && userSportsData.length > 0) {
        setSports(userSportsData.map((us) => us.sports));
        sportIds = userSportsData.map((us) => us.sport_id);
      }
    }

    // 관심 종목 미등록 또는 비로그인 → 전체 종목 fallback
    if (sportIds.length === 0) {
      const { data: sportsData } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (sportsData) setSports(sportsData);
    }

    setHasInterests(sportIds.length > 0);

    let query = supabase
      .from('rooms')
      .select('*, sports(*), users!host_id(*)')
      .eq('status', 'recruiting')
      .gte('play_date', new Date().toISOString())
      .order('view_count', { ascending: false })
      .limit(5);

    if (sportIds.length > 0) {
      query = query.in('sport_id', sportIds);
    }

    const { data: roomsData } = await query;
    let filtered = (roomsData as RoomWithDetails[]) || [];

    // 지역 필터 (클라이언트 사이드)
    if (sportIds.length > 0 && user?.region) {
      filtered = filtered.filter(
        (room) => room.location_address?.includes(user.region!) ?? true
      );
    }

    setRecentRooms(filtered);
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSportPress = (sport: Sport) => {
    router.push(`/(tabs)/home/${sport.id}`);
  };

  const renderRoomItem = ({ item }: { item: RoomWithDetails }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/(tabs)/home/${item.sport_id}/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomSportIcon}>{item.sports?.icon}</Text>
        <Text style={styles.roomTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomInfoRow}>
          <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
          <Text style={styles.roomInfoText}>{item.location_name}</Text>
        </View>
        <View style={styles.roomInfoRow}>
          <Feather name="clock" size={14} color={COLORS.textSecondary} />
          <Text style={styles.roomInfoText}>
            {new Date(item.play_date).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
              weekday: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.roomInfoRow}>
          <Feather name="users" size={14} color={COLORS.textSecondary} />
          <Text style={styles.roomInfoText}>
            {item.current_participants}/{item.max_participants}명
          </Text>
          {item.cost_per_person > 0 && (
            <>
              <Text style={styles.roomDivider}>·</Text>
              <Text style={styles.roomCost}>
                {item.cost_per_person.toLocaleString()}원
              </Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={recentRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        ListHeaderComponent={
          <>
            {/* 헤더 */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>SportMatch</Text>
                <Text style={styles.headerSubtitle}>
                  함께 운동할 사람을 찾아보세요
                </Text>
              </View>
              <TouchableOpacity style={styles.notificationBtn}>
                <Feather name="bell" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* 종목 카테고리 그리드 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>종목 선택</Text>
            </View>
            <View style={styles.sportGrid}>
              {(sports || []).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.sportItem}
                  onPress={() => handleSportPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sportIcon}>
                    <Text style={styles.sportEmoji}>{item.icon}</Text>
                  </View>
                  <Text style={styles.sportName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 모집 중인 방 섹션 */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {hasInterests ? '내 관심 매칭' : '추천 매칭'}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>
              현재 모집 중인 방이 없습니다
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notificationBtn: {
    padding: 8,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  sportItem: {
    width: '20%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sportIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sportEmoji: {
    fontSize: 28,
  },
  sportName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomSportIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  roomInfo: {
    gap: 6,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomInfoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  roomDivider: {
    color: COLORS.textTertiary,
  },
  roomCost: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
});
