import api from "./api";
import { setVisitorStats } from "./visitorStats.js";

export function trackAuthEvent(eventName, meta = {}) {
  api
    .post("/analytics/auth-events", {
      eventName,
      meta,
      createdAt: new Date().toISOString(),
    })
    .catch(() => {});
}

export function trackPageView() {
  return api
    .post("/analytics/page-views")
    .then((res) => {
      setVisitorStats(res.data);
      return res;
    })
    .catch(() => null);
}

export async function fetchVisitorStats() {
  const { data } = await api.get("/analytics/visitor-stats");
  return {
    today: Number(data?.today) || 0,
    total: Number(data?.total) || 0,
  };
}
