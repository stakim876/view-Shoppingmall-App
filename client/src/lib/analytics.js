import api from "./api";

export function trackAuthEvent(eventName, meta = {}) {
  api
    .post("/analytics/auth-events", {
      eventName,
      meta,
      createdAt: new Date().toISOString(),
    })
    .catch(() => {});
}
