export const useAuthorizeStore = () => useState('authorizeStore', () => {
    return {
        popupOpen: false,
        returnUrl: ""
    }
})