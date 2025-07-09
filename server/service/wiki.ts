import { deleteWiki, getWiki, setWiki, updateWiki } from "../db/wiki";
import { User, Wiki, WikiContributor, WikiHistory } from "../db/schema";
import { deleteWikiHistoriesByWikiId, deleteWikiHistory, setWikiHistory } from "../db/wikiHistory";
import { getWikiContentHash, getWikiContentSize } from "../../utils/wiki";
import { deleteWikiContributor, deleteWikiContributorsByWikiId, getWikiContributor, getWikiContributorsByWikiId, setWikiContributor, updateWikiContributor } from "../db/wikiContributor";
import type { DbResult } from "../type";

export type WikiCreate = { title: string, content: string, author: User };
export type WikiUpdate = { title: string, content: string, updateMessage: string, author: User };
export type WikiDelete = { deleteMessage: string, author: User };

export async function createWikiService(
  data: WikiCreate,
): Promise<
  DbResult<{
    wiki: Wiki;
    history: WikiHistory;
    contributor: WikiContributor;
  }>
> {
  // 1. 위키 생성
  const wikiData: Omit<Wiki, "id"> = {
    title: data.title,
    content: data.content,
    authorId: data.author.id,
    authorName: data.author.name,
    authorEmail: data.author.email,
    lastEditor: data.author.id,
    lastEditorName: data.author.name,
    lastEditorEmail: data.author.email,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPublished: false,
    tags: [],
    version: 1,
  };
  const setResult = await setWiki(wikiData);
  if (!setResult.success) {
    return setResult;
  }
  const wikiId = setResult.data.id;
  const wiki = setResult.data;

  // 2. 위키 생성 이력 생성
  const historyData: Omit<WikiHistory, "id"> = {
    wikiId: wikiId,
    changedAt: Date.now(),
    changeMessage: "새 위키 생성",
    changeType: "create",
    title: data.title,
    content: data.content,
    version: 1,
    tags: [],
    changedBy: data.author.id,
    changedByName: data.author.name,
    changedByEmail: data.author.email,
    previousVersion: 0,
    parentVersions: [],
    contentSize: getWikiContentSize(data.content),
    contentHash: getWikiContentHash(data.content),
    isMinor: false,
  };
  const setHistoryResult = await setWikiHistory(historyData);
  if (!setHistoryResult.success) {
    return setHistoryResult;
  }
  const history = setHistoryResult.data;

  // 3. 위키 참여자 추가
  const contributorData: Omit<WikiContributor, "id"> = {
    wikiId: wikiId,
    contributorId: data.author.id,
    contributorName: data.author.name,
    contributorEmail: data.author.email,
    contributedAt: Date.now(),
    linesAdded: 0,
    linesRemoved: 0,
  };
  const setContributorResult = await setWikiContributor(contributorData);
  if (!setContributorResult.success) {
    return setContributorResult;
  }
  const contributor = setContributorResult.data;

  return {
    success: true,
    data: {
      wiki,
      history,
      contributor,
    },
  };
}

export async function updateWikiService(wikiId: string, data: WikiUpdate): Promise<DbResult<{
    wiki: Wiki;
    history: WikiHistory;
    contributor: WikiContributor;
}>> {

    // 기존 위키 조회
    const getWikiResult = await getWiki(wikiId);
    if (!getWikiResult.success) {
        return getWikiResult;
    }
    const previousWiki = getWikiResult.data;

    // 1. 위키 업데이트
    const updateWikiResult = await updateWiki(wikiId, {
        title: data.title,
        content: data.content,
        updatedAt: Date.now(),
        version: previousWiki.version + 1,
        lastEditor: data.author.id,
        lastEditorName: data.author.name,
        lastEditorEmail: data.author.email,
    });
    if (!updateWikiResult.success) {
        return updateWikiResult;
    }
    const updatedWiki = updateWikiResult.data;

    // 2. 위키 업데이트 이력 생성
    const historyData: Omit<WikiHistory, "id"> = {
        wikiId: wikiId,
        changedAt: Date.now(),
        changeMessage: data.updateMessage,
        changeType: "edit",
        title: data.title,
        content: data.content,
        version: updatedWiki.version,
        tags: updatedWiki.tags,
        changedBy: data.author.id,
        changedByName: data.author.name,
        changedByEmail: data.author.email,
        previousVersion: previousWiki.version,
        parentVersions: [previousWiki.version],
        contentSize: getWikiContentSize(data.content),
        contentHash: getWikiContentHash(data.content),
        isMinor: false,
    };
    const setHistoryResult = await setWikiHistory(historyData);
    if (!setHistoryResult.success) {
        return setHistoryResult;
    }
    const history = setHistoryResult.data;

    // 3. 위키 참여자 업데이트
    // 참여한 사람인지 확인
    const getContributorResult = await getWikiContributorsByWikiId(wikiId);
    if (!getContributorResult.success) {
        return getContributorResult;
    }
    const contributors = getContributorResult.data;
    let contributor = contributors.find((contributor) => contributor.contributorId === data.author.id);
    if (!contributor) {
        // 존재하지 않으면 추가
        const setContributorResult = await setWikiContributor({
            wikiId: wikiId,
            contributorId: data.author.id,
            contributorName: data.author.name,
            contributorEmail: data.author.email,
            contributedAt: Date.now(),
            linesAdded: 0,
            linesRemoved: 0,
        });
        if (!setContributorResult.success) {
            return setContributorResult;
        }
        contributor = setContributorResult.data;
    }

    // 4. 위키 참여자 업데이트
    // TODO linesAdded, linesRemoved 계산 방법 수정 필요
    const updateContributorResult = await updateWikiContributor(contributor.id, {
        contributedAt: Date.now(),
        linesAdded: getWikiContentSize(data.content) - getWikiContentSize(previousWiki.content),
        linesRemoved: getWikiContentSize(previousWiki.content) - getWikiContentSize(data.content),
    });
    if (!updateContributorResult.success) {
        return updateContributorResult;
    }
    const updatedContributor = updateContributorResult.data;

    return {
        success: true,
        data: {
            wiki: updatedWiki,
            history: history,
            contributor: updatedContributor,
        },
    };
} 

