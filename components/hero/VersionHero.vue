<script setup lang="ts">
import HistoryCard from '~/components/wiki/HistoryCard.vue';
import type { WikiHistory } from '~/server/db/schema';

const cards: WikiHistory[] = [
    {
        id: 'wiki-start',
        title: '첫 번째 위키 문서 생성',
        content: '플랫폼의 첫 번째 위키 문서가 생성되었습니다. "플레로란?" 이라는 제목으로 플랫폼의 소개와 사용법을 담은 기초 문서였습니다.',
        version: 1,
        addedCharacters: 256,
        removedCharacters: 0,
        addedTags: ['플레로', '소개', '위키', '첫문서'],
        removedTags: [],
        changedAt: new Date('2024-01-15'),
        changedBy: 'admin',
        changedByName: '관리자',
        changedByEmail: 'admin@plero.wiki',
        changeMessage: '첫 문서 작성',
        changeType: 'create',
        contentHash: '3ac22516',
        contentSize: 256,
        wikiId: 'wiki-start',
        tags: ['플레로', '소개', '위키', '첫문서'],
        previousVersion: '0',
        parentVersions: [],
        isMinor: false,
        metadata: {},
    },
    {
        id: 'community-growth',
        title: '노트',
        content: '',
        version: 2,
        addedCharacters: 432,
        removedCharacters: 18,
        addedTags: [],
        removedTags: [],
        changedAt: new Date('2024-03-22'),
        changedBy: 'user_historian',
        changedByName: 'Anonymous',
        changedByEmail: 'Anonymous@plero.wiki',
        changeMessage: '노트 문서 작성',
        changeType: 'update',
        contentHash: 'ab8938cd2f',
        contentSize: 670,
        wikiId: 'community-growth',
        tags: [],
        previousVersion: '1',
        parentVersions: ['start001'],
        isMinor: false,
        metadata: {},
    },
    {
        id: 'controversy-period',
        title: '노트',
        content: '',
        version: 3,
        addedCharacters: 195,
        removedCharacters: 89,
        addedTags: ['노트'],
        removedTags: [],
        changedAt: new Date('2024-06-10'),
        changedBy: 'moderator_team',
        changedByName: '관리자',
        changedByEmail: 'moderator@plero.wiki',
        changeMessage: '노트 작성',
        changeType: 'delete',
        contentHash: 'controversy003',
        contentSize: 776,
        wikiId: 'controversy-period',
        tags: ['논란', '정화작업', '가이드라인', '팩트체크'],
        previousVersion: '2',
        parentVersions: ['growth002'],
        isMinor: false,
        metadata: {},
    },
    {
        id: 'ai-revolution',
        title: 'Plero 위키 문서',
        content: '',
        version: 4,
        addedCharacters: 312,
        removedCharacters: 12,
        addedTags: ['Plero', '위키', '문서'],
        changedAt: new Date('2024-12-25'),
        changedBy: 'ai_developer',
        changedByName: 'Anonymous',
        changedByEmail: 'Anonymous@plero.wiki',
        changeMessage: '태그 수정',
        changeType: 'update',
        contentHash: 'f3a9cf2345',
        contentSize: 1076,
        wikiId: 'ai-revolution',
        tags: ['Plero', '위키', '문서'],
        previousVersion: '3',
        parentVersions: ['controversy003'],
        isMinor: false,
        removedTags: [],
        metadata: {},
    }
]

</script>

<template>
    <div class="relative w-full min-h-[600px] flex items-center justify-center overflow-hidden">

    </div>
    <div class="absolute top-0 left-0 w-full min-h-[700px] flex items-center justify-center overflow-hidden">
        <!-- 네 번째 카드 (가장 뒤) -->
        <div class="absolute perspective-2000 transform-3d card-layer-4
             rounded-xl border-[1px] border-[var(--ui-border)] backdrop-blur-sm w-[650px] h-fit shadow-2xl
             hover:shadow-3xl">
            <HistoryCard v-if="cards[0]" :history="cards[0]" :wiki-id="[cards[0].wikiId]" :hide-action-buttons="true" />
        </div>

        <!-- 세 번째 카드 -->
        <div class="absolute perspective-2000 transform-3d card-layer-3
             rounded-xl border-[1px] border-[var(--ui-border)] backdrop-blur-md w-[650px] h-fit shadow-xl
             hover:shadow-2xl">
            <HistoryCard v-if="cards[1]" :history="cards[1]" :wiki-id="[cards[1].wikiId]" :hide-action-buttons="true" />
        </div>

        <!-- 두 번째 카드 -->
        <div class="absolute perspective-2000 transform-3d card-layer-2
             rounded-xl border-[1px] border-[var(--ui-border)] backdrop-blur-lg w-[650px] h-fit shadow-xl
             hover:shadow-2xl">
            <HistoryCard v-if="cards[2]" :history="cards[2]" :wiki-id="[cards[2].wikiId]" :hide-action-buttons="true" />
        </div>

        <!-- 첫 번째 카드 (가장 앞) -->
        <div class="absolute perspective-2000 transform-3d card-layer-1
             rounded-xl border-[1px] border-[var(--ui-border)] backdrop-blur-xl w-[650px] h-fit shadow-2xl
             hover:shadow-3xl">
            <HistoryCard v-if="cards[3]" :history="cards[3]" :wiki-id="[cards[3].wikiId]" :hide-action-buttons="true" />
        </div>
    </div>
</template>

<style scoped>
.perspective-2000 {
    perspective: 2000px;
}

.transform-3d {
    transform-style: preserve-3d;
}

/* 3D 사선 배치 - 모든 카드가 순서대로 보이도록 */
.card-layer-4 {
    transform: rotateX(-15deg) rotateY(-10deg) translateZ(-120px) translateX(-100px) translateY(-200px);
    transform-origin: center;
    opacity: 0.85;
    filter: blur(0.5px);
}

.card-layer-3 {
    transform: rotateX(-15deg) rotateY(-10deg) translateZ(-80px) translateX(-50px) translateY(-100px);
    opacity: 0.9;
    filter: blur(0.4px);
}

.card-layer-2 {
    transform: rotateX(-15deg) rotateY(-10deg) translateZ(-40px) translateX(0px) translateY(0px);
    opacity: 0.95;
    filter: blur(0.2px);
}

.card-layer-1 {
    transform: rotateX(-15deg) rotateY(-10deg) translateZ(0px) translateX(50px) translateY(100px);
    opacity: 1;
    filter: blur(0.1px);
}

/* 그림자 강화 */
.shadow-3xl {
    box-shadow: 
        0 35px 60px -12px rgba(0, 0, 0, 0.4),
        0 20px 25px -5px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
}
.relative {
    background: linear-gradient(135deg, 
        rgba(var(--ui-primary-rgb), 0.02) 0%, 
        rgba(var(--ui-secondary-rgb), 0.03) 50%, 
        rgba(var(--ui-accent-rgb), 0.02) 100%);
}
</style>