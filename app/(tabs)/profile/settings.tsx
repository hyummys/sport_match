import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../lib/constants';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  const handleChangePassword = () => {
    const email = session?.user?.email;
    if (!email) {
      Alert.alert('오류', '이메일 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert(
      '비밀번호 변경',
      `${email}로 비밀번호 재설정 이메일을 보냅니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '보내기',
          onPress: async () => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
              Alert.alert('오류', '이메일 전송에 실패했습니다.');
            } else {
              Alert.alert('완료', '비밀번호 재설정 이메일을 보냈습니다. 메일함을 확인해주세요.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: signOut,
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: () => {
            Alert.alert('최종 확인', '되돌릴 수 없습니다. 정말 탈퇴하시겠습니까?', [
              { text: '취소', style: 'cancel' },
              {
                text: '탈퇴',
                style: 'destructive',
                onPress: async () => {
                  // 서버 측 계정 삭제는 Edge Function이 필요하므로, 우선 로그아웃 처리
                  await signOut();
                  Alert.alert('완료', '탈퇴 처리가 요청되었습니다.');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const appVersion =
    Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>설정</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 계정 섹션 */}
        <Text style={styles.sectionTitle}>계정</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
            <Feather name="lock" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>비밀번호 변경</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <Feather name="log-out" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>로그아웃</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handleDeleteAccount}>
            <Feather name="user-x" size={20} color={COLORS.error} />
            <Text style={[styles.menuText, { color: COLORS.error }]}>회원 탈퇴</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* 정보 섹션 */}
        <Text style={styles.sectionTitle}>정보</Text>
        <View style={styles.section}>
          <View style={styles.menuItem}>
            <Feather name="info" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>앱 버전</Text>
            <Text style={styles.menuValue}>{appVersion}</Text>
          </View>
          <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('이용약관', '준비 중입니다.')}>
            <Feather name="file-text" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>이용약관</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemLast]}
            onPress={() => Alert.alert('개인정보 처리방침', '준비 중입니다.')}
          >
            <Feather name="shield" size={20} color={COLORS.text} />
            <Text style={styles.menuText}>개인정보 처리방침</Text>
            <Feather name="chevron-right" size={20} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
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
  menuValue: { fontSize: 14, color: COLORS.textSecondary },
});
