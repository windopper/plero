// @vitest-environment nuxt
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createMockWikiContributor } from "../mock";
import { 
  deleteWikiContributor, 
  getWikiContributor, 
  setWikiContributor, 
  updateWikiContributor 
} from "~/server/db/wikiContributor";
import { v4 } from "uuid";

describe("Wiki Contributor DB Integration Tests", () => {
  let createdContributors: string[] = [];

  afterEach(async () => {
    // 각 테스트 후 cleanup if needed
  });

  afterAll(async () => {
    // 전역 cleanup은 각 테스트의 cleanUpWikiContributor 함수에서 처리
  });

  it("위키 기여자 생성 및 조회", async () => {
    const { contributorData, cleanUpWikiContributor } = await createMockWikiContributor();
    const testStartTime = Date.now();

    const setResult = await setWikiContributor(contributorData);
    expect(setResult.success).toBe(true);
    if (setResult.success) {
      expect(setResult.data.contributorId).toBe(contributorData.contributorId);
      expect(setResult.data.contributorEmail).toBe(contributorData.contributorEmail);
      expect(setResult.data.contributorName).toBe(contributorData.contributorName);
      expect(setResult.data.contributedAt.getTime()).toBeGreaterThanOrEqual(testStartTime);
      expect(setResult.data.linesAdded).toBe(0);
      expect(setResult.data.linesRemoved).toBe(0);
      
      const getResult = await getWikiContributor(setResult.data.id);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.id).toBe(setResult.data.id);
      }

      await cleanUpWikiContributor(setResult.data.id);
    } else {
      await cleanUpWikiContributor();
    }
  });

  it("위키 기여자 수정", async () => {
    const { contributorData, cleanUpWikiContributor } = await createMockWikiContributor();

    const setResult = await setWikiContributor(contributorData);
    expect(setResult.success).toBe(true);
    if (setResult.success) {
      const updateResult = await updateWikiContributor(setResult.data.id, { 
        linesAdded: 10, 
        linesRemoved: 5 
      });
      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data.linesAdded).toBe(10);
        expect(updateResult.data.linesRemoved).toBe(5);
      }

      await cleanUpWikiContributor(setResult.data.id);
    } else {
      await cleanUpWikiContributor();
    }
  });

  it("위키 기여자 삭제", async () => {
    const { contributorData, cleanUpWikiContributor } = await createMockWikiContributor();

    const setResult = await setWikiContributor(contributorData);
    expect(setResult.success).toBe(true);
    if (setResult.success) {
      const deleteResult = await deleteWikiContributor(setResult.data.id);
      expect(deleteResult.success).toBe(true);
      
      const getResult = await getWikiContributor(setResult.data.id);
      expect(getResult.success).toBe(false);

      await cleanUpWikiContributor(); // 이미 삭제되었지만 호출
    } else {
      await cleanUpWikiContributor();
    }
  });

  it("존재하지 않는 기여자 작업 처리", async () => {
    const nonExistentId = v4();

    const getResult = await getWikiContributor(nonExistentId);
    expect(getResult.success).toBe(false);

    const updateResult = await updateWikiContributor(nonExistentId, { linesAdded: 1 });
    expect(updateResult.success).toBe(false);

    const deleteResult = await deleteWikiContributor(nonExistentId);
    expect(deleteResult.success).toBe(false);
  });
});