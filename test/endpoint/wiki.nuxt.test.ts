import { describe, it, expect, vi, afterAll } from 'vitest'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { getMockUser } from '../mock'
import { deleteWiki } from '~/server/db/wiki'
import { _permanantDeleteWikiService } from '~/server/service/wiki'

describe('Wiki API 엔드포인트 테스트', async () => {
    await setup({
        server: true,
    })

    let shouldDeleteWikiList: string[] = []

    const cleanUp = async () => {
        for (const wikiId of shouldDeleteWikiList) {
            await _permanantDeleteWikiService(wikiId)
        }
    }

    afterAll(async () => {
        await cleanUp()
    })

  describe("GET /api/wiki/:id", () => {
    it("위키를 조회", async () => {
      // 먼저 위키를 생성
      const wikiData = {
        title: "테스트 위키",
        content: "테스트 위키 내용입니다.",
      };

      const createResponse = await $fetch("/api/wiki", {
        method: "POST",
        body: wikiData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(createResponse.success).toBe(true);
      const wikiId = createResponse.data.wiki.id;
      shouldDeleteWikiList.push(wikiId);

      // 생성된 위키를 조회
      const response = await $fetch(`/api/wiki/${wikiId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('title', wikiData.title);
      expect(response.data).toHaveProperty('content', wikiData.content);
      expect(response.data).toHaveProperty('id', wikiId);
    });

    it("위키가 없을 때 404 에러를 반환해야 함", async () => {
      await expect($fetch("/api/wiki/nonexistent-id", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: "Wiki not found"
      })
    })
  });

  describe('POST /api/wiki', () => {
    it('유효한 데이터로 위키를 생성', async () => {
      const wikiData = {
        title: '테스트 위키',
        content: '테스트 위키 내용입니다.'
      }

      const response = await $fetch('/api/wiki', {
        method: 'POST',
        body: wikiData,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // 성공한 경우 응답 구조 검증
      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('data')
      expect(response.data).toHaveProperty('wiki')
      expect(response.data).toHaveProperty('history')
      expect(response.data).toHaveProperty('contributor')
      expect(response.data.wiki).toHaveProperty('title', wikiData.title)
      expect(response.data.wiki).toHaveProperty('content', wikiData.content)
      shouldDeleteWikiList.push(response.data.wiki.id)
    })

    it('제목이 없을 때 400 에러를 반환해야 함', async () => {
      const wikiData = {
        content: '테스트 위키 내용입니다.'
      }

      await expect($fetch('/api/wiki', {
        method: 'POST',
        body: wikiData,
        headers: {
          'Content-Type': 'application/json'
        }
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid request'
      })
    })

    it('내용이 없을 때 400 에러를 반환해야 함', async () => {
      const wikiData = {
        title: '테스트 위키'
      }

      await expect($fetch('/api/wiki', {
        method: 'POST',
        body: wikiData,
        headers: {
          'Content-Type': 'application/json'
        }
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid request'
        })
      
    })

    it('제목과 내용이 모두 없을 때 400 에러를 반환해야 함', async () => {
      const wikiData = {}

      await expect($fetch('/api/wiki', {
        method: 'POST',
        body: wikiData,
        headers: {
          'Content-Type': 'application/json'
        }
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid request'
        })
      
    })

    it('빈 문자열 제목으로 요청 시 400 에러를 반환해야 함', async () => {
      const wikiData = {
        title: '',
        content: '테스트 위키 내용입니다.'
      }

      await expect($fetch('/api/wiki', {
        method: 'POST',
        body: wikiData,
        headers: {
          'Content-Type': 'application/json'
        }
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid request'
        })
      
    })

    it('빈 문자열 내용으로 요청 시 400 에러를 반환해야 함', async () => {
      const wikiData = {
        title: '테스트 위키',
        content: ''
      }

      await expect($fetch('/api/wiki', {
          method: 'POST',
          body: wikiData,
          headers: {
            'Content-Type': 'application/json'
          }
        })).rejects.toMatchObject({
          statusCode: 400,
          statusMessage: 'Invalid request'
        })
      
    })
  })

  describe("DELETE /api/wiki/:id", () => {
    it("위키를 삭제", async () => {
      const wikiData = {
        title: "테스트 위키",
        content: "테스트 위키 내용입니다.",
      };

      const createResponse = await $fetch("/api/wiki", {
        method: "POST",
        body: wikiData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      shouldDeleteWikiList.push(createResponse.data.wiki.id)
      expect(createResponse.success).toBe(true);

      const deleteResponse = await $fetch(`/api/wiki/${createResponse.data.wiki.id}`, {
        method: 'DELETE' as any
      });

      expect(deleteResponse.success).toBe(true);
    })
  })

  describe("PATCH /api/wiki/:id", () => {
    it("위키를 수정", async () => {
      const wikiData = {
        title: "테스트 위키",
        content: "테스트 위키 내용입니다.",
      };

      const createResponse = await $fetch("/api/wiki", {
        method: "POST",
        body: wikiData,
        headers: {
          "Content-Type": "application/json",
        },
      });
      shouldDeleteWikiList.push(createResponse.data.wiki.id)

      const wikiUpdateData = {
        title: "테스트 위키 수정",
        content: "테스트 위키 내용입니다. 수정되었습니다.",
        updateMessage: "테스트 위키 수정 메시지입니다.",
      };

      const updateResponse = await $fetch(`/api/wiki/${createResponse.data.wiki.id}`, {
        method: 'PATCH' as any,
        body: wikiUpdateData,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data).toHaveProperty('title', wikiUpdateData.title)
      expect(updateResponse.data).toHaveProperty('content', wikiUpdateData.content)
      expect(updateResponse.data).toHaveProperty('updateMessage', wikiUpdateData.updateMessage)
    })

    it("위키 수정 시에 제목, 내용, 수정 메시지가 없을 때 400 에러를 반환해야 함", async () => {
      const wikiData = {
        title: "테스트 위키",
        content: "테스트 위키 내용입니다.",
      };

      await expect($fetch("/api/wiki/nonexistent-id", {
        method: "PATCH" as any,
        body: wikiData,
        headers: {
          "Content-Type": "application/json",
        },
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Invalid request'
      })
    })
  })
})
