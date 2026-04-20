const AUTH_STORAGE_KEY = "auth_storage";

const safeParse = (raw) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
};

const getPreferredStorageType = () => {
  const savedType = localStorage.getItem(AUTH_STORAGE_KEY);
  if (savedType === "session") return "session";
  return "local";
};

const resolveStorage = (type) => {
  return type === "session" ? sessionStorage : localStorage;
};

export const getAuthState = () => {
  const preferredType = getPreferredStorageType();
  const preferredStorage = resolveStorage(preferredType);

  let token = preferredStorage.getItem("token");
  let user = safeParse(preferredStorage.getItem("user"));

  if (!token || !user) {
    const fallbackStorage = preferredType === "local" ? sessionStorage : localStorage;
    const fallbackType = preferredType === "local" ? "session" : "local";
    const fallbackToken = fallbackStorage.getItem("token");
    const fallbackUser = safeParse(fallbackStorage.getItem("user"));
    if (fallbackToken && fallbackUser) {
      token = fallbackToken;
      user = fallbackUser;
      return { token, user, storageType: fallbackType };
    }
  }

  return { token, user, storageType: preferredType };
};

export const persistAuthState = ({ user, token, autoLogin = true }) => {
  if (!token || !user) return;
  const storageType = autoLogin ? "local" : "session";
  const targetStorage = resolveStorage(storageType);
  const otherStorage = storageType === "local" ? sessionStorage : localStorage;

  targetStorage.setItem("token", token);
  targetStorage.setItem("user", JSON.stringify(user));
  otherStorage.removeItem("token");
  otherStorage.removeItem("user");
  localStorage.setItem(AUTH_STORAGE_KEY, storageType);
};

export const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
