import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useUserSports } from '../../hooks/useUserSports';
import { COLORS, getLevelDescription } from '../../lib/constants';
import { supabase } from '../../lib/supabase';
import { Sport } from '../../lib/types';

export default function SignupScreen() {
  const router = useRouter();
  const { signUpWithEmail, createUserProfile } = useAuth();
  const { saveUserSports } = useUserSports();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sports selection state
  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);
  const [selectedSports, setSelectedSports] = useState<Record<string, number>>({});

  useEffect(() => {
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
    loadSports();
  }, []);

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

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      Alert.alert('알림', '이메일, 비밀번호, 닉네임은 필수입니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    const { data, error } = await signUpWithEmail(email, password);

    if (error) {
      setIsLoading(false);
      Alert.alert('회원가입 실패', error.message);
      return;
    }

    if (data?.user) {
      const { error: profileError } = await createUserProfile(
        data.user.id,
        nickname,
        region || undefined
      );

      if (profileError) {
        setIsLoading(false);
        Alert.alert('프로필 생성 실패', profileError.message);
        return;
      }

      // Save selected sports (optional - skip if none selected)
      const sportEntries = Object.entries(selectedSports);
      if (sportEntries.length > 0) {
        const selections = sportEntries.map(([sport_id, skill_level]) => ({
          sport_id,
          skill_level,
        }));
        await saveUserSports(data.user.id, selections);
      }
    }

    setIsLoading(false);
    Alert.alert('회원가입 완료', '환영합니다!', [
      { text: '확인', onPress: () => router.replace('/(tabs)/home') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>회원가입</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* 폼 */}
          <View style={styles.formSection}>
            <Text style={styles.label}>이메일 *</Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              placeholderTextColor={COLORS.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>비밀번호 *</Text>
            <TextInput
              style={styles.input}
              placeholder="6자 이상"
              placeholderTextColor={COLORS.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={styles.label}>비밀번호 확인 *</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력"
              placeholderTextColor={COLORS.textTertiary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <Text style={styles.label}>닉네임 *</Text>
            <TextInput
              style={styles.input}
              placeholder="앱에서 사용할 이름"
              placeholderTextColor={COLORS.textTertiary}
              value={nickname}
              onChangeText={setNickname}
            />

            <Text style={styles.label}>활동 지역</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 서울 강남구"
              placeholderTextColor={COLORS.textTertiary}
              value={region}
              onChangeText={setRegion}
            />

            {/* 관심 종목 선택 */}
            <Text style={[styles.label, { marginTop: 16 }]}>관심 종목 선택</Text>
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

            <TouchableOpacity
              style={[styles.signupBtn, isLoading && styles.signupBtnDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.signupBtnText}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 로그인 링크 */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>이미 계정이 있나요? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  formSection: {
    marginTop: 16,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
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
  signupBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  signupBtnDisabled: {
    opacity: 0.6,
  },
  signupBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
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
