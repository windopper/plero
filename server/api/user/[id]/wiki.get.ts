import type { Wiki } from "~/server/db/schema";
import { getWikiListByAuthorId } from "~/server/db/wiki";
import { DbResult } from "~/server/type";

export default defineEventHandler(
  async (
    event
  ) => {
    const { id } = getRouterParams(event);
    const { exclusiveStartKey, limit, sort } = getQuery(event) as {
      exclusiveStartKey?: string;
      limit?: string;
      sort?: "asc" | "desc";
    };

    const options: {
      exclusiveStartKey?: string;
      limit: number;
      sort: "asc" | "desc";
    } = {
      exclusiveStartKey,
      limit: parseInt(limit || "10") || 10,
      sort: sort || "desc",
    }

    const { user } = await requireUserSessionForTest(event);
    if (user.id !== id) {
      throw createError({
        statusCode: 403,
        statusMessage: "Forbidden",
      });
    }

    const wikis = await getWikiListByAuthorId(id, options);

    if (!wikis.success) {
      throw createError({
        statusCode: 500,
        statusMessage: wikis.error?.message ?? "Internal server error",
      });
    }

    return {
      success: true,
      data: wikis.data.wikis,
      pagination: {
        limit: options.limit,
        hasMore: wikis.data.hasMore,
        lastEvaluatedKey: wikis.data.lastEvaluatedKey,
      },
    };
  },
);
