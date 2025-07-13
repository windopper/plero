import type { Wiki } from "~/server/db/schema";
import { getWikiListByAuthorId } from "~/server/db/wiki";
import { DbResult } from "~/server/type";

export default defineEventHandler(
  async (
    event
  ): Promise<
    DbResult<{
      wikis: Wiki[];
      pagination: {
        limit: number;
        hasMore: boolean;
        lastEvaluatedKey: string | undefined;
      };
    }>
  > => {
    const { id } = getRouterParams(event);
    const { exclusiveStartKey, limit, sort } = getQuery(event) as {
      exclusiveStartKey?: string;
      limit?: number;
      sort?: "asc" | "desc";
    };

    const { user } = await requireUserSessionForTest(event);
    if (user.id !== id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }

    const wikis = await getWikiListByAuthorId(id, {
      exclusiveStartKey,
      limit: limit || 10,
      sort: sort || "desc",
    });

    if (!wikis.success) {
      throw createError({
        statusCode: 500,
        statusMessage: wikis.error?.message ?? "Internal server error",
      });
    }

    return {
      success: true,
      data: {
        wikis: wikis.data.wikis,
        pagination: {
          limit: limit || 10,
          hasMore: wikis.data.hasMore,
          lastEvaluatedKey: wikis.data.lastEvaluatedKey,
        },
      },
    };
  },
);
