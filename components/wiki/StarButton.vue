<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { FavoritesList } from '~/server/db/schema';
import FavoriteListItem from './FavoriteListItem.vue';

// API에서 받는 직렬화된 타입 정의
type SerializedFavoritesList = Omit<FavoritesList, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

interface Props {
    wikiId: string;
    initialStarCount?: number;
}

const props = defineProps<Props>();

// 상태 관리
const isFavorited = ref(false);
const starCount = ref(props.initialStarCount || 0);
const showStarList = ref(false);
const availableLists = ref<FavoritesList[]>([]);
const favoritedListIds = ref<string[]>([]);
const loading = ref(false);
const showCreateForm = ref(false);
const newListName = ref('');
const userDataLoaded = ref(false);
const { loggedIn } = useUserSession();

// 컨텍스트 메뉴 상태
const showContextMenu = ref(false);
const contextMenuPosition = ref({ x: 0, y: 0 });
const selectedList = ref<FavoritesList | null>(null);
const editingListId = ref<string | null>(null);
const editingListName = ref('');

// computed
const starCountView = computed(() => {
    return starCount.value > 999 ? '999+' : starCount.value.toLocaleString();
});

// 사용자 즐겨찾기 정보 로드 (클라이언트에서만 실행)
const loadUserFavoritesData = async () => {
    if (!props.wikiId || userDataLoaded.value || !loggedIn.value) return;
    
    loading.value = true;
    try {
        const { data } = await $fetch(`/api/favorites/user/wiki/${props.wikiId}`) as {
            data: {
                isFavorited: boolean;
                availableLists: SerializedFavoritesList[];
                favoritedLists: SerializedFavoritesList[];
            }
        };
        isFavorited.value = data.isFavorited;
        // 직렬화된 데이터를 FavoritesList 타입으로 변환
        availableLists.value = data.availableLists.map(list => ({
            ...list,
            createdAt: new Date(list.createdAt),
            updatedAt: new Date(list.updatedAt)
        }));
        favoritedListIds.value = data.favoritedLists.map(list => list.id);
        userDataLoaded.value = true;
    } catch (error) {
        console.error('사용자 즐겨찾기 데이터 로드 실패:', error);
        // 로그인하지 않은 경우 등의 에러는 무시
        userDataLoaded.value = true;
    } finally {
        loading.value = false;
    }
};

// 즐겨찾기 토글 (기본 목록에 추가/제거)
const toggleFavorite = async () => {
    if (openAuthorizePopupIfLoggedOutAndReturnTrue()) {
        return
    }
    if (loading.value) return;
    
    loading.value = true;
    try {
        if (isFavorited.value) {
            // 모든 목록에서 제거
            const removePromises = favoritedListIds.value.map(listId => 
                $fetch('/api/favorites/items', {
                    method: 'DELETE',
                    query: {
                        wikiId: props.wikiId,
                        listId
                    }
                })
            );
            await Promise.all(removePromises);
            
            isFavorited.value = false;
            starCount.value = Math.max(0, starCount.value - 1);
            favoritedListIds.value = [];
        } else {
            // 기본 목록에 추가 (없으면 생성)
            let defaultList = availableLists.value.find(list => list.isDefault);
            if (!defaultList) {
                const { data } = await $fetch('/api/favorites/lists', {
                    method: 'POST',
                    body: {
                        name: '기본 즐겨찾기',
                        description: '기본 즐겨찾기 목록입니다.',
                        isDefault: true,
                        sortOrder: 0
                    }
                }) as { data: SerializedFavoritesList };
                
                // 직렬화된 데이터를 FavoritesList 타입으로 변환
                defaultList = {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt)
                };
                availableLists.value.unshift(defaultList);
            }
            
            await $fetch('/api/favorites/items', {
                method: 'POST',
                body: {
                    wikiId: props.wikiId,
                    listId: defaultList.id
                }
            });
            
            isFavorited.value = true;
            starCount.value += 1;
            favoritedListIds.value = [defaultList.id];
        }
    } catch (error) {
        console.error('즐겨찾기 토글 실패:', error);
    } finally {
        loading.value = false;
    }
};

