/**
 * 개발 데이터 초기화 스크립트
 * 실행: npx tsx --env-file .env.local scripts/cleanup-dev-data.ts
 *
 * 삭제 대상:
 *   - public.creation_cards (FK 의존성으로 먼저)
 *   - public.library_cards
 *   - public.analyses
 *   - storage.frames 버킷 파일 전체
 *   - public.usage_records 카운터 리셋
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY",
  )
  console.error(
    "   .env.local에 SUPABASE_SERVICE_ROLE_KEY를 추가하세요.",
  )
  console.error(
    "   (Supabase 대시보드 > Settings > API > service_role > secret)",
  )
  process.exit(1)
}

// service_role 키로 생성한 클라이언트는 RLS를 우회합니다
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function cleanupDatabase() {
  console.log("🗑️  DB 테이블 정리 시작...")

  // 1. creation_cards (FK: library_cards 참조)
  const { error: e1 } = await adminClient.from("creation_cards").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (e1) console.error("  creation_cards 삭제 실패:", e1.message)
  else console.log("  ✅ creation_cards 삭제 완료")

  // 2. library_cards (FK: analyses 참조)
  const { error: e2 } = await adminClient.from("library_cards").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (e2) console.error("  library_cards 삭제 실패:", e2.message)
  else console.log("  ✅ library_cards 삭제 완료")

  // 3. analyses
  const { error: e3 } = await adminClient.from("analyses").delete().neq("id", "00000000-0000-0000-0000-000000000000")
  if (e3) console.error("  analyses 삭제 실패:", e3.message)
  else console.log("  ✅ analyses 삭제 완료")

  // 4. usage_records 카운터 리셋
  const { error: e4 } = await adminClient
    .from("usage_records")
    .update({ analysis_count: 0 })
    .neq("id", "00000000-0000-0000-0000-000000000000")
  if (e4) console.error("  usage_records 리셋 실패:", e4.message)
  else console.log("  ✅ usage_records 카운터 리셋 완료")
}

async function cleanupStorage() {
  console.log("\n🗑️  Storage (frames 버킷) 정리 시작...")

  // 버킷 내 모든 파일 목록 조회 (최대 1000개씩 페이지네이션)
  let offset = 0
  const limit = 100
  let totalDeleted = 0

  while (true) {
    const { data: files, error: listErr } = await adminClient.storage
      .from("frames")
      .list("", { limit, offset, sortBy: { column: "name", order: "asc" } })

    if (listErr) {
      console.error("  파일 목록 조회 실패:", listErr.message)
      break
    }

    if (!files || files.length === 0) break

    // 폴더(prefix)인 경우 내부 파일 삭제
    for (const item of files) {
      if (item.id === null) {
        // 폴더 → 내부 파일 목록 조회
        const { data: innerFiles, error: innerErr } = await adminClient.storage
          .from("frames")
          .list(item.name, { limit: 1000 })

        if (innerErr || !innerFiles) continue

        const innerPaths = innerFiles.map((f) => `${item.name}/${f.name}`)
        if (innerPaths.length > 0) {
          const { error: delErr } = await adminClient.storage
            .from("frames")
            .remove(innerPaths)
          if (delErr) console.error(`  ${item.name}/ 삭제 실패:`, delErr.message)
          else totalDeleted += innerPaths.length
        }
      }
    }

    if (files.length < limit) break
    offset += limit
  }

  console.log(`  ✅ Storage 정리 완료 (총 ${totalDeleted}개 파일 삭제)`)
}

async function main() {
  console.log("=".repeat(50))
  console.log("  DotLink 개발 데이터 초기화 스크립트")
  console.log("=".repeat(50))

  await cleanupDatabase()
  await cleanupStorage()

  console.log("\n✅ 모든 데이터 초기화 완료. 새로 분석을 시작할 수 있습니다.")
}

main().catch((err) => {
  console.error("스크립트 실행 중 오류:", err)
  process.exit(1)
})
