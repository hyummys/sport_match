import { RoomWithDetails } from './types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 카드 헤더용: "⚽ 축구 · 2/28(금) 19:00"
 */
export function formatRoomCardHeader(room: RoomWithDetails): string {
  const icon = room.sports?.icon ?? '';
  const name = room.sports?.name ?? '';
  const d = new Date(room.play_date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${icon} ${name} · ${month}/${day}(${weekday}) ${hours}:${minutes}`;
}

/**
 * DB 저장용 자동 제목: "축구 · 강남 풋살파크 · 2/28 19:00"
 */
export function generateRoomTitle(
  sportName: string,
  locationName: string,
  playDate: string,
): string {
  const d = new Date(playDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${sportName} · ${locationName} · ${month}/${day} ${hours}:${minutes}`;
}
