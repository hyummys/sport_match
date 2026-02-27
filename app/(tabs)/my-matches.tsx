import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '../../lib/constants';
import { useRooms } from '../../hooks/useRooms';
import { useAuthStore } from '../../stores/authStore';
import { RoomWithDetails, RoomStatus } from '../../lib/types';

type Tab = 'hosted' | 'participating';

export default function MyMatchesScreen() {
  const router = useRouter();
  const { getMyRooms, updateRoomStatus, deleteRoom } = useRooms();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<Tab>('hosted');
  const [hostedRooms, setHostedRooms] = useState<RoomWithDetails[]>([]);
  const [participatingRooms, setParticipatingRooms] = useState<RoomWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const result = await getMyRooms(user.id);
    setHostedRooms(result.hostedRooms);
    setParticipatingRooms(result.participatingRooms);
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadData();
      setIsLoading(false);
    };
    init();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleStatusChange = (roomId: string, status: RoomStatus, label: string) => {
    Alert.alert(
      '상태 변경',
      `이 방을 "${label}" 상태로 변경하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          style: status === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            const { error } = await updateRoomStatus(roomId, status);
            if (error) {
              Alert.alert('오류', '상태 변경에 실패했습니다.');
            } else {
              await loadData();
            }
          },
        },
      ],
    );
  };

  const handleDeleteRoom = (roomId: string) => {
    Alert.alert('방 삭제', '이 방을 완전히 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteRoom(roomId);
          if (error) {
            Alert.alert('오류', '삭제에 실패했습니다.');
          } else {
            await loadData();
          }
        },
      },
    ]);
  };

  const handleRoomPress = (room: RoomWithDetails) => {
    router.push(`/(tabs)/home/${room.sport_id}/${room.id}`);
  };

  const currentData = activeTab === 'hosted' ? hostedRooms : participatingRooms;

  const renderRoomCard = ({ item }: { item: RoomWithDetails }) => {
    const statusColor = ROOM_STATUS_COLORS[item.status];
    const statusLabel = ROOM_STATUS_LABELS[item.status];
    const isHost = activeTab === 'hosted';
    const isRecruiting = item.status === 'recruiting';

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => handleRoomPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.roomHeader}>
          <View style={styles.roomHeaderLeft}>
            <Text style={styles.roomSportIcon}>{item.sports?.icon}</Text>
            <Text style={styles.roomSportName}>{item.sports?.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.roomTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.roomInfo}>
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
            <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
            <Text style={styles.roomInfoText} numberOfLines={1}>
              {item.location_name}
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

        {isHost && isRecruiting && (
          <View style={styles.hostActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.closeBtn]}
              onPress={() => handleStatusChange(item.id, 'closed', '마감')}
            >
              <Feather name="lock" size={14} color={COLORS.warning} />
              <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>마감</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleStatusChange(item.id, 'cancelled', '취소')}
            >
              <Feather name="x-circle" size={14} color={COLORS.error} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>취소</Text>
            </TouchableOpacity>
          </View>
        )}

        {isHost && item.status === 'cancelled' && (
          <View style={styles.hostActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDeleteRoom(item.id)}
            >
              <Feather name="trash-2" size={14} color={COLORS.error} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 매칭</Text>
        <Text style={styles.headerSubtitle}>참여 중인 방과 완료된 매칭을 확인하세요</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hosted' && styles.tabActive]}
          onPress={() => setActiveTab('hosted')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'hosted' && styles.tabTextActive]}>
            내가 만든 방
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participating' && styles.tabActive]}
          onPress={() => setActiveTab('participating')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'participating' && styles.tabTextActive]}>
            참여 중인 방
          </Text>
        </TouchableOpacity>
      </View>

      {/* Room List */}
      <FlatList
        data={currentData}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomCard}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>아직 방이 없습니다</Text>
          </View>
        }
        contentContainerStyle={currentData.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: COLORS.border,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.text,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roomSportIcon: {
    fontSize: 18,
  },
  roomSportName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
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
    flex: 1,
  },
  roomDivider: {
    color: COLORS.textTertiary,
  },
  roomCost: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  hostActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  closeBtn: {
    borderColor: COLORS.warning + '40',
    backgroundColor: COLORS.warning + '0A',
  },
  cancelBtn: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '0A',
  },
  deleteBtn: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '0A',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
});
