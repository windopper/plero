import { updateUser } from "~/server/db/user";
import { User } from "~/server/db/schema";

export default defineEventHandler(async (event) => {
    const { id } = getRouterParams(event) as { id: string };
    const { user: sessionUser } = await requireUserSession(event);
    
    // 본인의 프로필만 수정 가능
    if ((sessionUser as unknown as User).id !== id) {
        throw createError({
            statusCode: 403,
            statusMessage: "권한이 없습니다"
        });
    }
    
    if (!id) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid request"
        });
    }

    const body = await readBody(event);
    
    // 업데이트할 수 있는 필드만 허용
    const allowedFields = ['name', 'displayName', 'bio', 'preferences'];
    const updateData: any = {};
    
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            updateData[field] = body[field];
        }
    }
    
    if (Object.keys(updateData).length === 0) {
        throw createError({
            statusCode: 400,
            statusMessage: "업데이트할 데이터가 없습니다"
        });
    }

    const result = await updateUser(id, updateData);

    if (!result.success) {
        throw createError({
            statusCode: 500,
            statusMessage: result.error.message || "Internal server error"
        });
    }

    return {
        success: true,
        data: {
            id: result.data.id,
            name: result.data.name,
            displayName: result.data.displayName,
            avatar: result.data.avatar,
            bio: result.data.bio,
            preferences: result.data.preferences,
            updatedAt: result.data.updatedAt,
        }
    };
}); 