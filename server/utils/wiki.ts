import { User, Wiki } from "../db/schema";

export const checkAccessWiki = (wiki: Wiki, user: User | null) => {
    if (!wiki.isPublished && wiki.authorId !== user?.id) {
        throw createError({
            statusCode: 403,
            statusMessage: "Forbidden"
        })
    }
}