import { getUser } from "~/server/db/user";
import type { User } from "~/server/db/schema";

export default defineEventHandler(async (event) => {
    const { user } = await requireUserSession(event);
    if (!user) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized"
        });
    }
    const userData = await getUser((user as unknown as User).id);
    if (!userData.success) {
        throw createError({
            statusCode: 500,
            statusMessage: "Internal Server Error"
        });
    }
    return userData.data;
});