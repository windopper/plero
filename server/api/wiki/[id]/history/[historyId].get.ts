import { getWikiHistory } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const { id, historyId } = getRouterParams(event);

    const history = await getWikiHistory(historyId);
    if (!history.success) {
        return history;
    }

    return {
        success: true,
        data: history.data,
    };
})