// 특정 목록에 추가/제거
const toggleListFavorite = async (list: FavoritesList) => {
    if (loading.value) return;
    
    loading.value = true;
    try {
        const isCurrentlyFavorited = favoritedListIds.value.includes(list.id);
        
        if (isCurrentlyFavorited) {
            await $fetch('/api/favorites/items', {
                method: 'DELETE',
                query: {
                    wikiId: props.wikiId,
                    listId: list.id
                }
            });
            
            favoritedListIds.value = favoritedListIds.value.filter(id => id !== list.id);
            if (favoritedListIds.value.length === 0) {
                starCount.value = Math.max(0, starCount.value - 1);
            }
        } else {
            await $fetch('/api/favorites/items', {
                method: 'POST',
                body: {
                    wikiId: props.wikiId,
                    listId: list.id
                }
            });
            
            favoritedListIds.value.push(list.id);
            if (favoritedListIds.value.length === 1) {
                starCount.value += 1;
            }
        }
        
        // 전체 즐겨찾기 상태 업데이트
        isFavorited.value = favoritedListIds.value.length > 0;
    } catch (error) {
        console.error('목록 즐겨찾기 토글 실패:', error);
    } finally {
        loading.value = false;
    }
};

// 새 목록 생성
const createNewList = async () => {
    if (!newListName.value.trim() || loading.value) return;
    
    loading.value = true;
    try {
        const { data } = await $fetch('/api/favorites/lists', {
            method: 'POST',
            body: {
                name: newListName.value.trim(),
                description: '',
                isDefault: false,
                sortOrder: availableLists.value.length
            }
        }) as { data: SerializedFavoritesList };
        
        // 직렬화된 데이터를 FavoritesList 타입으로 변환
        const newList: FavoritesList = {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        };
        
        availableLists.value.push(newList);
        newListName.value = '';
        showCreateForm.value = false;
    } catch (error) {
        console.error('새 목록 생성 실패:', error);
    } finally {
        loading.value = false;
    }
};

// 컨텍스트 메뉴 표시
const showContextMenuHandler = (event: MouseEvent, list: FavoritesList) => {
    event.preventDefault();
    event.stopPropagation();
    
    // 기본 목록은 컨텍스트 메뉴 제한
    if (list.isDefault) return;
    
    selectedList.value = list;
    contextMenuPosition.value = { x: event.clientX, y: event.clientY };
    showContextMenu.value = true;
};

// 목록 이름 편집 시작
const startEditingList = () => {
    if (!selectedList.value) return;
    
    editingListId.value = selectedList.value.id;
    editingListName.value = selectedList.value.name;
    showContextMenu.value = false;
};

// 목록 이름 편집 완료
const finishEditingList = async (name?: string) => {
    const finalName = name || editingListName.value;
    if (!editingListId.value || !finalName.trim() || loading.value) return;
    
    loading.value = true;
    try {
        const { data } = await $fetch(`/api/favorites/lists/${editingListId.value}`, {
            method: 'PATCH',
            body: {
                name: finalName.trim()
            }
        }) as { data: { name: string } };
        
        // 목록 업데이트
        const index = availableLists.value.findIndex(list => list.id === editingListId.value);
        if (index !== -1) {
            availableLists.value[index] = { ...availableLists.value[index], name: data.name };
        }
        
        editingListId.value = null;
        editingListName.value = '';
    } catch (error) {
        console.error('목록 이름 수정 실패:', error);
    } finally {
        loading.value = false;
    }
};

// 목록 이름 편집 취소
const cancelEditingList = () => {
    editingListId.value = null;
    editingListName.value = '';
};

// 목록 삭제
const deleteList = async () => {
    if (!selectedList.value || loading.value) return;
    
    if (!confirm(`"${selectedList.value.name}" 목록을 삭제하시겠습니까?`)) {
        showContextMenu.value = false;
        return;
    }
    
    loading.value = true;
    try {
        await $fetch(`/api/favorites/lists/${selectedList.value.id}`, {
            method: 'DELETE'
        });
        
        // 목록에서 제거
        availableLists.value = availableLists.value.filter(list => list.id !== selectedList.value!.id);
        
        // 해당 목록에서 즐겨찾기된 상태였다면 업데이트
        if (favoritedListIds.value.includes(selectedList.value.id)) {
            favoritedListIds.value = favoritedListIds.value.filter(id => id !== selectedList.value!.id);
            if (favoritedListIds.value.length === 0) {
                isFavorited.value = false;
                starCount.value = Math.max(0, starCount.value - 1);
            }
        }
        
        showContextMenu.value = false;
        selectedList.value = null;
    } catch (error) {
        console.error('목록 삭제 실패:', error);
    } finally {
        loading.value = false;
    }
};

