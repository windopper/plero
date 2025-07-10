import { User } from "~/server/db/schema";
import { revertWikiService } from "~/server/service/wiki";

export default defineEventHandler(async (event) => {
    const { id, historyId } = getRouterParams(event);
    
    const { user } = await requireUserSessionForTest(event);

    const revertResult = await revertWikiService({
      author: user as User,
      revertHistoryId: historyId,
    });
    if (!revertResult.success) {
        return revertResult;
    }

    return revertResult
})