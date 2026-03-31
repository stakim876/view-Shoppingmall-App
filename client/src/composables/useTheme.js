import { ref } from "vue";

const isDark = ref(false);

function applyTheme(nextIsDark) {
  isDark.value = Boolean(nextIsDark);
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
}

function initTheme() {
  const prefersDark = localStorage.getItem("theme") === "dark";
  isDark.value = prefersDark;
  document.documentElement.classList.toggle("dark", prefersDark);
}

function toggleTheme() {
  applyTheme(!isDark.value);
}

export function useTheme() {
  return {
    isDark,
    initTheme,
    toggleTheme,
    applyTheme,
  };
}
