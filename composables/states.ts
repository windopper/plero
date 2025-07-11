export const useAuthorizeStore = () => useState('authorizeStore', () => {
    return {
        popupOpen: false,
        returnUrl: ""
    }
})

/**
 * 로그인 상태가 아니면 로그인 모달 창 띄우고 True 반환
 * 
 * @returns 
 */
export const openAuthorizePopupIfLoggedOutAndReturnTrue = () => {
    const { loggedIn } = useUserSession();
    const authorizePopup = useAuthorizeStore()
    if (!loggedIn.value) {
        authorizePopup.value.popupOpen = true
        authorizePopup.value.returnUrl = ``
        return true
    }
    return false
}

/**
 * 위키 버전 되돌리기 관련 기능을 제공하는 composable
 */
export const useWikiRevert = (wikiId: string | string[]) => {
    // 모달 상태 관리
    const isRevertModalVisible = ref(false)
    const selectedVersionForRevert = ref<any>(null)

    /**
     * 되돌리기 모달 표시
     * @param versionInfo 되돌릴 버전 정보
     */
    const showRevertModal = (versionInfo: any) => {
        if (openAuthorizePopupIfLoggedOutAndReturnTrue()) {
            return
        }
        selectedVersionForRevert.value = versionInfo
        isRevertModalVisible.value = true
    }

    /**
     * 되돌리기 모달 닫기
     */
    const closeRevertModal = () => {
        isRevertModalVisible.value = false
        selectedVersionForRevert.value = null
    }

    /**
     * 되돌리기 실행
     * @param historyId 되돌릴 히스토리 ID (선택사항, selectedVersionForRevert에서 가져옴)
     * @returns 성공 여부
     */
    const confirmRevert = async (historyId?: string) => {
        if (openAuthorizePopupIfLoggedOutAndReturnTrue()) {
            return false
        }

        const targetHistoryId = historyId || selectedVersionForRevert.value?.id
        if (!targetHistoryId) {
            console.error('되돌릴 버전 ID가 없습니다')
            return false
        }

        try {
            const result = await $fetch(`/api/wiki/${wikiId}/history/${targetHistoryId}/revert`, {
                method: 'POST'
            })

            if (result.success) {
                closeRevertModal()
                // 위키 메인 페이지로 이동
                await navigateTo(`/wiki/${wikiId}`)
                return true
            } else {
                console.error('되돌리기 실패:', result.error?.message || '알 수 없는 오류')
                return false
            }
        } catch (error) {
            console.error('되돌리기 실패:', error)
            return false
        }
    }

    return {
        // 상태
        isRevertModalVisible: readonly(isRevertModalVisible),
        selectedVersionForRevert: readonly(selectedVersionForRevert),
        
        // 메서드
        showRevertModal,
        closeRevertModal,
        confirmRevert
    }
}