import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { useProfile } from '../../../hooks/useProfile';
import { useUserSports } from '../../../hooks/useUserSports';
import { COLORS, getLevelDescription } from '../../../lib/constants';
import { REGIONS } from '../../../lib/regions';
import { supabase } from '../../../lib/supabase';
import { Sport } from '../../../lib/types';

export default function EditProfileScreen() {
  const { user } = useAuth();
  const { isLoading, updateProfile, changeAvatar } = useProfile();
  const { getUserSports, saveUserSports } = useUserSports();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [region, setRegion] = useState(user?.region || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Sports selection state
  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);
  const [selectedSports, setSelectedSports] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Load all sports
      setIsSportsLoading(true);
      const { data: sportsData } = await supabase
        .from('sports')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (sportsData) setSports(sportsData);
      setIsSportsLoading(false);

      // Load user's existing sports
      const { data: userSportsData } = await getUserSports(user.id);
      if (userSportsData) {
        const map: Record<string, number> = {};
        userSportsData.forEach((us) => {
          map[us.sport_id] = us.skill_level;
        });
        setSelectedSports(map);
      }
    };
    load();
  }, [user?.id]);

  const toggleSport = (sportId: string) => {
    setSelectedSports((prev) => {
      const next = { ...prev };
      if (next[sportId] !== undefined) {
        delete next[sportId];
      } else {
        next[sportId] = 5;
      }
      return next;
    });
  };

  const updateSkillLevel = (sportId: string, delta: number) => {
    setSelectedSports((prev) => {
      const current = prev[sportId] ?? 5;
      const next = Math.max(0, Math.min(10, current + delta));
      return { ...prev, [sportId]: next };
    });
  };

  if (!user) return null;

  const handleChangeAvatar = async () => {
    setIsUploading(true);
    const result = await changeAvatar(user.id);
    setIsUploading(false);

    if (result.cancelled) return;
    if (result.error) {
      Alert.alert('오류', result.error);
      return;
    }
    // 업로드된 URL 사용, fallback으로 로컬 URI (즉시 미리보기)
    setAvatarUrl(result.url || result.localUri);
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('오류', '닉네임을 입력해주세요.');
      return;
    }

    const { error } = await updateProfile(user.id, {
      nickname: nickname.trim(),
      region: region || undefined,
      avatar_url: avatarUrl || undefined,
    });

    if (error) {
      Alert.alert('오류', '프로필 수정에 실패했습니다.');
      return;
    }

    // Save sports selections
    const selections = Object.entries(selectedSports).map(([sport_id, skill_level]) => ({
      sport_id,
      skill_level,
    }));
    await saveUserSports(user.id, selections);

    Alert.alert('완료', '프로필이 수정되었습니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필 수정</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* 아바타 */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Feather name="user" size={40} color={COLORS.textTertiary} />
                </View>
              )}
              {isUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={handleChangeAvatar}
              disabled={isUploading}
            >
              <Text style={styles.changePhotoText}>사진 변경</Text>
            </TouchableOpacity>
          </View>

          {/* 닉네임 */}
          <View style={styles.field}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={20}
            />
          </View>

          {/* 지역 선택 */}
          <View style={styles.field}>
            <Text style={styles.label}>지역</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowRegionModal(true)}
            >
              <Text
                style={[
                  styles.selectText,
                  !region && { color: COLORS.textTertiary },
                ]}
              >
                {region || '지역을 선택하세요'}
              </Text>
              <Feather
                name="chevron-down"
                size={20}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* 관심 종목 */}
          <View style={styles.field}>
            <Text style={styles.label}>관심 종목</Text>
            {isSportsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 12 }} />
            ) : (
              <View style={styles.chipContainer}>
                {sports.map((sport) => {
                  const isSelected = selectedSports[sport.id] !== undefined;
                  return (
                    <TouchableOpacity
                      key={sport.id}
                      style={[styles.sportChip, isSelected && styles.sportChipSelected]}
                      onPress={() => toggleSport(sport.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sportChipEmoji}>{sport.icon}</Text>
                      <Text style={[styles.sportChipText, isSelected && styles.sportChipTextSelected]}>
                        {sport.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Skill level steppers for selected sports */}
            {Object.entries(selectedSports).map(([sportId, level]) => {
              const sport = sports.find((s) => s.id === sportId);
              if (!sport) return null;
              return (
                <View key={sportId} style={styles.skillRow}>
                  <Text style={styles.skillSportName}>{sport.icon} {sport.name}</Text>
                  <View style={styles.stepperControl}>
                    <TouchableOpacity
                      style={[styles.stepperBtn, level <= 0 && styles.stepperBtnDisabled]}
                      onPress={() => updateSkillLevel(sportId, -1)}
                      activeOpacity={0.6}
                    >
                      <Feather name="minus" size={16} color={level <= 0 ? COLORS.textTertiary : COLORS.primary} />
                    </TouchableOpacity>
                    <View style={styles.stepperValueBox}>
                      <Text style={styles.stepperValue}>{level}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.stepperBtn, level >= 10 && styles.stepperBtnDisabled]}
                      onPress={() => updateSkillLevel(sportId, 1)}
                      activeOpacity={0.6}
                    >
                      <Feather name="plus" size={16} color={level >= 10 ? COLORS.textTertiary : COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.levelDescription}>
                    {getLevelDescription(sport.name, level)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 저장 버튼 */}
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>저장하기</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 지역 선택 모달 */}
      <Modal visible={showRegionModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>지역 선택</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <Feather name="x" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={REGIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.regionItem,
                    region === item && styles.regionItemSelected,
                  ]}
                  onPress={() => {
                    setRegion(item);
                    setShowRegionModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.regionItemText,
                      region === item && styles.regionItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {region === item && (
                    <Feather name="check" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  field: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectText: { fontSize: 16, color: COLORS.text },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  regionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  regionItemSelected: { backgroundColor: '#EFF6FF' },
  regionItemText: { fontSize: 16, color: COLORS.text },
  regionItemTextSelected: { color: COLORS.primary, fontWeight: '600' },
  // Sport chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  sportChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sportChipEmoji: {
    fontSize: 18,
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  sportChipTextSelected: {
    color: '#FFFFFF',
  },
  // Skill stepper
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  levelDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: '100%',
    marginTop: 6,
  },
  skillSportName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    borderColor: COLORS.border,
  },
  stepperValueBox: {
    width: 36,
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
});
