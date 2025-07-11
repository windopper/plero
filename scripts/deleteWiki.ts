import { _permanantDeleteWikiService } from "~/server/service/wiki";

export default async function deleteWiki(wikiId: string) {
    const result = await _permanantDeleteWikiService(wikiId);
    if (!result.success) {
        console.error(result.error);
        return;
    }
    console.log("Wiki deleted successfully");
}

deleteWiki("97679c6c-4f69-43a6-a9aa-f0d68a56e19f")