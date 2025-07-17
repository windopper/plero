import { getLatestWikiHistory, getWikiHistory } from "~/server/db/wikiHistory";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event);

    const history = await getLatestWikiHistory(id);
    if (!history.success) {
        return history;
    }

    return {
        success: true,
        data: history.data,
    };
})