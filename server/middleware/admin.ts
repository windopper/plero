import { User } from "../db/schema";

export default defineEventHandler(async (event) => {
    if (event.path.startsWith('/admin')) {
        const { user } = await requireUserSession(event);
        if (!user) {
            throw createError({
                statusCode: 401,
                statusMessage: "Unauthorized"
            });
        }
        if ((user as unknown as User).role !== "admin") {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden"
            });
        }
    }   
});