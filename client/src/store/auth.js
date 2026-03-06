import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        user: JSON.parse(localStorage.getItem("user")) || null,
        token: localStorage.getItem("token") || null,
    }),

    actions: {
        login(userData, token) {
            this.user = userData;
            this.token = token;
            localStorage.setItem("user", JSON.stringify(userData));
            localStorage.setItem("token", token);
        },

        logout() {
            this.user = null;
            this.token = null;
            localStorage.removeItem("user");
            localStorage.removeItem("token");
        },
    },

    getters: {
        isLoggedIn: (state) => !!state.user && !!state.token,
    },
});