import axios from "axios";
import { resolveApiConfig } from "./runtimeConfig.js";

const { apiOrigin: API_BASE } = resolveApiConfig();

export async function askChatBot(message) {
  try {
    if (!message || message.trim() === "") return "질문을 입력해 주세요.";

    const res = await axios.post(
      `${API_BASE}/api/ai/chat`,
      { message },
      { timeout: 120000 }
    );

    const answer = res.data?.text?.trim() || "죄송합니다. 답변을 가져오지 못했습니다.";
    return answer;
  } catch (error) {
    console.error("ChatBot request failed:", error);
    const serverText = error?.response?.data?.text;
    if (serverText && String(serverText).trim()) return String(serverText).trim();
    return "일시적으로 응답을 받지 못했습니다. 잠시 후 다시 시도하거나, 푸터의 카카오 문의를 이용해 주세요.";
  }
}
