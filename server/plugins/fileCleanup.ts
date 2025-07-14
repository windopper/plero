import { FileManager } from '~/server/utils/fileManager';

export default async () => {
    console.log('서버 시작 - 오래된 파일 정리 시작');
    
    // 서버 시작 시 즉시 정리
    FileManager.cleanupOldFiles();
    
    // 24시간마다 정리 (개발 환경에서는 1시간마다)
    const intervalMs = process.env.NODE_ENV === 'development' 
        ? 60 * 60 * 1000       // 1시간 (개발)
        : 24 * 60 * 60 * 1000; // 24시간 (프로덕션)
    
    setInterval(() => {
        console.log('스케줄된 파일 정리 실행');
        FileManager.cleanupOldFiles();
    }, intervalMs);
    
    console.log(`파일 정리 스케줄러 시작됨 (간격: ${intervalMs / 1000 / 60}분)`);
}; 