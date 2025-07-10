declare module '#auth-utils' {
    interface User {
        provider: string;
        avatar: string;
        name: string;
        email: string;
        login: string;
        loggedInAt: string;
        loggedOutAt: string | null;
        loggedIn: boolean;
        loggedOut: boolean;
    }
}

export {}