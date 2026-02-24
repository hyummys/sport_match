import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

/**
 * 갤러리에서 1:1 정사각형 크롭 이미지 선택 (base64 포함)
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerResult> {
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
}

/**
 * base64 문자열을 Uint8Array로 변환
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * 아바타 이미지를 Supabase Storage에 업로드하고 public URL 반환
 * React Native에서는 fetch→blob이 동작하지 않으므로 base64→ArrayBuffer 방식 사용
 */
export async function uploadAvatar(
  userId: string,
  base64: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const bytes = base64ToBytes(base64);
    const filePath = `${userId}/avatar.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, bytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    // 캐시 무효화를 위해 timestamp 추가
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
    return { url: publicUrl, error: null };
  } catch (e: any) {
    return { url: null, error: e.message || '이미지 업로드에 실패했습니다.' };
  }
}
