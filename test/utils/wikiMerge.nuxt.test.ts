import { describe, test, expect } from "vitest";
import { canMergeWiki, mergeWiki } from "~/utils/wiki";

describe("위키 병합 가능 테스트", () => {
    const masterWiki = {
        title: "Master Title",
        tags: ["tag1", "tag2"],
        content: "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
    };

    test("변경 사항 없음: 병합 가능", () => {
        const myWiki = { ...masterWiki };
        const preoccupiedWiki = { ...masterWiki };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("나만 내용 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki, content: "Line 1\nNew Line 2\nLine 3\nLine 4\nLine 5" };
        const preoccupiedWiki = { ...masterWiki };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("다른 사용자만 내용 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki };
        const preoccupiedWiki = { ...masterWiki, content: "Line 1\nNew Line 2 preoccupied\nLine 3\nLine 4\nLine 5" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("서로 다른 라인 내용 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki, content: "New Line 1\nLine 2\nLine 3\nLine 4\nLine 5" };
        const preoccupiedWiki = { ...masterWiki, content: "Line 1\nLine 2\nLine 3\nNew Line 4\nLine 5" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("서로 다른 라인 내용 수정2: 병합 가능", () => {
        const newMasterWiki = { ...masterWiki, content: "b\na\na" };
        const myWiki = { ...newMasterWiki, content: "b\na\nc" };
        const preoccupiedWiki = { ...newMasterWiki, content: "d\na\na" };
        expect(canMergeWiki(newMasterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("동일 라인 내용 수정 (충돌): 병합 불가능", () => {
        const myWiki = { ...masterWiki, content: "New Line 1\nLine 2\nLine 3\nLine 4\nLine 5" };
        const preoccupiedWiki = { ...masterWiki, content: "Preoccupied Line 1\nLine 2\nLine 3\nLine 4\nLine 5" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(false);
    });

    test("나만 제목 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki, title: "My New Title" };
        const preoccupiedWiki = { ...masterWiki };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("다른 사용자만 제목 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki };
        const preoccupiedWiki = { ...masterWiki, title: "Preoccupied New Title" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("서로 다른 제목으로 수정 (충돌): 병합 불가능", () => {
        const myWiki = { ...masterWiki, title: "My New Title" };
        const preoccupiedWiki = { ...masterWiki, title: "Preoccupied New Title" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(false);
    });
    
    test("나만 태그 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "new-tag"] };
        const preoccupiedWiki = { ...masterWiki };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("다른 사용자만 태그 수정: 병합 가능", () => {
        const myWiki = { ...masterWiki };
        const preoccupiedWiki = { ...masterWiki, tags: ["tag1", "preoccupied-tag"] };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("서로 다른 태그로 수정 (충돌): 병합 불가능", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "new-tag"] };
        const preoccupiedWiki = { ...masterWiki, tags: ["tag1", "preoccupied-tag"] };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(false);
    });

    test("복합: 나와 다른 사용자가 각각 제목과 내용을 수정 (충돌 없음): 병합 가능", () => {
        const myWiki = { ...masterWiki, title: "My New Title" };
        const preoccupiedWiki = { ...masterWiki, content: "Line 1\nLine 2\nNew Line 3\nLine 4\nLine 5" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });
    
    test("복합: 나와 다른 사용자가 각각 태그와 내용을 다른 라인에 수정 (충돌 없음): 병합 가능", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "new-tag"] };
        const preoccupiedWiki = { ...masterWiki, content: "Line 1\nLine 2\nNew Line 3\nLine 4\nLine 5" };
        expect(canMergeWiki(masterWiki, myWiki, preoccupiedWiki)).toBe(true);
    });

    test("복합: 나와 다른 사용자가 각각 제목과 내용을 같은 라인에 수정 (내용 충돌): 병합 불가능", () => {
        const myFinalWiki = { ...masterWiki, content: "My Version of Line 1\nLine 2\nLine 3\nLine 4\nLine 5" };
        const preoccupiedFinalWiki = { ...masterWiki, content: "Preoccupied Version of Line 1\nLine 2\nLine 3\nLine 4\nLine 5" };

        expect(canMergeWiki(masterWiki, myFinalWiki, preoccupiedFinalWiki)).toBe(false);
    });
});

describe("위키 병합 테스트", () => {
    const masterWiki = {
        title: "Master Title",
        tags: ["tag1", "tag2"],
        content: "Line 1\nLine 2\nLine 3"
    };

    test("나만 제목 수정 시 병합", () => {
        const myWiki = { ...masterWiki, title: "My New Title" };
        const preoccupiedWiki = { ...masterWiki };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.title).toBe("My New Title");
    });

    test("다른 사용자만 제목 수정 시 병합", () => {
        const myWiki = { ...masterWiki };
        const preoccupiedWiki = { ...masterWiki, title: "Preoccupied New Title" };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.title).toBe("Preoccupied New Title");
    });

    test("둘 다 같은 제목으로 수정 시 병합", () => {
        const myWiki = { ...masterWiki, title: "Same New Title" };
        const preoccupiedWiki = { ...masterWiki, title: "Same New Title" };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.title).toBe("Same New Title");
    });

    test("나만 태그 추가 시 병합", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "tag2", "tag3"] };
        const preoccupiedWiki = { ...masterWiki };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.tags).toEqual(["tag1", "tag2", "tag3"]);
    });

    test("서로 다른 태그 추가 시 병합", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "tag2", "tag3"] };
        const preoccupiedWiki = { ...masterWiki, tags: ["tag1", "tag2", "tag4"] };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.tags).toEqual(["tag1", "tag2", "tag3", "tag4"]);
    });

    test("한쪽은 태그 추가, 다른 쪽은 태그 삭제 시 병합", () => {
        const myWiki = { ...masterWiki, tags: ["tag1", "tag2", "tag3"] };
        const preoccupiedWiki = { ...masterWiki, tags: ["tag1"] };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.tags).toEqual(["tag1", "tag3"]);
    });

    test("서로 다른 라인의 내용을 수정했을 때 병합", () => {
        const myWiki = { ...masterWiki, content: "My Line 1\nLine 2\nLine 3" };
        const preoccupiedWiki = { ...masterWiki, content: "Line 1\nLine 2\nPreoccupied Line 3" };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("My Line 1\nLine 2\nPreoccupied Line 3");
    });

    test("한쪽에서 내용 추가 시 병합", () => {
        const myWiki = { ...masterWiki, content: "Line 1\nLine 2\nLine 3\nMy New Line 4" };
        const preoccupiedWiki = { ...masterWiki };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("Line 1\nLine 2\nLine 3\nMy New Line 4");
    });

    test("한쪽에서 내용 삭제 시 병합", () => {
        const myWiki = { ...masterWiki, content: "Line 1\nLine 3" };
        const preoccupiedWiki = { ...masterWiki };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("Line 1\nLine 3");
    });

    test("복합: 제목, 태그, 내용 모두 비충돌 변경 시 병합", () => {
        const myWiki = {
            title: "My New Title",
            tags: ["tag1", "tag2", "my-tag"],
            content: "My Line 1\nLine 2\nLine 3"
        };
        const preoccupiedWiki = {
            title: masterWiki.title, // No change
            tags: ["tag1", "preoccupied-tag"],
            content: "Line 1\nLine 2\nPreoccupied Line 3"
        };
        const merged = mergeWiki(masterWiki, myWiki, preoccupiedWiki);
        expect(merged.title).toBe("My New Title");
        expect(merged.tags).toEqual(["my-tag", "preoccupied-tag", "tag1"]);
        expect(merged.content).toBe("My Line 1\nLine 2\nPreoccupied Line 3");
    });

    test("서로 다른 라인 내용 수정2: 병합", () => {
        const newMasterWiki = { ...masterWiki, content: "b\na\na" };
        const myWiki = { ...newMasterWiki, content: "b\na\nc" };
        const preoccupiedWiki = { ...newMasterWiki, content: "d\na\na" };
        const merged = mergeWiki(newMasterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("d\na\nc");
    });

    test("서로 다른 라인 내용 수정3: 병합", () => {
        const newMasterWiki = { ...masterWiki, content: "b\na\na" };
        const myWiki = { ...newMasterWiki, content: "d\na\nc" };
        const preoccupiedWiki = { ...newMasterWiki, content: "d\na\na" };
        const merged = mergeWiki(newMasterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("d\na\nc");
    });

    test("라인 삭제: 병합", () => {
        const newMasterWiki = { ...masterWiki, content: "b\na\na" };
        const myWiki = { ...newMasterWiki, content: "b\na" };
        const preoccupiedWiki = { ...newMasterWiki, content: "b\na\nc" };
        const merged = mergeWiki(newMasterWiki, myWiki, preoccupiedWiki);
        expect(merged.content).toBe("b\na\nc");
    });
});

