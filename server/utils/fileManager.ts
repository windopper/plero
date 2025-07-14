import { existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export class FileManager {
    private static uploadDir = join(process.cwd(), 'public', 'uploads');

    static ensureUploadDir() {
        if (!existsSync(this.uploadDir)) {
            mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    static getUploadPath(fileName: string) {
        return join(this.uploadDir, fileName);
    }

    static deleteFile(fileName: string) {
        try {
            const filePath = this.getUploadPath(fileName);
            if (existsSync(filePath)) {
                unlinkSync(filePath);
                console.log(`파일 삭제됨: ${fileName}`);
                return true;
            }
        } catch (error) {
            console.error(`파일 삭제 실패: ${fileName}`, error);
        }
        return false;
    }

    // 24시간 이전의 임시 파일들을 정리
    static cleanupOldFiles() {
        try {
            this.ensureUploadDir();
            const files = readdirSync(this.uploadDir);
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = this.getUploadPath(file);
                const stats = statSync(filePath);
                const fileAge = now - stats.mtime.getTime();

                if (fileAge > dayInMs) {
                    this.deleteFile(file);
                }
            }
        } catch (error) {
            console.error('파일 정리 중 오류:', error);
        }
    }

    static getFileUrl(fileName: string) {
        return `/uploads/${fileName}`;
    }
} 