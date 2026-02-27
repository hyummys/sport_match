import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../../lib/supabase';
import { Sport, RoomWithDetails } from '../../../../lib/types';
import { COLORS, formatSkillRange } from '../../../../lib/constants';
import { formatRoomCardHeader } from '../../../../lib/format';
import { useRooms } from '../../../../hooks/useRooms';

export default function SportRoomsScreen() {
  const { sport: sportId } = useLocalSearchParams<{ sport: string }>();
  const router = useRouter();
  const { getRoomsBySport, isLoading } = useRooms();
  const [sport, setSport] = useState<Sport | null>(null);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);

  useEffect(() => {
    if (!sportId) return;
    loadSport();
    loadRooms();
  }, [sportId]);

  const loadSport = async () => {
    if (!sportId) return;
    const { data } = await supabase
      .from('sports')
      .select('*')
      .eq('id', sportId)
      .single();
    if (data) setSport(data);
  };

  const loadRooms = async () => {
    if (!sportId) return;
    const { data } = await getRoomsBySport(sportId);
    if (data) setRooms(data);
  };

  const renderRoomItem = ({ item }: { item: RoomWithDetails }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/home/${sportId}/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.roomCardHeader}>
        <Text style={styles.roomTitle} numberOfLines={1}>
          {formatRoomCardHeader(item)}
        </Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>모집중</Text>
        </View>
      </View>

      <View style={styles.roomDetails}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>{item.location_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="users" size={14} color={COLORS.textSecondary} />
          <Text style={styles.detailText}>
            {item.current_participants}/{item.max_participants}명
          </Text>
        </View>
      </View>

      <View style={styles.roomFooter}>
        <View style={styles.skillBadge}>
          <Text style={styles.skillText}>
            🏅 {formatSkillRange(item.min_skill_level, item.max_skill_level)}
          </Text>
        </View>
        {item.cost_per_person > 0 && (
          <Text style={styles.costText}>
            💰 {item.cost_per_person.toLocaleString()}원
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {sport?.icon} {sport?.name || '로딩중...'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 방 목록 */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoomItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="inbox" size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>
                아직 모집 중인 방이 없습니다
              </Text>
              <Text style={styles.emptySubtext}>
                첫 번째 방을 만들어 보세요!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  roomCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  roomDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  skillBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
});