// 템플릿 참조
const starListRef = useTemplateRef('starListRef');
const starListButtonRef = useTemplateRef('starListButtonRef');
const contextMenuRef = useTemplateRef('contextMenuRef');

// 드롭다운 토글 핸들러
const handleDropdownToggle = async () => {
    showStarList.value = !showStarList.value;
    
    // 드롭다운이 열릴 때 사용자 데이터 로드
    if (showStarList.value && !userDataLoaded.value && process.client) {
        await loadUserFavoritesData();
    }
};

// 이벤트 핸들러
const handleClickOutside = (event: MouseEvent) => {
    // 컨텍스트 메뉴 닫기
    if (contextMenuRef.value && !contextMenuRef.value.contains(event.target as Node)) {
        showContextMenu.value = false;
    }
    
    // 드롭다운 닫기
    if (starListRef.value && !starListRef.value.contains(event.target as Node) && 
        starListButtonRef.value && !starListButtonRef.value.contains(event.target as Node)) {
        showStarList.value = false;
        showCreateForm.value = false;
        // 편집 중이던 것도 취소
        if (editingListId.value) {
            cancelEditingList();
        }
    }
};

// 라이프사이클
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    loadUserFavoritesData();
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// Props 변경 감지
watch(() => [props.wikiId, props.initialStarCount], () => {
    if (props.wikiId) {
        // wikiId가 변경되면 사용자 데이터 로드 상태 초기화
        userDataLoaded.value = false;
        isFavorited.value = false;
        availableLists.value = [];
        favoritedListIds.value = [];
        
        // initialStarCount가 있으면 업데이트
        if (props.initialStarCount !== undefined) {
            starCount.value = props.initialStarCount;
        }
    }
}, { immediate: false });
</script>

