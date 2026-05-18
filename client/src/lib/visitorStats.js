import { ref } from "vue";

export const visitorStats = ref(null);

export function setVisitorStats(payload) {
  if (!payload || payload.today === undefined) return;
  visitorStats.value = {
    today: Number(payload.today) || 0,
    total: Number(payload.total) || 0,
  };
}
