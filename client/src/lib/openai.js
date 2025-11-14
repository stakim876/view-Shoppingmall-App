import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

let conversationHistory = [
  {
    role: "system",
    content:
      "당신은 쇼핑몰 AI 도우미입니다. 상품 추천, 주문, 배송 문의 등에 대해 친절하고 간단하게 한국어로 답변하세요.",
  },
];
const cache = new Map();

export async function askChatBot(message) {
  try {
    if (!message || message.trim() === "") {
      return "질문을 입력해주세요 🙂";
    }

    if (cache.has(message)) {
      console.log("⚡ 캐시된 응답 사용");
      return cache.get(message);
    }

    conversationHistory.push({ role: "user", content: message });

    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
    });

    const answer = res.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return "죄송합니다, 답변을 가져오지 못했어요 😢";
    }

    conversationHistory.push({ role: "assistant", content: answer });
    cache.set(message, answer);

    return answer;
  } catch (error) {
    console.error("🚨 ChatBot Error:", error);
    return "현재 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요 ⚙️";
  }
}
