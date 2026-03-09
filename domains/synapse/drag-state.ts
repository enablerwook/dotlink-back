/**
 * 드래그 앤 드롭 모듈 레벨 상태
 *
 * 단일 책임: 드래그 중인 프레임 데이터를 drag source ↔ drop target 간 공유
 *
 * Chrome은 custom MIME type 데이터를 native addEventListener 의 drop 컨텍스트에서
 * dataTransfer.getData()로 읽지 못하게 막음 (보안 정책).
 * 모듈 변수를 통해 이 제한을 완전히 우회한다.
 */

import type { DroppedFrame } from "@/domains/synapse/types"

let _activeDragFrame: DroppedFrame | null = null

export function setActiveDragFrame(frame: DroppedFrame | null): void {
  _activeDragFrame = frame
}

export function getActiveDragFrame(): DroppedFrame | null {
  return _activeDragFrame
}
