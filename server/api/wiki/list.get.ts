import { getWikiList } from "../wikiStorage"

export default defineEventHandler(async (event) => {
    return await getWikiList()
})