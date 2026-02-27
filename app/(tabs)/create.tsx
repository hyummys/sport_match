import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { Sport, CreateRoomInput, FavoritePlace } from '../../lib/types';
import {
  COLORS,
  formatSkillRange,
  getLevelDescriptions,
} from '../../lib/constants';
import { useRooms } from '../../hooks/useRooms';
import { useFavoritePlaces } from '../../hooks/useFavoritePlaces';
import { useAuthStore } from '../../stores/authStore';
import { searchPlaces, getPlaceKeyword, KakaoPlace } from '../../lib/kakao';
import { WebView } from 'react-native-webview';
import WheelPicker from '../../components/WheelPicker';

const KAKAO_JS_KEY = process.env.EXPO_PUBLIC_KAKAO_JS_KEY;

function getKakaoMapHtml(lat: number, lng: number, name: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%}</style>
</head><body>
<div id="map"></div>
<script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false"></script>
<script>
kakao.maps.load(function(){
  var c=new kakao.maps.LatLng(${lat},${lng});
  var map=new kakao.maps.Map(document.getElementById('map'),{center:c,level:4,draggable:false,scrollwheel:false,disableDoubleClickZoom:true});
  var marker=new kakao.maps.Marker({position:c});
  marker.setMap(map);
  var iw=new kakao.maps.InfoWindow({content:'<div style="padding:4px 8px;font-size:12px;white-space:nowrap">${name.replace(/'/g, "\\'").replace(/"/g, "&quot;")}</div>'});
  iw.open(map,marker);
});
</script>
</body></html>`;
}

export default function CreateRoomScreen() {
  const { user } = useAuthStore();
  const { createRoom, isLoading: isSubmitting } = useRooms();
  const { getFavorites, addFavorite, removeFavorite } = useFavoritePlaces();

  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);

  // Form state
  const [sportId, setSportId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [costPerPerson, setCostPerPerson] = useState('');
  const [minSkillLevel, setMinSkillLevel] = useState(0);
  const [maxSkillLevel, setMaxSkillLevel] = useState(10);

  // Picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [tempParticipants, setTempParticipants] = useState(4);

  // Location search
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<KakaoPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);

  // Skill help modal
  const [showSkillHelp, setShowSkillHelp] = useState(false);

  useEffect(() => {
    loadSports();
  }, []);

  const selectedSport = sports.find((s) => s.id === sportId);
  const levelDescriptions = getLevelDescriptions(selectedSport?.name || '');

  const loadSports = async () => {
    setIsSportsLoading(true);
    const { data } = await supabase
      .from('sports')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (data) setSports(data);
    setIsSportsLoading(false);
  };

  const formatDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}년 ${m}월 ${d}일`;
  };

  const formatTime = (date: Date): string => {
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  };

  const getPlayDateISO = (): string | null => {
    if (!selectedDate || !selectedTime) return null;
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    return combined.toISOString();
  };

  const validate = (): boolean => {
    if (!sportId) {
      Alert.alert('입력 오류', '종목을 선택해주세요.');
      return false;
    }
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('입력 오류', '날짜를 선택해주세요.');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('입력 오류', '시간을 선택해주세요.');
      return false;
    }
    const combined = new Date(selectedDate);
    combined.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);
    if (combined <= new Date()) {
      Alert.alert('입력 오류', '미래 날짜를 선택해주세요.');
      return false;
    }
    if (maxParticipants < 2) {
      Alert.alert('입력 오류', '최대 인원은 2명 이상이어야 합니다.');
      return false;
    }
    if (!locationName.trim()) {
      Alert.alert('입력 오류', '장소를 선택하거나 입력해주세요.');
      return false;
    }
    if (minSkillLevel > maxSkillLevel) {
      Alert.alert('입력 오류', '최소 레벨이 최대 레벨보다 높을 수 없습니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    if (!validate()) return;

    const input: CreateRoomInput = {
      sport_id: sportId,
      title: title.trim(),
      description: description.trim() || undefined,
      location_name: locationName.trim(),
      location_address: locationAddress.trim() || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      play_date: getPlayDateISO()!,
      max_participants: maxParticipants,
      cost_per_person: parseInt(costPerPerson) || 0,
      min_skill_level: minSkillLevel,
      max_skill_level: maxSkillLevel,
    };

    const { data, error } = await createRoom(input, user.id);

    if (error) {
      Alert.alert('생성 실패', error.message || '방을 생성하지 못했습니다.');
      return;
    }

    Alert.alert('성공', '방이 생성되었습니다!', [
      { text: '확인', onPress: () => router.replace('/(tabs)/home') },
    ]);
  };

  // ========== Location Search ==========

  const openLocationSearch = async () => {
    const sportName = selectedSport?.name || '';
    const keyword = getPlaceKeyword(sportName, user?.region);

    // 입력칸 비우고 모달 열기
    setLocationQuery('');
    setLocationResults([]);
    setActiveTab('search');
    setShowLocationSearch(true);

    // 즐겨찾기 로드
    if (user) {
      getFavorites(user.id).then(({ data }) => {
        if (data) setFavorites(data);
      });
    }

    // 자동 검색 실행
    setIsSearching(true);
    const { data, error } = await searchPlaces(keyword);
    setIsSearching(false);
    if (!error) {
      setLocationResults(data);
    }
  };

  const handleLocationSearch = async () => {
    if (!locationQuery.trim()) return;
    setIsSearching(true);
    const { data, error } = await searchPlaces(locationQuery.trim());
    setIsSearching(false);
    if (error) {
      Alert.alert('검색 오류', error);
      return;
    }
    setLocationResults(data);
  };

  const isFavorite = (placeName: string, addressName: string) =>
    favorites.some(
      (f) => f.place_name === placeName && f.address_name === addressName
    );

  const toggleFavorite = async (place: KakaoPlace) => {
    if (!user) return;
    const existing = favorites.find(
      (f) => f.place_name === place.place_name && f.address_name === place.address_name
    );
    if (existing) {
      const { error } = await removeFavorite(existing.id);
      if (!error) {
        setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      }
    } else {
      const { data, error } = await addFavorite(user.id, place);
      if (!error && data) {
        setFavorites((prev) => [data, ...prev]);
      }
    }
  };

  const toggleFavoriteById = async (fav: FavoritePlace) => {
    const { error } = await removeFavorite(fav.id);
    if (!error) {
      setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
    }
  };

  const selectFavoritePlace = (fav: FavoritePlace) => {
    setLocationName(fav.place_name);
    setLocationAddress(fav.road_address_name || fav.address_name);
    setLatitude(fav.latitude);
    setLongitude(fav.longitude);
    setShowLocationSearch(false);
  };

  const selectPlace = (place: KakaoPlace) => {
    setLocationName(place.place_name);
    setLocationAddress(place.road_address_name || place.address_name);
    setLatitude(parseFloat(place.y));
    setLongitude(parseFloat(place.x));
    setShowLocationSearch(false);
  };

  // ========== Participant Picker ==========

  const openParticipantPicker = () => {
    setTempParticipants(maxParticipants);
    setShowParticipantPicker(true);
  };

  const confirmParticipants = () => {
    setMaxParticipants(tempParticipants);
    setShowParticipantPicker(false);
  };

  // ========== Date/Time Picker Handlers ==========

  const onDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const onTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    setShowTimePicker(false);
    if (date) setSelectedTime(date);
  };

  // ========== Render Helpers ==========

  const renderSportChips = () => {
    if (isSportsLoading) {
      return (
        <View style={styles.sportsLoadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      );
    }

    return (
      <View style={styles.chipContainer}>
        {(sports || []).map((sport) => {
          const selected = sportId === sport.id;
          return (
            <TouchableOpacity
              key={sport.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setSportId(sport.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{sport.icon}</Text>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {sport.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderDateTimeSection = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return (
      <View style={styles.dateTimeRow}>
        {/* Date Picker */}
        <View style={styles.dateTimeField}>
          <Text style={styles.label}>날짜 *</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="calendar" size={18} color={selectedDate ? COLORS.text : COLORS.textTertiary} />
            <Text style={[styles.dateTimeButtonText, !selectedDate && styles.dateTimePlaceholder]}>
              {selectedDate ? formatDate(selectedDate) : '날짜 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Picker */}
        <View style={styles.dateTimeField}>
          <Text style={styles.label}>시간 *</Text>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <Feather name="clock" size={18} color={selectedTime ? COLORS.text : COLORS.textTertiary} />
            <Text style={[styles.dateTimeButtonText, !selectedTime && styles.dateTimePlaceholder]}>
              {selectedTime ? formatTime(selectedTime) : '시간 선택'}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || tomorrow}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={onDateChange}
            locale="ko"
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={selectedTime || new Date(2026, 0, 1, 14, 0)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minuteInterval={5}
            onChange={onTimeChange}
            locale="ko"
          />
        )}
      </View>
    );
  };

  const renderLevelStepper = (
    label: string,
    value: number,
    onChange: (v: number) => void,
  ) => (
    <View style={styles.stepperSection}>
      <View style={styles.stepperHeader}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <View style={styles.stepperControl}>
          <TouchableOpacity
            style={[styles.stepperBtn, value <= 0 && styles.stepperBtnDisabled]}
            onPress={() => value > 0 && onChange(value - 1)}
            activeOpacity={0.6}
          >
            <Feather name="minus" size={18} color={value <= 0 ? COLORS.textTertiary : COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.stepperValueBox}>
            <Text style={styles.stepperValue}>{value}</Text>
          </View>
          <TouchableOpacity
            style={[styles.stepperBtn, value >= 10 && styles.stepperBtnDisabled]}
            onPress={() => value < 10 && onChange(value + 1)}
            activeOpacity={0.6}
          >
            <Feather name="plus" size={18} color={value >= 10 ? COLORS.textTertiary : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.stepperDescription}>
        {levelDescriptions[value] || ''}
      </Text>
    </View>
  );

  const renderSkillHelpModal = () => (
    <Modal
      visible={showSkillHelp}
      animationType="slide"
      transparent
      onRequestClose={() => setShowSkillHelp(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedSport ? `${selectedSport.icon} ${selectedSport.name}` : ''} 레벨 가이드
            </Text>
            <TouchableOpacity onPress={() => setShowSkillHelp(false)} hitSlop={8}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {levelDescriptions.map((desc, index) => (
              <View key={index} style={[styles.helpItem, index > 0 && styles.helpItemBorder]}>
                <View style={styles.helpLabelRow}>
                  <View style={[styles.helpBadge, { backgroundColor: getLevelColor(index) }]}>
                    <Text style={styles.helpBadgeText}>Lv.{index}</Text>
                  </View>
                </View>
                <Text style={styles.helpDescription}>{desc}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderParticipantPickerModal = () => (
    <Modal
      visible={showParticipantPicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowParticipantPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>최대 인원 선택</Text>
            <TouchableOpacity onPress={() => setShowParticipantPicker(false)} hitSlop={8}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.pickerBody}>
            <WheelPicker
              min={2}
              max={30}
              value={tempParticipants}
              onValueChange={setTempParticipants}
              suffix="명"
            />
          </View>
          <View style={styles.pickerFooter}>
            <TouchableOpacity
              style={styles.pickerConfirmBtn}
              onPress={confirmParticipants}
              activeOpacity={0.8}
            >
              <Text style={styles.pickerConfirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLocationSearchModal = () => (
    <Modal
      visible={showLocationSearch}
      animationType="slide"
      transparent
      onRequestClose={() => setShowLocationSearch(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '85%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>장소 검색</Text>
            <TouchableOpacity onPress={() => setShowLocationSearch(false)} hitSlop={8}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* 검색 입력 */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={locationQuery}
              onChangeText={setLocationQuery}
              placeholder="예: 영등포구 테니스장"
              placeholderTextColor={COLORS.textTertiary}
              returnKeyType="search"
              onSubmitEditing={handleLocationSearch}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleLocationSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="search" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* 탭 전환 */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'search' && styles.tabActive]}
              onPress={() => setActiveTab('search')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
                검색결과
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
              onPress={() => setActiveTab('favorites')}
              activeOpacity={0.7}
            >
              <Feather
                name="star"
                size={14}
                color={activeTab === 'favorites' ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
                즐겨찾기
              </Text>
            </TouchableOpacity>
          </View>

          {/* 검색 결과 탭 */}
          {activeTab === 'search' && (
            <FlatList
              data={locationResults}
              keyExtractor={(item, idx) => `${item.place_name}-${idx}`}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>
                    {isSearching ? '검색 중...' : '검색어를 입력하세요'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const saved = isFavorite(item.place_name, item.address_name);
                return (
                  <TouchableOpacity
                    style={styles.placeItem}
                    onPress={() => selectPlace(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.placeIcon}>
                      <Feather name="map-pin" size={16} color={COLORS.primary} />
                    </View>
                    <View style={styles.placeInfo}>
                      <Text style={styles.placeName}>{item.place_name}</Text>
                      <Text style={styles.placeAddress} numberOfLines={1}>
                        {item.road_address_name || item.address_name}
                      </Text>
                      {item.phone ? (
                        <Text style={styles.placePhone}>{item.phone}</Text>
                      ) : null}
                    </View>
                    {item.distance ? (
                      <Text style={styles.placeDistance}>
                        {parseInt(item.distance) >= 1000
                          ? `${(parseInt(item.distance) / 1000).toFixed(1)}km`
                          : `${item.distance}m`}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      style={styles.favBtn}
                      onPress={() => toggleFavorite(item)}
                      hitSlop={8}
                    >
                      <Feather
                        name="star"
                        size={20}
                        color={saved ? '#F59E0B' : COLORS.border}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* 즐겨찾기 탭 */}
          {activeTab === 'favorites' && (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>
                    즐겨찾기한 장소가 없습니다
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.placeItem}
                  onPress={() => selectFavoritePlace(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.placeIcon}>
                    <Feather name="map-pin" size={16} color={COLORS.primary} />
                  </View>
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName}>{item.place_name}</Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>
                      {item.road_address_name || item.address_name}
                    </Text>
                    {item.phone ? (
                      <Text style={styles.placePhone}>{item.phone}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    style={styles.favBtn}
                    onPress={() => toggleFavoriteById(item)}
                    hitSlop={8}
                  >
                    <Feather name="star" size={20} color="#F59E0B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>방 만들기</Text>
          <Text style={styles.headerSubtitle}>운동 모집 방을 생성하세요</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sport Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>종목 선택 *</Text>
            {renderSportChips()}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 주말 풋살 같이 하실 분!"
              placeholderTextColor={COLORS.textTertiary}
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="운동 진행 방식, 준비물 등을 적어주세요"
              placeholderTextColor={COLORS.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.locationLabelRow}>
              <Text style={styles.label}>장소 *</Text>
              <TouchableOpacity
                style={styles.locationSearchBtn}
                onPress={openLocationSearch}
                activeOpacity={0.7}
              >
                <Feather name="search" size={14} color={COLORS.primary} />
                <Text style={styles.locationSearchBtnText}>장소 검색</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="장소 이름"
              placeholderTextColor={COLORS.textTertiary}
              value={locationName}
              onChangeText={(text) => {
                setLocationName(text);
                setLatitude(null);
                setLongitude(null);
              }}
            />
            {locationAddress ? (
              <Text style={styles.locationAddressText}>{locationAddress}</Text>
            ) : null}
            {latitude && longitude ? (
              <View style={styles.mapPreviewContainer}>
                <WebView
                  style={styles.mapPreview}
                  source={{ html: getKakaoMapHtml(latitude, longitude, locationName) }}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                  javaScriptEnabled
                />
              </View>
            ) : null}
          </View>

          {/* Date / Time */}
          <View style={styles.section}>
            {renderDateTimeSection()}
          </View>

          {/* Max Participants — Wheel Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>최대 인원 *</Text>
            <TouchableOpacity
              style={styles.participantSelector}
              onPress={openParticipantPicker}
              activeOpacity={0.7}
            >
              <Feather name="users" size={18} color={COLORS.primary} />
              <Text style={styles.participantValue}>{maxParticipants}명</Text>
              <Feather name="chevron-down" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Cost */}
          <View style={styles.section}>
            <Text style={styles.label}>1인당 비용 (원)</Text>
            <TextInput
              style={styles.input}
              placeholder="0 (무료)"
              placeholderTextColor={COLORS.textTertiary}
              value={costPerPerson}
              onChangeText={setCostPerPerson}
              keyboardType="number-pad"
              maxLength={7}
            />
          </View>

          {/* Skill Level Range */}
          <View style={styles.section}>
            <View style={styles.skillLabelRow}>
              <Text style={styles.label}>실력 범위</Text>
              {sportId && (
                <TouchableOpacity
                  onPress={() => setShowSkillHelp(true)}
                  style={styles.helpButton}
                  hitSlop={8}
                >
                  <Feather name="help-circle" size={18} color={COLORS.primary} />
                  <Text style={styles.helpButtonText}>레벨 가이드</Text>
                </TouchableOpacity>
              )}
            </View>
            {sportId ? (
              <View style={styles.skillCard}>
                <View style={styles.skillRangeSummary}>
                  <Text style={styles.skillRangeText}>
                    {formatSkillRange(minSkillLevel, maxSkillLevel)}
                  </Text>
                </View>
                {renderLevelStepper('최소 레벨', minSkillLevel, (v) => {
                  setMinSkillLevel(v);
                  if (v > maxSkillLevel) setMaxSkillLevel(v);
                })}
                <View style={styles.skillDivider} />
                {renderLevelStepper('최대 레벨', maxSkillLevel, (v) => {
                  setMaxSkillLevel(v);
                  if (v < minSkillLevel) setMinSkillLevel(v);
                })}
              </View>
            ) : (
              <Text style={styles.hint}>종목을 먼저 선택해주세요</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="plus-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>방 만들기</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderSkillHelpModal()}
      {renderParticipantPickerModal()}
      {renderLocationSearchModal()}
    </SafeAreaView>
  );
}

function getLevelColor(level: number): string {
  if (level <= 2) return '#22C55E';
  if (level <= 5) return '#3B82F6';
  if (level <= 8) return '#F59E0B';
  return '#EF4444';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  sportsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
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
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipEmoji: {
    fontSize: 18,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },

  // Location
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  locationSearchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  locationAddressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginLeft: 4,
  },
  mapPreviewContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  mapPreview: {
    width: '100%',
    height: 160,
  },

  // Participant picker trigger
  participantSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  participantValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  // Date / Time
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  dateTimeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  dateTimePlaceholder: {
    color: COLORS.textTertiary,
  },

  // Skill Level
  skillLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  helpButtonText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  skillCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillRangeSummary: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  skillRangeText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  skillDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  // Stepper
  stepperSection: {
    gap: 6,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  stepperValueBox: {
    width: 44,
    alignItems: 'center',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  stepperDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Modal (shared)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScroll: {
    paddingHorizontal: 20,
  },
  helpItem: {
    paddingVertical: 14,
  },
  helpItemBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  helpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  helpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  helpBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  helpDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Participant picker modal
  pickerBody: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pickerFooter: {
    paddingHorizontal: 20,
  },
  pickerConfirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Location search modal
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySearch: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  placePhone: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  placeDistance: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  favBtn: {
    padding: 6,
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },

  // Submit
  submitButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
