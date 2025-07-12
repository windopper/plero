import { createOrUpdateUserFromGoogle } from '~/server/db/user';

export default defineOAuthGoogleEventHandler({
    config: {
      clientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
    },
    async onSuccess(event, { user, tokens }) {
        try {
            const { redirectURL } = getQuery(event)
            console.log('Google OAuth user data:', {
                email: user.email,
                name: user.name,
                picture: user.picture ? 'present' : 'missing'
            });

            // 데이터베이스에 사용자 생성/업데이트
            const dbUser = await createOrUpdateUserFromGoogle({
                email: user.email,
                name: user.name,
                picture: user.picture,
            });

            if (!dbUser.success) {
                console.error('Failed to create/update user in database:', dbUser.error);
                throw new Error(`Database user creation failed: ${dbUser.error.message}`);
            }

            console.log('User successfully created/updated in database:', dbUser.data.id);

            // 세션에 사용자 정보 저장 (DB 사용자 정보 기반)
            await setUserSession(event, {
                user: dbUser.data,
            });

            return sendRedirect(event, redirectURL as string || '/');
        } catch (error) {
            console.error('Error in Google OAuth success handler:', error);
            
            // user 데이터가 최소한 있는 경우에만 fallback 세션 생성
            if (user && user.email) {
                return sendRedirect(event, '/?error=db_sync_failed');
            } else {
                // 완전히 실패한 경우
                return sendRedirect(event, '/?error=oauth_user_data_invalid');
            }
        }
    },
    // Optional, will return a json error and 401 status code by default
    onError(event, error) {
      console.error('Google OAuth error:', error)
      return sendRedirect(event, '/?error=oauth_failed')
    },
})