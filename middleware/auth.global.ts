// api의 경우 POST, DELETE, PATCH, PUT 메서드 사용 시 인증 필요
const authRequiredPaths = [
    '/wiki/create',
    '/wiki/:id()/edit',
    '/profile',
]

export default defineNuxtRouteMiddleware((to, from) => {
    // auth가 필요한 경로에 대해 이동 취소 모달 창 띄우고 이동 취소
    if (authRequiredPaths.includes(to.matched[0].path)) {
        if (openAuthorizePopupIfLoggedOutAndReturnTrue()) {
            return abortNavigation()
        }
    }
})