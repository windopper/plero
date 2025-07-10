
import { getWikiHistory } from "~/server/db/wikiHistory";
import { getChangedLineFromDiff, getContentDiff } from "~/utils/wiki";

export default defineEventHandler(async (event) => {
    const { id, historyId } = getRouterParams(event);

    const historyWiki = await getWikiHistory(historyId);
    if (!historyWiki.success) {
        return { success: false, message: 'Failed to get history wiki' };
    }

    if (historyWiki.data.previousVersion === null) {
        const { added, removed, diff } = getContentDiff("", historyWiki.data.content);
        const changedLines = getChangedLineFromDiff(diff);
        return { success: true, data: { added, removed, diff, changedLines } };
    }

    const parentWiki = await getWikiHistory(historyWiki.data.previousVersion)
    if (!parentWiki.success) {
        return { success: false, message: 'Failed to get parent wiki' };
    }

    const { added, removed, diff } = getContentDiff(parentWiki.data.content, historyWiki.data.content);
    const changedLines = getChangedLineFromDiff(diff);
    return { success: true, data: { added, removed, diff, changedLines } };
})