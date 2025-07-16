<script setup lang="ts">
import { MdEditor, MdPreview } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import HorizontalDiagonalLine from '~/components/common/HorizontalDiagonalLine.vue';
import AIWikiHero from '~/components/hero/AIWikiHero.vue';
import VersionHero from '~/components/hero/VersionHero.vue';
import WebTemplate from '~/components/hero/WebTemplate.vue';
import WikiStarHero from '~/components/hero/WikiStarHero.vue';
import HistoryCard from '~/components/wiki/HistoryCard.vue';

const navigateToWikiCreate = () => {
    navigateTo('/wiki/create')
}

// 주요 기능 데이터
const features = [
    {
        icon: 'edit-note',
        title: '마크다운 기반 작성',
        description: '직관적이고 빠른 문서 작성으로 생각을 바로 기록하세요'
    },
    {
        icon: 'preview',
        title: '실시간 미리보기',
        description: '작성과 동시에 결과를 확인할 수 있는 편리한 에디터'
    },
    {
        icon: 'history',
        title: '버전 관리',
        description: '모든 편집 기록을 추적하고 언제든 이전 버전으로 되돌리기'
    },
    {
        icon: 'auto-awesome',
        title: 'AI 위키 생성',
        description: '텍스트나 파일을 업로드하면 AI가 자동으로 위키를 생성해드려요'
    },
    {
        icon: 'star',
        title: '즐겨찾기 시스템',
        description: '중요한 위키들을 목록별로 정리하고 빠르게 접근하세요'
    },
    {
        icon: 'tag',
        title: '태그 기반 분류',
        description: '태그로 위키를 체계적으로 분류하고 관련 문서를 쉽게 찾으세요'
    }
]

// 기술 스택 데이터
const techStack = [
    { name: 'Nuxt 3', color: '#00DC82' },
    { name: 'Vue.js', color: '#4FC08D' },
    { name: 'Tailwind CSS', color: '#06B6D4' },
    { name: 'PostgreSQL', color: '#4169E1' },
    { name: 'Drizzle ORM', color: '#C5F74F' },
    { name: 'Iconify', color: '#026C9C' }
]

const contentValue = ref(``)
const currentContentIndex = ref(0)
const updateContentValue = (value: string) => {
    contentValue.value = value
}

const markdownValue = `# Plero: 나만의 지식을 위한 열린 위키 플랫폼

> Plero는 현재 활발히 개발 중인 개인 토이 프로젝트입니다. 2025년 7월 7일 첫 코드가 작성되었으며, 사용자 중심의 위키 경험을 제공하는 것을 목표로 합니다.

## 💡 개요

Plero는 **누구나 만들 수 있는 나만의 위키**를 지향하는 개방형 지식 관리 플랫폼입니다. 개인의 관심사, 창작물 설정, 일상 기록, 또는 특정 분야의 잡학사전까지—사용자가 원하는 어떤 주제로든 쉽고 빠르게 자신만의 지식 저장소를 구축하고 공유할 수 있도록 설계되었습니다. 정보의 접근성과 개인화된 지식 축적의 중요성이 커지는 시대에, Plero는 사용자들이 능동적으로 지식을 생산하고 관리할 수 있는 직관적인 환경을 제공합니다.

Plero는 단순한 정보 저장소를 넘어, 사용자의 아이디어가 생명력을 얻고 성장하는 공간이 되기를 꿈꿉니다. 강력한 마크다운 편집기부터 체계적인 버전 관리 시스템, 그리고 미래의 AI 기반 자동 생성 기능까지, Plero는 사용자가 지식 창조에만 집중할 수 있도록 최적의 도구를 제공합니다.

## 🚀 주요 기능

Plero는 사용자들이 쉽고 효율적으로 위키를 작성하고 관리할 수 있도록 다음과 같은 핵심 기능을 제공합니다.`

const handleStartTyping = () => {
    contentValue.value = ''
    currentContentIndex.value = 0
    const interval = setInterval(() => {
        contentValue.value = markdownValue.slice(0, currentContentIndex.value)
        currentContentIndex.value++
        if (currentContentIndex.value >= markdownValue.length) {
            clearInterval(interval)
        }
    }, 20)
}

onMounted(() => {
    handleStartTyping()
})

</script>

