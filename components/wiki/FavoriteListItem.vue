<script setup lang="ts">
import { Icon } from '@iconify/vue';
import type { FavoritesList } from '~/server/db/schema';

interface Props {
    list: FavoritesList;
    index: number;
    isChecked: boolean;
    isEditing: boolean;
    editingName: string;
    loading: boolean;
}

interface Emits {
    (e: 'toggle', list: FavoritesList): void;
    (e: 'context-menu', event: MouseEvent, list: FavoritesList): void;
    (e: 'start-editing'): void;
    (e: 'finish-editing', name: string): void;
    (e: 'cancel-editing'): void;
    (e: 'update-editing-name', name: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 편집 모드에서 입력 이벤트 처리
const handleEditingNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update-editing-name', target.value);
};

// 키보드 이벤트 처리
const handleKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
        emit('finish-editing', props.editingName);
    } else if (event.key === 'Escape') {
        emit('cancel-editing');
    }
};
</script>

<template>
    <!-- 일반 모드 -->
    <label v-if="!isEditing" :for="`star-${index}`"
        class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--ui-bg-muted)] transition-colors duration-200"
        @contextmenu="emit('context-menu', $event, list)">
        <!-- 체크박스 -->
        <input type="checkbox" :id="`star-${index}`"
            :checked="isChecked" @change="emit('toggle', list)"
            :disabled="loading"
            class="w-4 h-4 text-[var(--ui-primary)] bg-[var(--ui-bg)] border-2 border-[var(--ui-border)] 
                   rounded-md focus:ring-[var(--ui-primary)] focus:ring-2 disabled:opacity-50" />

        <!-- 목록 정보 -->
        <div class="flex-1">
            <span class="text-sm text-[var(--ui-text)]">{{ list.name }}</span>
            <span v-if="list.isDefault"
                class="ml-2 text-xs px-2 py-0.5 bg-[var(--ui-primary)] text-white rounded-full">기본</span>
            <p v-if="list.description" class="text-xs text-[var(--ui-text-muted)] mt-1">{{
                list.description }}</p>
        </div>

        <!-- 선택된 아이템 표시 -->
        <Icon v-if="isChecked" icon="material-symbols:star"
            width="16" height="16" class="text-yellow-500" />
    </label>

    <!-- 편집 모드 -->
    <div v-else class="flex items-center gap-3 px-4 py-3 bg-[var(--ui-bg-muted)]">
        <!-- 체크박스 (비활성화) -->
        <input type="checkbox" :checked="isChecked" disabled
            class="w-4 h-4 text-[var(--ui-primary)] bg-[var(--ui-bg)] border-2 border-[var(--ui-border)] 
                   rounded-md opacity-50" />

        <!-- 편집 입력 -->
        <div class="flex-1">
            <input :value="editingName" @input="handleEditingNameChange" type="text" 
                class="w-full px-2 py-1 text-sm border border-[var(--ui-border)] rounded
                       bg-[var(--ui-bg)] text-[var(--ui-text)]
                       focus:ring-2 focus:ring-[var(--ui-primary)] focus:border-transparent"
                @keyup="handleKeyUp"
                @click.stop />
        </div>

        <!-- 편집 버튼들 -->
        <div class="flex gap-1">
            <button @click="emit('finish-editing', editingName)" :disabled="!editingName.trim() || loading"
                class="p-1 text-[var(--ui-text-muted)] hover:text-green-500 disabled:opacity-50">
                <Icon icon="material-symbols:check" width="14" height="14" />
            </button>
            <button @click="emit('cancel-editing')" :disabled="loading"
                class="p-1 text-[var(--ui-text-muted)] hover:text-red-500 disabled:opacity-50">
                <Icon icon="material-symbols:close" width="14" height="14" />
            </button>   
        </div>
    </div>
</template> 