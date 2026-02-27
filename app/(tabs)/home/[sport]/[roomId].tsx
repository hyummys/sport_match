import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, formatSkillRange, ROOM_STATUS_LABELS, ROOM_STATUS_COLORS } from '../../../../lib/constants';
import { RoomDetailWithParticipants, RoomStatus } from '../../../../lib/types';
import { useRooms } from '../../../../hooks/useRooms';
import { useRoomRealtime } from '../../../../hooks/useRealtime';
import { useAuthStore } from '../../../../stores/authStore';

export default function RoomDetailScreen() {
  const { sport: sportId, roomId } = useLocalSearchParams<{
    sport: string;
    roomId: string;
  }>();
  const router = useRouter();
  const { getRoomDetail, joinRoom, leaveRoom, updateRoomStatus, isLoading } = useRooms();
  const user = useAuthStore((s) => s.user);

  const [room, setRoom] = useState<RoomDetailWithParticipants | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    const { data, error: err } = await getRoomDetail(roomId);
    if (err) {
      setError('방 정보를 불러올 수 없습니다.');
    } else {
      setRoom(data);
      setError(null);
    }
  }, [roomId]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  // Real-time updates for participant changes (skip if roomId is empty)
  useRoomRealtime(roomId || '', roomId ? loadRoom : () => {});

  const isHost = user?.id === room?.host_id;
  const isParticipant = room?.room_participants.some(
    (p) => p.user_id === user?.id && p.status === 'approved'
  );
  const isRecruiting = room?.status === 'recruiting';
  const isFull = room ? room.current_participants >= room.max_participants : false;

  const handleJoin = async () => {
    if (!user || !roomId) return;
    setActionLoading(true);
    const { error: err } = await joinRoom(roomId, user.id);
    setActionLoading(false);
    if (err) {
      Alert.alert('오류', '참가 신청에 실패했습니다.');
    } else {
      loadRoom();
    }
  };

  const handleLeave = async () => {
    if (!user || !roomId) return;
    Alert.alert('참가 취소', '정말 참가를 취소하시겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '네',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          const { error: err } = await leaveRoom(roomId, user.id);
          setActionLoading(false);
          if (err) {
            Alert.alert('오류', '참가 취소에 실패했습니다.');
          } else {
            loadRoom();
          }
        },
      },
    ]);
  };

  const handleStatusChange = (newStatus: RoomStatus, label: string) => {
    if (!roomId) return;
    Alert.alert(label, `정말 ${label}하시겠습니까?`, [
      { text: '아니오', style: 'cancel' },
      {
        text: '네',
        onPress: async () => {
          setActionLoading(true);
          const { error: err } = await updateRoomStatus(roomId, newStatus);
          setActionLoading(false);
          if (err) {
            Alert.alert('오류', '상태 변경에 실패했습니다.');
          } else {
            loadRoom();
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (isLoading && !room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>방 상세</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>방 상세</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContent}>
          <Feather name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error || '방 정보를 찾을 수 없습니다.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadRoom}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = ROOM_STATUS_COLORS[room.status];
  const statusLabel = ROOM_STATUS_LABELS[room.status];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {room.sports.icon} {room.sports.name}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + Status */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{room.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Host Info */}
        <View style={styles.section}>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Feather name="user" size={20} color={COLORS.textSecondary} />
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{room.users.nickname}</Text>
              <View style={styles.mannerRow}>
                <Feather name="star" size={14} color="#F59E0B" />
                <Text style={styles.mannerScore}>
                  매너점수 {room.users.manner_score.toFixed(1)}
                </Text>
              </View>
            </View>
            {isHost && (
              <View style={styles.hostBadge}>
                <Text style={styles.hostBadgeText}>방장</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {room.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>설명</Text>
            <Text style={styles.description}>{room.description}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailItem}>
              <Feather name="clock" size={16} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>일시</Text>
                <Text style={styles.detailValue}>{formatDate(room.play_date)}</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <Feather name="map-pin" size={16} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>장소</Text>
                <Text style={styles.detailValue}>{room.location_name}</Text>
                {room.location_address && (
                  <Text style={styles.detailSubValue}>{room.location_address}</Text>
                )}
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <Feather name="dollar-sign" size={16} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>참가비</Text>
                <Text style={styles.detailValue}>
                  {room.cost_per_person > 0
                    ? `${room.cost_per_person.toLocaleString()}원`
                    : '무료'}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailItem}>
              <Feather name="bar-chart-2" size={16} color={COLORS.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>실력 수준</Text>
                <Text style={styles.detailValue}>
                  {formatSkillRange(room.min_skill_level, room.max_skill_level)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <View style={styles.participantHeader}>
            <Text style={styles.sectionTitle}>참가자</Text>
            <Text style={styles.participantCount}>
              {room.current_participants}/{room.max_participants}명
            </Text>
          </View>

          <View style={styles.participantList}>
            {room.room_participants
              .filter((p) => p.status === 'approved')
              .map((participant) => (
                <View key={participant.id} style={styles.participantItem}>
                  <View style={styles.participantAvatar}>
                    <Feather name="user" size={14} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.participantName}>
                    {participant.users.nickname}
                  </Text>
                  {participant.user_id === room.host_id && (
                    <View style={styles.hostTag}>
                      <Text style={styles.hostTagText}>방장</Text>
                    </View>
                  )}
                </View>
              ))}
          </View>
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        {actionLoading ? (
          <View style={styles.actionBtn}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : isHost ? (
          <View style={styles.hostActions}>
            {isRecruiting && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.closeBtn]}
                onPress={() => handleStatusChange('closed', '모집 마감')}
              >
                <Feather name="lock" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>모집 마감</Text>
              </TouchableOpacity>
            )}
            {(isRecruiting || room.status === 'closed') && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.cancelBtn]}
                onPress={() => handleStatusChange('cancelled', '방 취소')}
              >
                <Feather name="x-circle" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>취소</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : isParticipant ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.leaveBtn]}
            onPress={handleLeave}
          >
            <Feather name="log-out" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>참가 취소</Text>
          </TouchableOpacity>
        ) : isRecruiting && !isFull ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.joinBtn]}
            onPress={handleJoin}
          >
            <Feather name="user-plus" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>참가 신청</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionBtn, styles.disabledBtn]}>
            <Text style={styles.disabledBtnText}>
              {isFull ? '인원이 마감되었습니다' : '참가할 수 없습니다'}
            </Text>
          </View>
        )}
      </View>
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hostInfo: {
    flex: 1,
    gap: 4,
  },
  hostName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  mannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mannerScore: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  hostBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  detailSubValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantCount: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  participantList: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  hostTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  hostActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
  },
  leaveBtn: {
    backgroundColor: COLORS.error,
  },
  closeBtn: {
    backgroundColor: COLORS.warning,
  },
  cancelBtn: {
    backgroundColor: COLORS.error,
  },
  disabledBtn: {
    backgroundColor: COLORS.border,
  },
  disabledBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textTertiary,
  },
});