/**
 * 위키 삭제
 * 위키 삭제 시 위키 내용은 삭제되지 않고 버전 관리만 됨
 * 
 * @param wikiId 위키 ID
 * @returns 성공 여부
 */
export async function deleteWikiService(wikiId: string, data: WikiDelete): Promise<DbResult<{
    wiki: Wiki;
    history: WikiHistory;
    contributor: WikiContributor;
}>> {
    const previousWiki = await getWiki(wikiId);
    if (!previousWiki.success) {
        return previousWiki;
    }

    const updateWikiData: Partial<Omit<Wiki, "id">> = {
        lastEditor: data.author.id,
        lastEditorName: data.author.name,
        lastEditorEmail: data.author.email,
        updatedAt: Date.now(),
        version: previousWiki.data.version + 1,
    }

    const updateWikiResult = await updateWiki(wikiId, updateWikiData);
    if (!updateWikiResult.success) {
        return updateWikiResult;
    }
    const updatedWiki = updateWikiResult.data;

    // 2. 위키 업데이트 이력 생성
    const historyData: Omit<WikiHistory, "id"> = {
        wikiId,
        changedAt: Date.now(),
        changedBy: data.author.id,
        changedByName: data.author.name,
        changedByEmail: data.author.email,
        changeMessage: data.deleteMessage,
        changeType: "delete",
        title: previousWiki.data.title,
        content: "",
        contentHash: getWikiContentHash(""),
        contentSize: 0,
        parentVersions: [previousWiki.data.version],
        version: previousWiki.data.version + 1,
        tags: [],
        isMinor: false,
        previousVersion: previousWiki.data.version,
        metadata: {},
    }
    const setHistoryResult = await setWikiHistory(historyData);
    if (!setHistoryResult.success) {
        return setHistoryResult;
    }
    const history = setHistoryResult.data;

    // 3. 위키 참여자 업데이트
    const getContributorResult = await getWikiContributorsByWikiId(wikiId);
    if (!getContributorResult.success) {
        return getContributorResult;
    }
    const contributors = getContributorResult.data;
    let contributor = contributors.find((contributor) => contributor.contributorId === data.author.id);
    if (!contributor) {
        const setContributorResult = await setWikiContributor({
            wikiId: wikiId,
            contributorId: data.author.id,
            contributorName: data.author.name,
            contributorEmail: data.author.email,
            contributedAt: Date.now(),
            linesAdded: 0,
            linesRemoved: 0,
        });
        if (!setContributorResult.success) {
            return setContributorResult;
        }
        contributor = setContributorResult.data;
    }

    // 4. 위키 참여자 업데이트
    const updateContributorResult = await updateWikiContributor(contributor.id, {
        contributedAt: Date.now(),
        linesAdded: 0,
        linesRemoved: 0,
    });
    if (!updateContributorResult.success) {
        return updateContributorResult;
    }
    const updatedContributor = updateContributorResult.data;

    return { success: true, data: {
        wiki: updatedWiki,
        history: history,
        contributor: updatedContributor,
    } };
}

/**
 * 위키 완전 삭제 (테스트 목적으로 사용되는 메서드)
 * @param wikiId 위키 ID
 * @returns 성공 여부
 */
export async function _permanantDeleteWikiService(wikiId: string): Promise<DbResult<void>> {
    // 1. 위키 삭제
    const deleteWikiResult = await deleteWiki(wikiId);
    if (!deleteWikiResult.success) {
        return deleteWikiResult;
    }

    // 2. 위키 업데이트 이력 삭제
    const deleteWikiHistoryResult = await deleteWikiHistoriesByWikiId(wikiId);
    if (!deleteWikiHistoryResult.success) {
        return { success: false, error: deleteWikiHistoryResult.error };
    }

    // 3. 위키 참여자 삭제
    const deleteWikiContributorResult = await deleteWikiContributorsByWikiId(wikiId);
    if (!deleteWikiContributorResult.success) {
        return deleteWikiContributorResult;
    }

    return { success: true, data: undefined };
}