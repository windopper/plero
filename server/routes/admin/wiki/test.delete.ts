import { _permanantDeleteWikiService } from "~/server/service/wiki";
import { clearDebugStorage, debugWikis } from "./debugStorage";

export default defineEventHandler(async (event) => {
    for (const wiki of debugWikis) {
        await _permanantDeleteWikiService(wiki.id);
    }   

    clearDebugStorage();
    
    return;
})