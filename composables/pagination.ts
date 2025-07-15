interface PaginationOptions<T> {
    url: string;
    limit: number;
    query?: Ref<Record<string, any>> | ComputedRef<Record<string, any>>;
}

export const usePagination = async <T>({ url, limit, query }: PaginationOptions<T>) => {
    const hasMore = ref(true);
    const sort = ref<"asc" | "desc">("desc");
    const exclusiveStartKey = ref<string | undefined>(undefined);
    const data = ref<T[]>([]);

    const buildQuery = () => {
        const baseQuery = {
            limit: limit,
            exclusiveStartKey: exclusiveStartKey.value,
            sort: sort.value,
        };
        
        if (query?.value) {
            return { ...baseQuery, ...query.value };
        }
        
        return baseQuery;
    };

    const loadMore = async () => {
        // if (!hasMore.value) return;
        const newResponse = await $fetch<{
          success: boolean;
          data: T[];
          pagination: { hasMore: boolean; lastEvaluatedKey: string };
        }>(url, {
          query: buildQuery(),
        });
        if (newResponse.success) {
            (data.value as T[]).push(...newResponse.data);
            hasMore.value = newResponse.pagination.hasMore;
            exclusiveStartKey.value = newResponse.pagination.lastEvaluatedKey;
        }
    }

    const { data: initialData, error, refresh, pending } = await useFetch<{
        success: boolean;
        data: T[];
        pagination: { hasMore: boolean; lastEvaluatedKey: string };
    }>(url, {
        query: computed(() => {
            const baseQuery = {
                limit: limit,
                sort: sort.value,
            };
            
            if (query?.value) {
                return { ...baseQuery, ...query.value };
            }
            
            return baseQuery;
        }),
    });

    if (initialData.value?.success) {
        data.value = initialData.value.data;
        hasMore.value = initialData.value.pagination.hasMore;
        exclusiveStartKey.value = initialData.value.pagination.lastEvaluatedKey;
    }

    if (error.value) {
        throw createError({
            statusCode: error.value.statusCode,
            statusMessage: error.value.statusMessage,
        })
    }

    // watch(sort, async () => {
    //     data.value = [];
    //     hasMore.value = false;
    //     exclusiveStartKey.value = undefined;
    //     await loadMore();
    // });

    // 쿼리가 변경되면 데이터 리셋 (useFetch가 자동으로 다시 실행됨)
    if (query) {
        watch(query, () => {
            data.value = [];
            hasMore.value = true;
            exclusiveStartKey.value = undefined;
        }, { deep: true });
    }
    
    // useFetch 결과를 data에 반영
    watch([initialData], () => {
        if (initialData.value?.success) {
            data.value = initialData.value.data;
            hasMore.value = initialData.value.pagination.hasMore;
            exclusiveStartKey.value = initialData.value.pagination.lastEvaluatedKey;
        }
    }, { immediate: false })

    return {
        data,
        hasMore,
        exclusiveStartKey,
        loadMore,
        sort,
        refresh,
        pending,
    }
}