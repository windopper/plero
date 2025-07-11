import { getWikiByTag } from "~/server/db/wiki";

export default defineEventHandler(async (event) => {
    const { tag } = getRouterParams(event);
    const result = await getWikiByTag(tag as string);
    return result;
});