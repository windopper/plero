import { _permanantDeleteWikiService } from "~/server/service/wiki";

export default async function deleteWiki(wikiId: string) {
    const result = await _permanantDeleteWikiService(wikiId);
    if (!result.success) {
        console.error(result.error);
        return;
    }
}