import { testConnection, closeConnection } from '../server/db/drizzle-connection';

async function main() {
  console.log('🔗 AWS Aurora DSQL 연결 테스트 시작...\n');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ 데이터베이스 연결 성공!');
    console.log('📊 Drizzle ORM과 AWS Aurora DSQL이 정상적으로 연결되었습니다.');
  } else {
    console.log('❌ 데이터베이스 연결 실패!');
    console.log('🔧 다음을 확인해주세요:');
    console.log('   - DATABASE_URL 환경 변수가 올바르게 설정되었는지');
    console.log('   - AWS Aurora DSQL 인스턴스가 실행 중인지');
    console.log('   - 네트워크 연결 및 보안 그룹 설정');
    process.exit(1);
  }
  
  await closeConnection();
  console.log('\n🔚 연결 테스트 완료');
}

// 에러 핸들링
main().catch((error) => {
  console.error('❌ 예상치 못한 오류가 발생했습니다:', error);
  process.exit(1);
}); 