import { deleteWiki, getWiki, setWiki, updateWiki } from "../db/wiki";
import { User, Wiki, WikiContributor, WikiHistory } from "../db/schema";
import { deleteWikiHistoriesByWikiId, deleteWikiHistory, getLatestWikiHistory, getWikiHistory, setWikiHistory, updateWikiHistory } from "../db/wikiHistory";
import { getContentDiff, getWikiContentHash, getWikiContentSize } from "../../utils/wiki";
import { deleteWikiContributor, deleteWikiContributorsByWikiId, getWikiContributor, getWikiContributorsByWikiId, setWikiContributor, updateWikiContributor } from "../db/wikiContributor";
import type { DbResult } from "../type";

export type WikiCreate = { title: string, content: string, author: User };
export type WikiUpdate = {
  title: string;
  content: string;
  updateMessage: string;
  author: User;
};
export type WikiDelete = { deleteMessage: string, author: User };
export type WikiRevert = { author: User, revertHistoryId: string };

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
    latestVersion: 1,
  };
  const setResult = await setWiki(wikiData);
  if (!setResult.success) {
    return setResult;
  }
  const wikiId = setResult.data.id;
  const wiki = setResult.data;

  // 2. 위키 생성 이력 생성

  const { added, removed } = getContentDiff("", data.content);

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
    previousVersion: null,
    parentVersions: [],
    contentSize: getWikiContentSize(data.content),
    contentHash: getWikiContentHash(data.content),
    isMinor: false,
    addedCharacters: added,
    removedCharacters: removed,
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
    linesAdded: added,
    linesRemoved: removed,
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

    // 기존 위키 히스토리 조회
    const getLatestWikiHistoryResult = await getLatestWikiHistory(wikiId);
    if (!getLatestWikiHistoryResult.success) {
        return getLatestWikiHistoryResult;
    }
    const latestWikiHistory = getLatestWikiHistoryResult.data;

    // 1. 위키 업데이트
    const updateWikiResult = await updateWiki(wikiId, {
        title: data.title,
        content: data.content,
        updatedAt: Date.now(),
        version: previousWiki.latestVersion + 1,
        latestVersion: previousWiki.latestVersion + 1,
        lastEditor: data.author.id,
        lastEditorName: data.author.name,
        lastEditorEmail: data.author.email,
    });
    if (!updateWikiResult.success) {
        return updateWikiResult;
    }
    const updatedWiki = updateWikiResult.data;

    // 2. 위키 업데이트 이력 생성

    const { added, removed } = getContentDiff(previousWiki.content, data.content);

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
        previousVersion: latestWikiHistory.id,
        parentVersions: [latestWikiHistory.id],
        contentSize: getWikiContentSize(data.content),
        contentHash: getWikiContentHash(data.content),
        isMinor: false,
        addedCharacters: added,
        removedCharacters: removed,
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
            linesAdded: added,
            linesRemoved: removed,
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

    const latestWikiHistory = await getLatestWikiHistory(wikiId);
    if (!latestWikiHistory.success) {
        return latestWikiHistory;
    }

    const updateWikiData: Partial<Omit<Wiki, "id">> = {
        content: "",
        lastEditor: data.author.id,
        lastEditorName: data.author.name,
        lastEditorEmail: data.author.email,
        updatedAt: Date.now(),
        version: previousWiki.data.latestVersion + 1,
        latestVersion: previousWiki.data.latestVersion + 1,
    }

    const updateWikiResult = await updateWiki(wikiId, updateWikiData);
    if (!updateWikiResult.success) {
        return updateWikiResult;
    }
    const updatedWiki = updateWikiResult.data;

    // 2. 위키 업데이트 이력 생성
    const { added, removed } = getContentDiff(previousWiki.data.content, "");

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
        parentVersions: [latestWikiHistory.data.id],
        version: updatedWiki.version,
        tags: [],
        isMinor: false,
        previousVersion: previousWiki.data.id,
        metadata: {},
        addedCharacters: added,
        removedCharacters: removed,
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
            linesAdded: added,
            linesRemoved: removed,
        });
        if (!setContributorResult.success) {
            return setContributorResult;
        }
        contributor = setContributorResult.data;
    }

    // 4. 위키 참여자 업데이트
    const updateContributorResult = await updateWikiContributor(contributor.id, {
        contributedAt: Date.now(),
        linesAdded: added,
        linesRemoved: removed,
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

export async function revertWikiService(data: WikiRevert): Promise<DbResult<{
    wiki: Wiki;
    history: WikiHistory;
    contributor: WikiContributor | null;
}>> {
    const user = data.author;

    const history = await getWikiHistory(data.revertHistoryId);
    if (!history.success) {
        return history;
    }

    const currentWiki = await getWiki(history.data.wikiId);
    if (!currentWiki.success) {
        return currentWiki;
    }

    // fallback
    // 현재 버전과 되돌리려는 버전이 같으면 그냥 종료.
    if (currentWiki.data.version === history.data.version) {
        return { success: true, data: {
            wiki: currentWiki.data,
            history: history.data,
            contributor: null,
        } };
    }

    const updateWikiResult = await updateWiki(history.data.wikiId, {
        title: history.data.title,
        content: history.data.content,
        updatedAt: Date.now(),
        version: history.data.version,
        lastEditor: user.id,
        lastEditorName: user.name,
        lastEditorEmail: user.email,
    });
    if (!updateWikiResult.success) {
        return updateWikiResult;
    }

    const { added, removed } = getContentDiff(currentWiki.data.content, history.data.content);

    const createHistoryResult = await setWikiHistory({
        wikiId: history.data.wikiId,
        changedAt: Date.now(),
        changeMessage: `v${history.data.version}으로 되돌리기`,
        changeType: "revert",
        title: history.data.title,
        content: history.data.content,
        version: history.data.version,
        tags: history.data.tags,
        changedBy: user.id,
        changedByName: user.name,
        changedByEmail: user.email,
        previousVersion: history.data.id,
        parentVersions: [history.data.id],
        contentHash: history.data.contentHash,
        contentSize: history.data.contentSize,
        addedCharacters: added,
        removedCharacters: removed,
        isMinor: false,
    });
    if (!createHistoryResult.success) {
        return createHistoryResult;
    }

    const getContributorResult = await getWikiContributorsByWikiId(history.data.wikiId);
    if (!getContributorResult.success) {
        return getContributorResult;
    }
    const contributors = getContributorResult.data;
    let contributor = contributors.find((contributor) => contributor.contributorId === user.id);
    if (!contributor) {
        const setContributorResult = await setWikiContributor({
            wikiId: history.data.wikiId,
            contributorId: user.id,
            contributorName: user.name,
            contributorEmail: user.email,
            contributedAt: Date.now(),
            linesAdded: history.data.addedCharacters,
            linesRemoved: history.data.removedCharacters,
        });
        if (!setContributorResult.success) {
            return setContributorResult;
        }
        contributor = setContributorResult.data;
    }

    return { success: true, data: {
        wiki: updateWikiResult.data,
        history: createHistoryResult.data,
        contributor: contributor,
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