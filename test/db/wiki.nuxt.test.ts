// @vitest-environment nuxt
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createMockWiki } from '../mock';
import {
  getWiki,
  setWiki,
  updateWiki,
  deleteWiki,
  getWikiList,
  getWikiListByAuthorId,
  getWikiByTag,
  checkPublicWikiTitleExists,
  getWikisByIds,
} from "~/server/db/wiki";
import { v4 } from 'uuid';

describe("Wiki DB Integration Tests", () => {
  let createdWikis: string[] = [];

  afterEach(async () => {
    // 각 테스트 후 cleanup if needed
  });

  afterAll(async () => {
    for (const wikiId of createdWikis) {
      await deleteWiki(wikiId);
    }
  });

  it("위키 생성 및 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    createdWikis.push(wiki.id);

    const getResult = await getWiki(wiki.id);
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data.title).toBe('Test Wiki');
      expect(getResult.data.content).toBe('This is test content');
    }

    await cleanUpWiki();
    createdWikis = createdWikis.filter(id => id !== wiki.id);
  });

  it("위키 부분 검색어로 목록 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki({ title: 'Search Test Wiki' });
    createdWikis.push(wiki.id);

    const getResult = await getWikiList({ query: 'Search', limit: 10 });
    expect(getResult.success).toBe(true);
    if (getResult.success) {
      expect(getResult.data.wikis.some((w: any) => w.title === 'Search Test Wiki')).toBe(true);
    }

    await cleanUpWiki();
  });

  it("위키 목록 조회 페이징 테스트", async () => {
    // 간단한 페이징 테스트 - limit 파라미터만 확인
    const firstPage = await getWikiList({ query: '', limit: 2 });
    expect(firstPage.success).toBe(true);
    if (firstPage.success) {
      expect(firstPage.data.wikis.length).toBeLessThanOrEqual(2);
      
      // 두 번째 페이지가 있는 경우에만 테스트
      if (firstPage.data.hasMore && firstPage.data.lastEvaluatedKey) {
        const secondPage = await getWikiList({ query: '', exclusiveStartKey: firstPage.data.lastEvaluatedKey, limit: 2 });
        expect(secondPage.success).toBe(true);
        if (secondPage.success) {
          expect(secondPage.data.wikis.length).toBeLessThanOrEqual(2);
        }
      }
    }
  }, 10000);

  it("위키 수정", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    createdWikis.push(wiki.id);

    const updateResult = await updateWiki(wiki.id, { title: 'Updated Title', content: 'Updated Content' });
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.title).toBe('Updated Title');
      expect(updateResult.data.content).toBe('Updated Content');
    }

    await cleanUpWiki();
  });

  it("위키 삭제", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki();
    createdWikis.push(wiki.id);

    const deleteResult = await deleteWiki(wiki.id);
    expect(deleteResult.success).toBe(true);

    const getResult = await getWiki(wiki.id);
    expect(getResult.success).toBe(false);

    await cleanUpWiki(); // 이미 삭제되었지만 호출
  });

  it("위키 조회 실패 테스트", async () => {
    const nonExistentId = v4();
    const getResult = await getWiki(nonExistentId);
    expect(getResult.success).toBe(false);
    if (!getResult.success) {
      expect(getResult.error.message).toBe("Wiki not found");
    }
  });

  it("작성자 ID로 위키 목록 조회", async () => {
    const { wiki, mockUser, cleanUpWiki } = await createMockWiki();
    createdWikis.push(wiki.id);

    const listResult = await getWikiListByAuthorId(mockUser.id, { limit: 10 });
    expect(listResult.success).toBe(true);
    if (listResult.success) {
      expect(listResult.data.wikis.some((w: any) => w.id === wiki.id)).toBe(true);
    }

    await cleanUpWiki();
  });

  it("태그로 위키 조회", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki({ tags: ['unique-tag'] });
    createdWikis.push(wiki.id);

    const tagResult = await getWikiByTag('unique-tag');
    expect(tagResult.success).toBe(true);
    if (tagResult.success) {
      expect(tagResult.data.wikis.some((w: any) => w.id === wiki.id)).toBe(true);
    }

    await cleanUpWiki();
  });

  it("공개 위키 제목 존재 확인", async () => {
    const { wiki, cleanUpWiki } = await createMockWiki({ title: 'Unique Title' });
    createdWikis.push(wiki.id);

    const exists = await checkPublicWikiTitleExists('Unique Title');
    expect(exists.success).toBe(true);
    if (exists.success) {
      expect(exists.data).toBe(true);
    }

    await cleanUpWiki();
  });

  it("ID 배열로 위키 조회", async () => {
    const { wiki: wiki1, cleanUpWiki: clean1 } = await createMockWiki();
    const { wiki: wiki2, cleanUpWiki: clean2 } = await createMockWiki();
    createdWikis.push(wiki1.id, wiki2.id);

    const idsResult = await getWikisByIds([wiki1.id, wiki2.id]);
    expect(idsResult.success).toBe(true);
    if (idsResult.success) {
      expect(idsResult.data.length).toBe(2);
    }

    await clean1();
    await clean2();
  });
});
