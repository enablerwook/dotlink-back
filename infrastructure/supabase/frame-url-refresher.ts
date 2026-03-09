// infrastructure/supabase/frame-url-refresher.ts
// 라이브러리 카드를 조회할 때마다 frames의 서명 URL을 갱신합니다.
//
// 왜 필요한가:
//   - frames JSONB에 저장된 imageUrl은 24시간 유효한 서명 URL
//   - 라이브러리 카드는 24시간 이후에도 이미지가 보여야 함
//   - storagePath가 있는 프레임만 갱신 (플레이스홀더는 건드리지 않음)
//
// 보안 모델:
//   - 서명 URL은 서버(service_role 또는 사용자 JWT)만 발급 가능
//   - API 레이어에서 이미 user_id 소유권 확인 완료 후 이 함수 호출
//   - 버킷 private + 스토리지 RLS로 이중 방어

import { createClient } from "@/infrastructure/supabase/server"
import type { FrameData } from "@/lib/types"

// 서명 URL 유효기간: 24시간
const SIGNED_URL_EXPIRY_SEC = 86400

/**
 * storagePath가 있는 프레임의 imageUrl을 새 서명 URL로 교체합니다.
 * storagePath가 없는 프레임(플레이스홀더)은 그대로 반환합니다.
 */
export async function refreshFrameSignedUrls(
  frames: FrameData[],
): Promise<FrameData[]> {
  const needsRefresh = frames.some((f) => f.storagePath)
  if (!needsRefresh) return frames

  const supabase = await createClient()

  return Promise.all(
    frames.map(async (frame) => {
      if (!frame.storagePath) return frame

      const { data, error } = await supabase.storage
        .from("frames")
        .createSignedUrl(frame.storagePath, SIGNED_URL_EXPIRY_SEC)

      // 갱신 실패 시 기존 URL 유지 (파이프라인 중단 없음)
      if (error || !data) return frame

      return { ...frame, imageUrl: data.signedUrl }
    }),
  )
}
