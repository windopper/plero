const authRequiredPaths = ["/wiki/create", "/wiki/:id()/edit", "/profile"];

const checkAuthorOnNotPublishedWiki = "/wiki/:id()"

export default defineNuxtRouteMiddleware(async (to, from) => {
    if (to.matched.length === 0) {
        return
    }

    // auth가 필요한 경로에 대해 이동 취소 모달 창 띄우고 이동 취소
    if (authRequiredPaths.includes(to.matched[0].path)) {
        if (openAuthorizePopupIfLoggedOutAndReturnTrue()) {
            return abortNavigation()
        }
    }

    if (to.matched[0].path.includes(checkAuthorOnNotPublishedWiki)) {
        const id = to.params.id
        const { error } = await useFetch(`/api/wiki/${id}`)
        if (error.value) {
            throw createError({
                statusCode: error.value.statusCode,
                statusMessage: error.value.statusMessage,
            })
        }
    }
})