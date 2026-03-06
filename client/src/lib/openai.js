import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const cache = new Map();

export async function askChatBot(message) {
  try {
    if (!message || message.trim() === "") return "질문을 입력해주세요 🙂";

    if (cache.has(message)) return cache.get(message);

    const res = await axios.post(`${API_BASE}/api/ai/chat`, { message });

    const answer = res.data?.text?.trim() || "죄송합니다, 답변을 가져오지 못했어요 😢";
    cache.set(message, answer);

    return answer;
  } catch (error) {
    console.error("🚨 ChatBot Error:", error);
    return "현재 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요 ⚙️";
  }
}
