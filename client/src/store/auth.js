import { defineStore } from "pinia";
import { clearAuthState, getAuthState, persistAuthState } from "../lib/authStorage";

const initialAuthState = getAuthState();

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: initialAuthState.user || null,
        token: initialAuthState.token || null,
        storageType: initialAuthState.storageType || "local",
    }),

    actions: {
        login(userData, token, options = {}) {
            const autoLogin = options.autoLogin !== false;
            this.user = userData;
            this.token = token;
            this.storageType = autoLogin ? "local" : "session";
            persistAuthState({
                user: userData,
                token,
                autoLogin,
            });
        },

        setUser(userData) {
            this.user = userData;
            persistAuthState({
                user: userData,
                token: this.token,
                autoLogin: this.storageType !== "session",
            });
        },

        logout() {
            this.user = null;
            this.token = null;
            this.storageType = "local";
            clearAuthState();
        },
    },

    getters: {
        isLoggedIn: (state) => !!state.user && !!state.token,
    },
});