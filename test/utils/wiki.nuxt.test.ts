import { describe, expect, test } from "vitest";
import { getContentDiff } from "~/utils/wiki";

describe("위키 유틸 테스트", () => {
    test("과거 내용과 새로운 내용의 차이를 계산 (문자열 단위)", () => {
        const oldContent = "안녕하세요. 이것은 곧 지워질 내용입니다.\n이것은 다음 줄 입니다.";
        const newContent = "안녕하세요. 이것은 지워진 내용입니다.\n이것은 다음 줄 입니다.";
        const diff = getContentDiff(oldContent, newContent);
        expect(diff.added).toEqual(1);
        expect(diff.removed).toEqual(3);
    })

    describe("내용의 문자열에 대해 제거된 부분과 추가된 부분을 표시.", () => {
        test("줄 단위로 차이를 계산", () => {
            const threeLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것은 세 번째 줄입니다.`
            const twoLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.`

            const diff = getContentDiff(threeLineContent, twoLineContent);
            expect(diff.added).toEqual(0);
            expect(diff.removed).toEqual(15);
        })

        test(`한 줄에 여러 문자열이 바뀐 경우`, () => {
            const threeLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것은 세 번째 줄입니다.`
            const twoLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것이 바뀐 세 번째 줄입니다.`

            const diff = getContentDiff(threeLineContent, twoLineContent);
            expect(diff.added).toEqual(4);
            expect(diff.removed).toEqual(1);
        })
    })
    
    test("줄 단위로 차이를 계산", () => {
        const threeLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것은 세 번째 줄입니다.`
        const twoLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.`

        const diff = getContentDiff(threeLineContent, twoLineContent);
        const changedLine = getChangedLineFromDiff(diff.diff);
        expect(changedLine[0].line).toEqual(2);
    })

    test("줄 단위로 차이를 계산. 한 줄에 일부 문자열만 바뀐 경우", () => {
        const threeLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것은 세 번째 줄입니다.`
        const twoLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것이 바뀐 세 번째 줄입니다.`

        const diff = getContentDiff(threeLineContent, twoLineContent);
        const changedLine = getChangedLineFromDiff(diff.diff);
        expect(changedLine[0].line).toEqual(2);

        const addedChars = changedLine[0].diff
          .filter((part) => part.added);

        const removedChars = changedLine[0].diff
          .filter((part) => part.removed);

        expect(addedChars.length).toEqual(4);
        expect(removedChars.length).toEqual(1);
    })

    test("줄 단위로 차이를 계산. 여러 줄에 걸쳐 바뀐 경우", () => {
        const threeLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄입니다.
이것은 세 번째 줄입니다.
이것은 네 번째 줄입니다.
이것은 다섯 번째 줄입니다.`
        const twoLineContent = `이것은 첫 번째 줄입니다.
이것은 두 번째 줄일까요?.
이것이 바뀐 세 번째 줄입니다.
이것은 다섯 번째 줄입니다람쥐.`

        const diff = getContentDiff(threeLineContent, twoLineContent);
        const changedLine = getChangedLineFromDiff(diff.diff);
        expect(changedLine[0].line).toEqual(1);
        expect(changedLine[1].line).toEqual(2);
        expect(changedLine[2].line).toEqual(3);
        expect(changedLine[3].line).toEqual(4);
    })
})