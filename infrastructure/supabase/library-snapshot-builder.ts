/**
 * 라이브러리 스냅샷 빌더
 *
 * 단일 책임: analyses DB row → library_cards INSERT 객체 변환
 *
 * 이 파일이 스냅샷의 유일한 생성 경로입니다.
 * analyses에 새 컬럼이 추가될 때 이 파일 한 곳만 수정하면
 * 스냅샷 누락 위험이 없습니다.
 */

export interface AnalysisDbRow {
  id:                  string
  user_id:             string
  url:                 string
  platform:            string
  title:               string | null
  thumbnail_url:       string | null
  posted_at:           string | null
  caption:             string | null
  script:              string | null
  hooking:             string | null
  content_type:        string | null
  production:          string | null
  selling_point:       string | null
  difficulty:          Record<string, unknown> | null
  engagement_analysis: string | null
  like_count:          number | null
  view_count:          number | null
  comment_count:       number | null
  frames:              unknown[] | null
}

export interface LibraryCardInsert {
  user_id:             string
  analysis_id:         string
  title:               string
  platform:            string
  url:                 string
  thumbnail_url:       string | null
  posted_at:           string | null
  caption:             string | null
  script:              string | null
  hooking:             string | null
  content_type:        string | null
  production:          string | null
  selling_point:       string | null
  difficulty:          Record<string, unknown> | null
  engagement_analysis: string | null
  like_count:          number | null
  view_count:          number | null
  comment_count:       number | null
  frames:              unknown[]
}

/**
 * analyses 레코드를 library_cards INSERT 객체로 변환합니다.
 * 순수 함수: 사이드이펙트 없음.
 */
export function buildLibrarySnapshot(
  userId: string,
  analysis: AnalysisDbRow,
): LibraryCardInsert {
  return {
    user_id:             userId,
    analysis_id:         analysis.id,
    title:               analysis.title ?? `${analysis.platform} 콘텐츠`,
    platform:            analysis.platform,
    url:                 analysis.url,
    thumbnail_url:       analysis.thumbnail_url ?? null,
    posted_at:           analysis.posted_at     ?? null,
    caption:             analysis.caption       ?? null,
    script:              analysis.script        ?? null,
    hooking:             analysis.hooking       ?? null,
    content_type:        analysis.content_type  ?? null,
    production:          analysis.production    ?? null,
    selling_point:       analysis.selling_point ?? null,
    difficulty:          analysis.difficulty    ?? null,
    engagement_analysis: analysis.engagement_analysis ?? null,
    like_count:          analysis.like_count    ?? null,
    view_count:          analysis.view_count    ?? null,
    comment_count:       analysis.comment_count ?? null,
    frames:              analysis.frames        ?? [],
  }
}
