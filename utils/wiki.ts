import { createHash } from "crypto";
import type { ChangeObject } from "diff";
import { diffChars } from "diff";

export function getWikiContentHash(content: string) {
    return createHash("sha256").update(content).digest("hex");
}

export function getWikiContentSize(content: string) {
    return Buffer.byteLength(content, "utf-8");
}

export function getWikiContentLines(content: string) {
    return content.split("\n").length;
}

export function getContentDiff(oldContent: string, newContent: string): {
    diff: ChangeObject<string>[];
    added: number;
    removed: number;
} {
    const diff = diffChars(oldContent, newContent, {
        oneChangePerToken: true
    });
    return {
        diff,
        added: diff.filter((part) => part.added).length,
        removed: diff.filter((part) => part.removed).length,
    }
}

/**
 * diff 객체에서 변경사항이 있는 줄만 필터링하여 반환합니다.
 * 각 줄을 \n으로 분리하여 추가되거나 제거된 부분이 있는 줄만 추출합니다.
 * 
 * @param diff - diffChars로 생성된 변경사항 객체 배열
 * @returns 변경사항이 있는 줄의 ChangeObject 배열
 */
export function getChangedLineFromDiff(
  diff: ChangeObject<string>[]
): { line: number; diff: ChangeObject<string>[] }[] {
  let changedLines: { line: number; diff: ChangeObject<string>[] }[] = [];
  let newChangeObjects: ChangeObject<string>[] = []; // 변경된 줄들을 저장할 배열
  let isLineChanged = false; // 현재 줄에 변경사항이 있는지 확인하는 플래그
  let lineCount = 0; // 현재 줄 번호

  for (const part of diff) {
    // 줄바꿈 문자가 포함되어 있으면 다음 줄로 이동
    if (part.value.includes("\n")) {
      if (isLineChanged) {
        changedLines.push({ line: lineCount, diff: newChangeObjects });
        newChangeObjects = [];
      }
      lineCount++;
      isLineChanged = false; // 새로운 줄이므로 변경 플래그 초기화
    }
    // 현재 part가 추가되거나 제거된 부분인지 확인
    if (part.added || part.removed) {
      isLineChanged = true; // 현재 줄에 변경사항이 있음을 표시
    }
    newChangeObjects.push(part);
  }

  if (isLineChanged) {
    changedLines.push({ line: lineCount, diff: newChangeObjects });
  }

  return changedLines;
}
