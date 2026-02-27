import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Sport, RoomWithDetails } from '../../lib/types';
import { COLORS, formatSkillRange } from '../../lib/constants';
import { useFilterStore } from '../../stores/filterStore';

const LEVEL_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SearchScreen() {
  const router = useRouter();
  const { skillLevel, setSkillLevel } = useFilterStore();

  const [searchText, setSearchText] = useState('');
  const [sports, setSports] = useState<Sport[]>([]);
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loadLastSport = async () => {
      const savedSportId = await AsyncStorage.getItem('last_search_sport_id');
      if (savedSportId) {
        setSelectedSportId(savedSportId);
        setShowOnboarding(false);
      }
    };
    loadLastSport();
    loadSports();
    searchRooms();
  }, []);

  useEffect(() => {
    searchRooms();
  }, [selectedSportId, skillLevel]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchRooms();
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  const loadSports = async () => {
    const { data } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setSports(data);
  };

  const searchRooms = async () => {
    setIsSearching(true);

    let query = supabase
      .from('rooms')
      .select('*, sports(*), users!host_id(*)')
      .eq('status', 'recruiting')
      .gte('play_date', new Date().toISOString())
      .order('play_date', { ascending: true });

    if (selectedSportId) {
      query = query.eq('sport_id', selectedSportId);
    }

    if (searchText.trim()) {
      query = query.ilike('title', `%${searchText.trim()}%`);
    }

    const { data } = await query;

    let filtered = (data as RoomWithDetails[]) || [];

    // Client-side skill level filtering: show rooms whose range includes the selected level
    if (skillLevel !== null) {
      filtered = filtered.filter((room) =>
        room.min_skill_level <= skillLevel && room.max_skill_level >= skillLevel
      );
    }

    setRooms(filtered);
    setIsSearching(false);
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSports(), searchRooms()]);
    setRefreshing(false);
  }, [selectedSportId, skillLevel, searchText]);

  const handleSportFilter = (sportId: string) => {
    setSelectedSportId((prev) => {
      const newValue = prev === sportId ? null : sportId;
      if (newValue) {
        AsyncStorage.setItem('last_search_sport_id', newValue);
        setShowOnboarding(false);
      } else {
        AsyncStorage.removeItem('last_search_sport_id');
      }
      return newValue;
    });
  };

  const handleSkillFilter = (level: number) => {
    setSkillLevel(skillLevel === level ? null : level);
  };

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedSportId(null);
    setSkillLevel(null);
  };

  const hasActiveFilters = !!searchText || !!selectedSportId || skillLevel !== null;

  const renderRoomCard = ({ item }: { item: RoomWithDetails }) => {
    const playDate = new Date(item.play_date);
    const formattedDate = playDate.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.roomCard}
        onPress={() => router.push(`/(tabs)/home/${item.sport_id}/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.roomHeader}>
          <Text style={styles.roomSportIcon}>{item.sports?.icon}</Text>
          <View style={styles.roomHeaderText}>
            <Text style={styles.roomTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.skillBadge}>
              <Text style={styles.skillBadgeText}>
                {formatSkillRange(item.min_skill_level, item.max_skill_level)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.roomInfo}>
          <View style={styles.roomInfoRow}>
            <Feather name="map-pin" size={14} color={COLORS.textSecondary} />
            <Text style={styles.roomInfoText} numberOfLines={1}>
              {item.location_name}
            </Text>
          </View>
          <View style={styles.roomInfoRow}>
            <Feather name="clock" size={14} color={COLORS.textSecondary} />
            <Text style={styles.roomInfoText}>
              {formattedDate}
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
  };

  const renderListHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={18} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="방 제목으로 검색"
          placeholderTextColor={COLORS.textTertiary}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Feather name="x-circle" size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Onboarding Banner */}
      {showOnboarding && (
        <View style={styles.onboardingBanner}>
          <Text style={styles.onboardingTitle}>어떤 종목을 볼까요?</Text>
          <Text style={styles.onboardingSubtitle}>
            관심 있는 종목을 선택하면 해당 종목의 방만 볼 수 있어요
          </Text>
        </View>
      )}

      {/* Sport Filter Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>종목</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport.id}
              style={[
                styles.chip,
                selectedSportId === sport.id && styles.chipActive,
              ]}
              onPress={() => handleSportFilter(sport.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{sport.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  selectedSportId === sport.id && styles.chipTextActive,
                ]}
              >
                {sport.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Skill Level Filter */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>실력 레벨</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {LEVEL_OPTIONS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.levelChip,
                skillLevel === level && styles.levelChipActive,
              ]}
              onPress={() => handleSkillFilter(level)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.levelChipText,
                  skillLevel === level && styles.levelChipTextActive,
                ]}
              >
                Lv.{level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.resultCount}>
            {rooms.length}개의 결과
          </Text>
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearFilters}>필터 초기화</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>탐색</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>탐색</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomCard}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isSearching ? (
              <ActivityIndicator size="large" color={COLORS.textTertiary} />
            ) : (
              <Feather name="search" size={48} color={COLORS.textTertiary} />
            )}
            <Text style={styles.emptyTitle}>
              {isSearching ? '검색 중...' : '검색 결과가 없습니다'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {isSearching
                ? ''
                : hasActiveFilters
                  ? '필터를 변경하거나 다른 키워드로 검색해보세요'
                  : '현재 모집 중인 방이 없습니다'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onboardingBanner: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
  },
  onboardingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    padding: 0,
  },
  filterSection: {
    marginTop: 16,
    paddingLeft: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  levelChip: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  levelChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  levelChipTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    paddingBottom: 4,
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  clearFilters: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  roomCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 12,
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
    gap: 10,
  },
  roomSportIcon: {
    fontSize: 24,
  },
  roomHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  skillBadge: {
    backgroundColor: COLORS.primaryLight + '40',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryDark,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
