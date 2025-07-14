// 진행 중인 스트림 세션 관리
interface StreamSession {
    id: string;
    abortController: AbortController;
    createdAt: Date;
    instruction: string;
}

class StreamManager {
    private sessions = new Map<string, StreamSession>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // 5분마다 오래된 세션 정리
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldSessions();
        }, 5 * 60 * 1000);
    }

    // 새 세션 생성
    createSession(instruction: string, prefix: string = 'ai'): string {
        const sessionId = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const abortController = new AbortController();
        
        const session: StreamSession = {
            id: sessionId,
            abortController,
            createdAt: new Date(),
            instruction
        };

        this.sessions.set(sessionId, session);
        console.log(`스트림 세션 생성: ${sessionId}`);
        
        return sessionId;
    }

    // 세션의 AbortController 가져오기
    getAbortController(sessionId: string): AbortController | null {
        const session = this.sessions.get(sessionId);
        return session?.abortController || null;
    }

    // 세션 취소
    cancelSession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session) {
            console.log(`세션을 찾을 수 없음: ${sessionId}`);
            return false;
        }

        console.log(`스트림 세션 취소: ${sessionId}`);
        session.abortController.abort();
        this.sessions.delete(sessionId);
        return true;
    }

    // 세션 완료 처리
    completeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            console.log(`스트림 세션 완료: ${sessionId}`);
            this.sessions.delete(sessionId);
        }
    }

    // 오래된 세션 정리 (30분 이상)
    private cleanupOldSessions(): void {
        const now = new Date();
        const expiredSessions: string[] = [];

        for (const [sessionId, session] of this.sessions) {
            const ageMinutes = (now.getTime() - session.createdAt.getTime()) / (1000 * 60);
            if (ageMinutes > 30) {
                expiredSessions.push(sessionId);
            }
        }

        for (const sessionId of expiredSessions) {
            console.log(`만료된 세션 정리: ${sessionId}`);
            this.cancelSession(sessionId);
        }
    }

    // 현재 활성 세션 수
    getActiveSessionCount(): number {
        return this.sessions.size;
    }

    // 모든 세션 취소 (서버 종료 시)
    cancelAllSessions(): void {
        console.log(`모든 스트림 세션 취소 (${this.sessions.size}개)`);
        for (const [sessionId] of this.sessions) {
            this.cancelSession(sessionId);
        }
        clearInterval(this.cleanupInterval);
    }
}

// 싱글톤 인스턴스
export const streamManager = new StreamManager();

// 서버 종료 시 정리
process.on('SIGINT', () => {
    streamManager.cancelAllSessions();
    process.exit(0);
});

process.on('SIGTERM', () => {
    streamManager.cancelAllSessions();
    process.exit(0);
}); 