import { ref } from "vue";

const isDark = ref(false);

const THEME_SWITCH_CLASS = "theme-switching";

function withoutThemeTransition(callback) {
  const root = document.documentElement;
  root.classList.add(THEME_SWITCH_CLASS);
  callback();
  void root.offsetHeight;
  root.classList.remove(THEME_SWITCH_CLASS);
}

function resolveInitialDark() {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(nextIsDark) {
  withoutThemeTransition(() => {
    isDark.value = Boolean(nextIsDark);
    document.documentElement.classList.toggle("dark", isDark.value);
    document.documentElement.style.colorScheme = isDark.value ? "dark" : "light";
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  });
}

function initTheme() {
  const prefersDark = resolveInitialDark();
  isDark.value = prefersDark;
  document.documentElement.classList.toggle("dark", prefersDark);
  document.documentElement.style.colorScheme = prefersDark ? "dark" : "light";
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
