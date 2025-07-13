import { validate } from "uuid";
import { getWiki } from "../db/wiki";

const regex = /\/api\/wiki\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

export default defineEventHandler(async (event) => {
    if (regex.test(event.path)) {
        const { user } = await requireUserSession(event);

        // /api/wiki/[id]/.....
        // regex exec를 통해 첫 번쨰 그룹을 가져오면 /api/wiki/[id] 만 가져오고 그 뒤에 오는 모든 것을 제거
        // split pop을 통해 마지막 요소를 가져오면 [id] 만 가져오게됨
        const id = regex.exec(event.path)?.[0].split('/').pop();

        const wiki = await getWiki(id as string);
        if (!wiki.success) {
            throw createError({
                statusCode: 404,
                statusMessage: "Not found"
            })
        }

        // 비공개 위키인 경우 작성자가 아닌 경우 접근 불가
        // /api/wiki/[id] ... 경로에 있는 모든 것들은 위키와 관련된 액션임으로 접근 불가
        if (!wiki.data.isPublished && wiki.data.authorId !== user.id) {
            throw createError({
                statusCode: 403,
                statusMessage: "Forbidden"
            })
        }
    }
})