<template>
        <div class="relative flex">
            <!-- 메인 즐겨찾기 버튼 -->
            <button @click="toggleFavorite" :disabled="loading" class="flex items-center gap-2 px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] 
                   border border-[var(--ui-border)] rounded-l-lg hover:bg-[var(--ui-bg-muted)] 
                   transition-all duration-200 border-r-0 disabled:opacity-50 disabled:cursor-not-allowed"
                :class="{ 'text-yellow-500 hover:text-yellow-600': isFavorited }">
                <Icon v-if="loading" icon="material-symbols:refresh" width="16" height="16" class="animate-spin" />
                <Icon v-else-if="isFavorited" icon="material-symbols:star" width="16" height="16"
                    class="text-yellow-500" />
                <Icon v-else icon="material-symbols:star-outline" width="16" height="16" />
                <span class="text-sm font-medium">{{ starCountView }}</span>
            </button>

            <!-- 드롭다운 버튼 -->
            <button @click="handleDropdownToggle" ref="starListButtonRef" class="flex items-center justify-center px-2 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] 
                   border border-[var(--ui-border)] rounded-r-lg hover:bg-[var(--ui-bg-muted)] 
                   transition-all duration-200"
                :class="{ 'bg-[var(--ui-bg-muted)] text-[var(--ui-text)]': showStarList }">
                <Icon icon="material-symbols:keyboard-arrow-down" width="16" height="16"
                    class="transition-transform duration-200" :class="{ 'rotate-180': showStarList }" />
            </button>

            <!-- 드롭다운 메뉴 -->
            <Transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-150 ease-in" leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0">
                <div v-if="showStarList" class="absolute top-full mt-2 right-0 w-72 z-50" ref="starListRef" @click.stop>
                    <div
                        class="bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl shadow-sm overflow-hidden">
                        <!-- 헤더 -->
                        <div class="px-4 py-3 border-b border-[var(--ui-border)]">
                            <h3 class="text-sm font-semibold text-[var(--ui-text)]">즐겨찾기 목록</h3>
                            <p class="text-xs text-[var(--ui-text-muted)] mt-1">즐겨찾기할 목록을 선택하세요</p>
                        </div>

                        <!-- 목록 -->
                        <div class="max-h-48 overflow-y-auto">
                            <div v-if="loading" class="px-4 py-8 text-center">
                                <Icon icon="material-symbols:refresh" width="24" height="24"
                                    class="animate-spin mx-auto mb-2" />
                                <p class="text-sm text-[var(--ui-text-muted)]">로딩 중...</p>
                            </div>
                            <div v-else-if="availableLists.length === 0" class="px-4 py-8 text-center">
                                <p class="text-sm text-[var(--ui-text-muted)]">즐겨찾기 목록이 없습니다.</p>
                            </div>
                            <div v-else v-for="(list, index) in availableLists" :key="list.id">
                                <FavoriteListItem 
                                    :list="list"
                                    :index="index"
                                    :is-checked="favoritedListIds.includes(list.id)"
                                    :is-editing="editingListId === list.id"
                                    :editing-name="editingListName"
                                    :loading="loading"
                                    @toggle="toggleListFavorite"
                                    @context-menu="showContextMenuHandler"
                                    @start-editing="startEditingList"
                                    @finish-editing="finishEditingList"
                                    @cancel-editing="cancelEditingList"
                                    @update-editing-name="editingListName = $event" />
                            </div>
                        </div>

                        <!-- 푸터 -->
                        <div class="border-t border-[var(--ui-border)] p-3">
                            <div v-if="showCreateForm" class="space-y-3">
                                <input v-model="newListName" type="text" placeholder="새 목록 이름을 입력하세요" class="w-full px-3 py-2 text-sm border border-[var(--ui-border)] rounded-lg
                                       bg-[var(--ui-bg)] text-[var(--ui-text)] placeholder-[var(--ui-text-muted)]
                                       focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent"
                                    @keyup.enter="createNewList" @keyup.escape="showCreateForm = false" />
                                <div class="flex gap-2">
                                    <button @click="createNewList" :disabled="!newListName.trim() || loading"
                                        class="flex-1 flex items-center justify-center gap-1 px-3 py-2
                                           bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-muted)]
                                           text-white rounded-lg font-medium text-sm
                                           transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Icon v-if="loading" icon="material-symbols:refresh" width="14" height="14"
                                            class="animate-spin" />
                                        <Icon v-else icon="material-symbols:check" width="14" height="14" />
                                        <span>생성</span>
                                    </button>
                                    <button @click="showCreateForm = false; newListName = ''" :disabled="loading" class="px-3 py-2 text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]
                                           border border-[var(--ui-border)] rounded-lg text-sm
                                           transition-colors duration-200 disabled:opacity-50">
                                        취소
                                    </button>
                                </div>
                            </div>
                            <button v-else @click="showCreateForm = true" :disabled="loading" class="w-full flex items-center justify-center gap-2 px-3 py-2
                                   bg-[var(--ui-primary)] hover:bg-[var(--ui-primary-muted)]
                                   text-white rounded-lg font-medium text-sm
                                   transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Icon icon="material-symbols:add" width="16" height="16" />
                                <span>새 목록 만들기</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- 컨텍스트 메뉴 -->
            <Teleport to="body">
                <Transition enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in" leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0">
                    <div v-if="showContextMenu" ref="contextMenuRef" 
                        class="fixed z-[9999] w-48 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-lg shadow-lg overflow-hidden"
                        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
                        @click.stop>
                        <button @click="startEditingList" :disabled="loading"
                            class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--ui-text)] 
                                   hover:bg-[var(--ui-bg-muted)] transition-colors duration-200 disabled:opacity-50">
                            <Icon icon="material-symbols:edit-outline" width="16" height="16" />
                            <span>이름 수정</span>
                        </button>
                        <button @click="deleteList" :disabled="loading"
                            class="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 
                                   hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 disabled:opacity-50">
                            <Icon icon="material-symbols:delete-outline" width="16" height="16" />
                            <span>목록 삭제</span>
                        </button>
                    </div>
                </Transition>
            </Teleport>
        </div>
</template>

<style scoped>
/* 커스텀 스크롤바 */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: var(--ui-bg-muted);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb {
    background: var(--ui-border-accented);
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--ui-text-muted);
}

/* 체크박스 스타일 */
input[type="checkbox"]:checked {
    background-color: var(--ui-primary);
    border-color: var(--ui-primary);
}
</style>