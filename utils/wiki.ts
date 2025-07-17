import createHash from "create-hash";
import type { ChangeObject } from "diff";
import { diffChars, diffLines } from "diff";
import Merge from "diff3";

export function getWikiContentHash(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export function getWikiContentSize(content: string) {
  return Buffer.byteLength(content, "utf-8");
}

export function getWikiContentLines(content: string) {
  return content.split("\n").length;
}

export function getContentDiff(
  oldContent: string,
  newContent: string
): {
  diff: ChangeObject<string>[];
  added: number;
  removed: number;
} {
  const diff = diffChars(oldContent, newContent, {
    oneChangePerToken: true,
  });
  return {
    diff,
    added: diff.filter((part) => part.added).length,
    removed: diff.filter((part) => part.removed).length,
  };
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

interface CanMergeWikiParams {
  title: string;
  tags: string[];
  content: string;
}
export function canMergeWiki(
  masterWiki: CanMergeWikiParams,
  myWiki: CanMergeWikiParams,
  preoccupied: CanMergeWikiParams
): boolean {
  // 1. Check for title conflict
  const myTitleChanged = masterWiki.title !== myWiki.title;
  const preoccupiedTitleChanged = masterWiki.title !== preoccupied.title;

  if (
    myTitleChanged &&
    preoccupiedTitleChanged &&
    myWiki.title !== preoccupied.title
  ) {
    return false;
  }

  // 2. Check for tags conflict
  const masterTags = JSON.stringify(masterWiki.tags.sort());
  const myTags = JSON.stringify(myWiki.tags.sort());
  const preoccupiedTags = JSON.stringify(preoccupied.tags.sort());

  const myTagsChanged = masterTags !== myTags;
  const preoccupiedTagsChanged = masterTags !== preoccupiedTags;

  if (myTagsChanged && preoccupiedTagsChanged && myTags !== preoccupiedTags) {
    return false;
  }


  const masterLines = masterWiki.content.split("\n");
  const myLines = myWiki.content.split("\n");
  const preoccupiedLines = preoccupied.content.split("\n");
  const mergeResult = Merge(myLines, masterLines, preoccupiedLines);

  const mergedContentLines: string[] = [];
  let conflict = false;

  for (const item of mergeResult) {
    if (item.ok) {
      mergedContentLines.push(...item.ok);
    }
    if (item.conflict) {
      // Special case: Handle deletion vs modification conflicts
      // If one side deleted (empty array) and the other modified,
      // we don't consider this a real conflict
      const { a: myChanges, o: original, b: theirChanges } = item.conflict;
      
      if (myChanges.length === 0 && theirChanges.length > 0) {
        // I deleted, they modified -> not a conflict
      } else if (theirChanges.length === 0 && myChanges.length > 0) {
        // They deleted, I modified -> not a conflict
      } else if (myChanges.length === 0 && theirChanges.length === 0) {
        // Both deleted -> not a conflict
      } else {
        // Real conflict: both modified to different values
        conflict = true;
      }
    }
  }

  if (conflict) {
    return false;
  }

  return true;
}

export function mergeWiki(
  masterWiki: CanMergeWikiParams,
  myWiki: CanMergeWikiParams,
  preoccupied: CanMergeWikiParams
): CanMergeWikiParams {
  // 1. Merge Title
  let mergedTitle = masterWiki.title;
  const myTitleChanged = masterWiki.title !== myWiki.title;
  const preoccupiedTitleChanged = masterWiki.title !== preoccupied.title;

  if (myTitleChanged && !preoccupiedTitleChanged) {
    mergedTitle = myWiki.title;
  } else if (!myTitleChanged && preoccupiedTitleChanged) {
    mergedTitle = preoccupied.title;
  } else if (myTitleChanged && preoccupiedTitleChanged) {
    // Both changed to the same title, which is not a conflict.
    mergedTitle = myWiki.title;
  }

  // 2. Merge Tags
  const masterTagsSet = new Set(masterWiki.tags);
  const myTagsSet = new Set(myWiki.tags);
  const preoccupiedTagsSet = new Set(preoccupied.tags);

  const mergedTagsSet = new Set(masterWiki.tags);

  myWiki.tags.forEach((tag) => {
    if (!masterTagsSet.has(tag)) {
      mergedTagsSet.add(tag);
    }
  });
  preoccupied.tags.forEach((tag) => {
    if (!masterTagsSet.has(tag)) {
      mergedTagsSet.add(tag);
    }
  });

  masterWiki.tags.forEach((tag) => {
    if (!myTagsSet.has(tag) && !preoccupiedTagsSet.has(tag)) {
      // If both removed the tag, it stays removed.
    } else if (!myTagsSet.has(tag)) {
      mergedTagsSet.delete(tag);
    } else if (!preoccupiedTagsSet.has(tag)) {
      mergedTagsSet.delete(tag);
    }
  });

  // 3. Merge Content using diff3
  const masterLines = masterWiki.content.split("\n");
  const myLines = myWiki.content.split("\n");
  const preoccupiedLines = preoccupied.content.split("\n");

  const mergeResult = Merge(myLines, masterLines, preoccupiedLines);

  const mergedContentLines: string[] = [];
  let conflict = false;
  let conflictLines: { line: number; conflict: string[] }[] = [];

  for (const item of mergeResult) {
    if (item.ok) {
      mergedContentLines.push(...item.ok);
    }
    if (item.conflict) {
      // Special case: Handle deletion vs modification conflicts
      // If one side deleted (empty array) and the other modified,
      // we consider this as the modifier's intention taking precedence
      const { a: myChanges, o: original, b: theirChanges } = item.conflict;
      
      if (myChanges.length === 0 && theirChanges.length > 0) {
        // I deleted, they modified -> apply their modification (deletion intention with modification)
        mergedContentLines.push(...theirChanges);
      } else if (theirChanges.length === 0 && myChanges.length > 0) {
        // They deleted, I modified -> apply my modification (deletion intention with modification)
        mergedContentLines.push(...myChanges);
      } else if (myChanges.length === 0 && theirChanges.length === 0) {
        // Both deleted -> keep deleted (add nothing)
      } else {
        // Real conflict: both modified to different values
        conflict = true;
        mergedContentLines.push(...myChanges);
      }
    }
  }

  if (conflict) {
    throw new Error();
  }



  return {
    title: mergedTitle,
    tags: Array.from(mergedTagsSet).sort(),
    content: mergedContentLines.join("\n"),
  };
}