<template>
    <div class="max-w-7xl mx-auto">
        <!-- 히어로 섹션 -->
        <div class="flex flex-col gap-4 py-16 border-x-[1px] border-[var(--ui-border)]">
            <div class="flex flex-col gap-4 px-2 horizontal-line md:text-6xl text-4xl">
                <h1 class="font-bold">누구나 만들 수 있는</h1>
                <h1 class="font-bold text-[var(--ui-primary)]">나만의 위키.</h1>
            </div>
            <p class="md:text-2xl text-lg text-[var(--ui-text-dimmed)] my-4 px-2">관심사, 설정, 일기, 잡학사전까지 — 원하는 주제로 쉽게
                시작하세요.
            </p>
            <div class="flex gap-4 px-2 horizontal-line md:text-xl text-base">
                <button
                    class="bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] px-4 py-2 rounded-md w-fit cursor-pointer"
                    @click="navigateToWikiCreate">시작하기</button>
                <button
                    class="hover:bg-[var(--ui-bg-accented)] text-[var(--ui-text)] px-4 py-2 rounded-md w-fit cursor-pointer
                border-[1px] border-[var(--ui-border)] hover:border-[var(--ui-border-accented)] transition-all duration-300"
                    @click="navigateTo('/wiki/list')">다른 위키
                    보러가기</button>
            </div>
            <HorizontalDiagonalLine />
        </div>

        <!-- 주요 기능 섹션 -->
        <div class="flex flex-col gap-8 py-16 px-2 border-x-[1px] border-[var(--ui-border)]">
            <div class="text-center">
                <h2 class="md:text-4xl text-3xl font-bold mb-4">🚀 주요 기능</h2>
                <p class="md:text-xl text-lg text-[var(--ui-text-dimmed)]">플레로가 제공하는 강력한 위키 기능들을 만나보세요</p>
            </div>

            <div class="flex flex-col gap-8">
                <div class="flex flex-row items-center gap-4">
                    <div class="flex flex-col items-end w-[30%] p-4">
                        <div class="feature-title">
                            마크다운 기반 작성
                        </div>
                        <div class="feature-description">
                            직관적이고 빠른 문서 작성으로 생각을 바로 기록하세요
                        </div>
                    </div>
                    <div class="relative w-[70%] p-16">
                        <WebTemplate>
                            <MdEditor :preview="false" language="en" :model-value="contentValue"
                                @update:model-value="updateContentValue" />
                        </WebTemplate>
                    </div>
                </div>
                <div class="flex flex-row-reverse items-center gap-4">
                    <div class="flex flex-col items-start w-[30%] p-4">
                        <div class="feature-title">
                            실시간 미리보기
                        </div>
                        <div class="feature-description">
                            작성과 동시에 결과를 확인할 수 있는 편리한 에디터
                        </div>
                    </div>
                    <div class="relative w-[70%] p-16">
                        <WebTemplate>
                            <MdPreview :model-value="contentValue" class="min-h-96 p-4" />
                        </WebTemplate>
                    </div>
                </div>
                <div class="flex flex-row items-center gap-4">
                    <div class="flex flex-col items-end w-[30%] px-8">
                        <div class="feature-title">
                            버전 관리
                        </div>
                        <div class="feature-description">
                            모든 편집 기록을 추적하고 언제든 이전 버전으로 되돌릴 수 있어요
                        </div>
                    </div>
                    <div class="relative w-[70%] p-8">
                        <VersionHero />
                    </div>
                </div>
                <div class="flex flex-row-reverse items-center gap-4">
                    <div class="flex flex-col items-start w-[30%] p-4">
                        <div class="feature-title">
                            AI 위키 생성/편집
                        </div>
                        <div class="feature-description">
                            텍스트나 파일을 업로드하면 AI가 자동으로 위키를 생성해드려요. 또는 직접 지시사항을 입력해서 위키를 편집할 수 있어요.
                        </div>
                    </div>
                    <div class="relative w-[70%] p-8">
                        <AIWikiHero />
                    </div>
                </div>
                <!-- <div class="flex flex-row items-center gap-4">
                    <div class="flex flex-col items-end w-[30%]">
                        <div class="feature-title">
                            즐겨찾기 시스템
                        </div>
                        <div class="feature-description">
                            중요한 위키들을 목록별로 정리하고 빠르게 접근하세요
                        </div>
                    </div>
                    <div class="relative w-[70%] p-8">
                        <WikiStarHero />
                    </div>
                </div>
                <div class="flex flex-row-reverse items-center gap-4">
                    <div class="flex flex-col items-start w-[30%]">
                        <div class="feature-title">
                            태그 기반 분류
                        </div>
                        <div class="feature-description">
                            태그로 위키를 체계적으로 분류하고 관련 문서를 쉽게 찾으세요
                        </div>
                    </div>
                    <div class="relative w-[70%] p-16">
                        <span>채워야됨.</span>
                    </div>
                </div> -->
            </div>
        </div>

        <!-- 기술 스택 섹션 -->
        <!-- <div class="flex flex-col gap-8 py-16 px-2 border-x-[1px] border-[var(--ui-border)]">
            <div class="text-center">
                <h2 class="md:text-4xl text-3xl font-bold mb-4">🏗️ 기술 스택</h2>
                <p class="md:text-xl text-lg text-[var(--ui-text-dimmed)]">최신 기술로 구축된 안정적이고 빠른 플랫폼</p>
            </div>

            <div class="flex flex-wrap justify-center gap-4 mt-8">
                <div v-for="tech in techStack" :key="tech.name" class="px-4 py-2 rounded-full border-[1px] border-[var(--ui-border)] 
                    hover:border-[var(--ui-border-accented)] hover:bg-[var(--ui-bg-accented)] 
                    transition-all duration-300 cursor-default">
                    <span class="font-medium">{{ tech.name }}</span>
                </div>
            </div>
        </div> -->

        <!-- 시작하기 섹션 -->
        <!-- <div class="flex flex-col gap-8 py-16 px-2 border-x-[1px] border-[var(--ui-border)]">
            <div class="text-center">
                <h2 class="md:text-4xl text-3xl font-bold mb-4">🎯 지금 바로 시작하세요</h2>
                <p class="md:text-xl text-lg text-[var(--ui-text-dimmed)] mb-8">몇 분 안에 나만의 위키를 만들어보세요</p>
            </div>

            <div class="max-w-2xl mx-auto">
                <div class="grid gap-6">
                    <div class="flex items-start gap-4 p-6 rounded-lg bg-[var(--ui-bg-accented)]">
                        <div class="w-8 h-8 rounded-full bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] 
                        flex items-center justify-center font-bold flex-shrink-0">1</div>
                        <div>
                            <h3 class="text-lg font-semibold mb-2">Google 계정으로 간편 로그인</h3>
                            <p class="text-[var(--ui-text-dimmed)]">별도 가입 없이 Google 계정으로 바로 시작하세요</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-6 rounded-lg bg-[var(--ui-bg-accented)]">
                        <div class="w-8 h-8 rounded-full bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] 
                        flex items-center justify-center font-bold flex-shrink-0">2</div>
                        <div>
                            <h3 class="text-lg font-semibold mb-2">첫 번째 위키 작성</h3>
                            <p class="text-[var(--ui-text-dimmed)]">마크다운으로 쉽게 작성하거나 AI에게 도움을 받아보세요</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-4 p-6 rounded-lg bg-[var(--ui-bg-accented)]">
                        <div class="w-8 h-8 rounded-full bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] 
                        flex items-center justify-center font-bold flex-shrink-0">3</div>
                        <div>
                            <h3 class="text-lg font-semibold mb-2">태그와 즐겨찾기로 정리</h3>
                            <p class="text-[var(--ui-text-dimmed)]">체계적으로 분류하고 중요한 위키는 즐겨찾기에 추가하세요</p>
                        </div>
                    </div>
                </div>

                <div class="text-center mt-8">
                    <button class="bg-[var(--ui-primary)] text-[var(--ui-text-inverted)] px-8 py-3 rounded-lg 
                        text-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-300"
                        @click="navigateToWikiCreate">
                        🚀 위키 만들기 시작
                    </button>
                </div>
            </div>
        </div> -->
    </div>
</template>

<style scoped>
@import '~/assets/css/main.css';

.horizontal-line {
    position: relative;
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -50vw;
        width: 200vw;
        height: 1px;
        background-color: var(--ui-border);
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: -50vw;
        width: 200vw;
        height: 1px;
        background-color: var(--ui-border);
    }
}

.vertical-line {
    position: relative;
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
    }
}

.feature-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--ui-text);
}

.feature-description {
    font-size: 1rem;
    color: var(--ui-text-dimmed);
}
</style>