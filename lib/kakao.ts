const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

export interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  phone: string;
  distance: string;
  category_name: string;
}

interface KakaoSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoPlace[];
}

/**
 * 카카오 키워드 장소 검색
 * @param query 검색어 (예: "영등포구 테니스장")
 * @param options 좌표 기반 검색 시 x(경도), y(위도), radius(미터)
 */
export async function searchPlaces(
  query: string,
  options?: { x?: number; y?: number; radius?: number }
): Promise<{ data: KakaoPlace[]; error: string | null }> {
  if (!KAKAO_REST_API_KEY) {
    return { data: [], error: 'Kakao API 키가 설정되지 않았습니다.' };
  }

  try {
    const params = new URLSearchParams({
      query,
      size: '15',
      sort: options?.x ? 'distance' : 'accuracy',
    });

    if (options?.x && options?.y) {
      params.set('x', String(options.x));
      params.set('y', String(options.y));
      if (options.radius) {
        params.set('radius', String(options.radius));
      }
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const msg = errorBody?.message || `HTTP ${response.status}`;
      return { data: [], error: `검색 실패: ${msg}` };
    }

    const result: KakaoSearchResponse = await response.json();
    return { data: result.documents, error: null };
  } catch (e: any) {
    return { data: [], error: e.message || '장소 검색에 실패했습니다.' };
  }
}

/**
 * 정적 지도 이미지 URL 생성 (OpenStreetMap)
 * Google Play 서비스 없이도 동작
 */
export function getStaticMapUrl(
  lat: number,
  lon: number,
  width: number = 600,
  height: number = 300,
): string {
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=16&size=${width}x${height}&maptype=mapnik&markers=${lat},${lon},red-pushpin`;
}

/**
 * 스포츠 이름으로 장소 검색 키워드 생성
 */
export function getPlaceKeyword(sportName: string, region?: string | null): string {
  const specialCases: Record<string, string> = {
    '러닝': '러닝 코스',
    '자전거': '자전거 도로',
  };
  const suffix = specialCases[sportName] || `${sportName}장`;
  return region ? `${region} ${suffix}` : suffix;
}
