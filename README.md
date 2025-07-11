# Plero

> [!NOTE]
> 현재 개발 중인 토이 프로젝트 입니다. 2025.07.07 시작

> ### 누구나 만들 수 있는 나만의 위키.
> 관심사, 설정, 일기, 잡학사전까지 — 원하는 주제로 쉽게 시작하세요.

## 🚀 주요 기능

- ✅ **마크다운 기반 위키 작성** - 직관적이고 빠른 문서 작성
- ✅ **실시간 미리보기** - 작성과 동시에 결과 확인
- ✅ **버전 관리** - 모든 편집 기록 추적 및 되돌리기 지원
- ✅ **Google OAuth 인증** - 간편한 로그인 시스템
- ✅ **다크모드 지원** - 사용자 선호에 맞는 테마
- ✅ **반응형 디자인** - 모바일, 태블릿, 데스크톱 최적화
- 🔄 **즐겨찾기 시스템** - 개발 중
- 🔄 **태그 기반 분류** - 개발 중
- 🔄 **통합 검색** - 개발 중

## 🏗️ 기술 스택

### Frontend
[![Nuxt](https://img.shields.io/badge/nuxt-00DC82?style=for-the-badge&logo=nuxt&logoColor=white)](https://nuxt.com/)
[![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Iconify](https://img.shields.io/badge/Iconify-026C9C?style=for-the-badge&logo=Iconify&logoColor=white)](https://iconify.design/)

### Backend & Database
[![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)

### Testing
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

### Markdown Editor
[![md-editor-v3](https://img.shields.io/badge/md--editor--v3-000000?style=for-the-badge&logo=md-editor-v3&logoColor=white)](https://md-editor-v3.vercel.app/)

## 📁 프로젝트 구조

```
plero/
├── 📁 components/          # Vue 컴포넌트
│   ├── 📁 common/         # 공통 컴포넌트
│   ├── 📁 wiki/           # 위키 관련 컴포넌트
│   └── 📁 icon/           # 아이콘 컴포넌트
├── 📁 pages/              # 페이지 라우트
│   ├── 📁 wiki/           # 위키 페이지들
│   └── 📁 login/          # 인증 페이지
├── 📁 server/             # 서버사이드 코드
│   ├── 📁 api/            # API 엔드포인트
│   ├── 📁 db/             # 데이터베이스 스키마 & 로직
│   └── 📁 service/        # 비즈니스 로직
├── 📁 assets/css/         # 스타일시트
├── 📁 test/               # 테스트 파일
└── 📄 agents.mdc          # 디자인 시스템 가이드
```

## 🎯 개발 로드맵

### 🔥 **우선순위 높음**

#### 🐛 버그 수정
- [x] **기여자 줄 수 계산 로직 수정** - `server/service/wiki.ts:198`
- [ ] **위키 삭제 후 리다이렉트 버그 수정** - 삭제된 페이지로 이동하는 문제
- [x] **홈페이지 "다른 위키 보러가기" 버튼 기능 구현** - `/wiki/list` 페이지로 연결

#### 🚀 핵심 기능
- [x] **위키 목록 페이지 개발** - 검색, 페이지네이션 포함된 목록 페이지 완성
- [x] **통합 검색 기능 구현** - 제목, 내용, 태그, 작성자명 등 전체 텍스트 검색
- [x] **페이지네이션 시스템 구현** - API 및 UI 모두 완성
- [x] **즐겨찾기 백엔드 API 구현** - UI는 완성, 실제 저장 기능 필요

### ⚡ **우선순위 중간**

#### 📝 위키 관리
- [ ] **태그 시스템 UI 완성** - 스키마는 존재, UI 구현 필요
- [ ] **공개/비공개 설정 UI** - `isPublished` 필드 활용
- [ ] **검색 기능 고도화** - 하이라이팅, 정렬 옵션, 필터링 추가
- [ ] **사용자 프로필 페이지** - 개인 대시보드 및 설정

#### ⭐ 즐겨찾기 시스템
- [x] **즐겨찾기 목록 관리** - "새 목록 만들기" 기능
- [ ] **즐겨찾기 페이지** - 저장된 위키들 관리

### 💫 **우선순위 낮음**

#### 🔐 보안 & 권한
- [ ] **사용자 권한 시스템 UI** - admin/editor/viewer 역할 관리
- [ ] **입력 검증 강화** - XSS 방지, 보안 강화
- [ ] **API 보안 개선** - Rate Limiting, 모니터링

#### 📊 분석 & 통계
- [ ] **위키 통계 대시보드** - 전체 통계 및 인사이트
- [ ] **개별 위키 분석** - 조회수, 편집 빈도 등

#### 🧪 테스트 & 품질
- [ ] **API 테스트 확장** - 에러 케이스, 인증 테스트
- [ ] **컴포넌트 테스트 추가** - 단위 테스트, E2E 테스트

#### 🌟 고급 기능
- [ ] **실시간 협업 기능** - 동시 편집, WebSocket
- [ ] **위키 템플릿 시스템** - 미리 정의된 템플릿
- [ ] **백업 & 내보내기** - PDF, HTML 변환
- [ ] **알림 시스템** - 편집 알림, 이메일 알림

#### 🏗️ 인프라
- [ ] **성능 최적화** - CDN, 코드 스플리팅, 캐싱
- [ ] **모니터링 & 로깅** - Sentry, 성능 모니터링
- [ ] **배포 자동화** - CI/CD, 스테이징 환경

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn
- Firebase 프로젝트 설정

### 설치 및 실행

```bash
# 저장소 클론
git clone [repository-url]
cd plero

# 의존성 설치
npm install

# 환경 변수 설정 (.env 파일 생성)
NUXT_SESSION_PASSWORD=your_password
NUXT_OAUTH_GOOGLE_CLIENT_ID=your_google_client_id
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret

# 개발 서버 실행
npm run dev

# 테스트 실행
npm run test
```

## 🎨 디자인 시스템

프로젝트의 디자인 시스템과 컴포넌트 가이드라인은 [`agents.mdc`](./agents.mdc) 파일에 상세히 문서화되어 있습니다.

### 주요 특징
- **CSS 변수 기반 색상 팔레트** - 다크모드 자동 지원
- **Iconify 아이콘 시스템** - 일관된 아이콘 사용
- **반응형 레이아웃 패턴** - 모바일 퍼스트 디자인
- **재사용 가능한 컴포넌트** - 버튼, 카드, 모달 등

## 🤝 기여하기

1. **버그 리포트**: Issues에 상세한 재현 방법과 함께 등록
2. **기능 제안**: 새로운 기능에 대한 아이디어 공유
3. **코드 기여**: Pull Request로 개선사항 제출

### 개발 가이드라인
- `agents.mdc`의 디자인 시스템을 따라 개발
- 컴포넌트 단위 테스트 작성
- 한국어 우선, 국제화 고려
- 성능과 사용성을 모두 고려한 구현

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**Plero**로 나만의 지식 공간을 만들어보세요! 🚀