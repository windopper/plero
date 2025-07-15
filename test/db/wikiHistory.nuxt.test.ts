// @vitest-environment nuxt
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { createMockWikiHistory } from '../mock';
import { 
  deleteWikiHistory, 
  getWikiHistoriesByUserId, 
  getWikiHistory, 
  setWikiHistory, 
  updateWikiHistory 
} from '~/server/db/wikiHistory';
import { v4 } from 'uuid';

describe("Wiki History DB Integration Tests", () => {
  let createdHistories: string[] = [];

  afterEach(async () => {
    // 각 테스트 후 cleanup if needed
  });

  afterAll(async () => {
    // 전역 cleanup은 각 테스트의 cleanUpWikiHistory 함수에서 처리
  });

  it("위키 기록 생성 및 조회", async () => {
    const { historyData, cleanUpWikiHistory } = await createMockWikiHistory();

    const setResult = await setWikiHistory(historyData);
    expect(setResult.success).toBe(true);
    
    if (setResult.success) {
      const getResult = await getWikiHistory(setResult.data.id);
      expect(getResult.success).toBe(true);
      if (getResult.success) {
        expect(getResult.data.title).toBe('Test Wiki History');
        expect(getResult.data.content).toBe('Test content');
        expect(getResult.data.changeMessage).toBe('Initial creation');
        expect(getResult.data.changeType).toBe('create');
      }

      await cleanUpWikiHistory(setResult.data.id);
    } else {
      await cleanUpWikiHistory();
    }
  });

  it("유저 ID로 위키 기록 조회", async () => {
    const { historyData, mockUser, cleanUpWikiHistory } = await createMockWikiHistory();
    
    const setResult = await setWikiHistory(historyData);
    expect(setResult.success).toBe(true);
    if (!setResult.success) {
      await cleanUpWikiHistory();
      return;
    }

    const getResult = await getWikiHistoriesByUserId({ 
      userId: mockUser.id, 
      limit: 10, 
      sort: 'desc' 
    });
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data.histories.length).toBeGreaterThanOrEqual(1);
      expect(getResult.data.histories.some(h => h.id === setResult.data.id)).toBe(true);
    }

    await cleanUpWikiHistory(setResult.data.id);
  });

  it("위키 기록 수정", async () => {
    const { historyData, cleanUpWikiHistory } = await createMockWikiHistory();

    const setResult = await setWikiHistory(historyData);
    expect(setResult.success).toBe(true);
    if (!setResult.success) {
      await cleanUpWikiHistory();
      return;
    }

    const updateResult = await updateWikiHistory(setResult.data.id, { 
      changeMessage: 'Updated message',
      isMinor: true
    });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.changeMessage).toBe('Updated message');
      expect(updateResult.data.isMinor).toBe(true);
    }

    await cleanUpWikiHistory(setResult.data.id);
  });

  it("위키 기록 삭제", async () => {
    const { historyData, cleanUpWikiHistory } = await createMockWikiHistory();

    const setResult = await setWikiHistory(historyData);
    expect(setResult.success).toBe(true);
    
    if (setResult.success) {
      const deleteResult = await deleteWikiHistory(setResult.data.id);
      expect(deleteResult.success).toBe(true);

      const getResult = await getWikiHistory(setResult.data.id);
      expect(getResult.success).toBe(false);

      await cleanUpWikiHistory(); // 이미 삭제되었지만 호출
    } else {
      await cleanUpWikiHistory();
    }
  });

  it("존재하지 않는 기록 작업 처리", async () => {
    const nonExistentId = v4();

    const getResult = await getWikiHistory(nonExistentId);
    expect(getResult.success).toBe(false);

    const updateResult = await updateWikiHistory(nonExistentId, { 
      changeMessage: 'Updated' 
    });
    expect(updateResult.success).toBe(false);

    const deleteResult = await deleteWikiHistory(nonExistentId);
    expect(deleteResult.success).toBe(false);
  });
});
