console.log("✅ Loaded API Key:", import.meta.env.VITE_OPENAI_API_KEY);
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function askChatBot(message) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 쇼핑몰 AI 도우미입니다. 상품 추천, 주문, 배송 관련 문의에 대해 간단하고 친절하게 한국어로 답변하세요.",
        },
        { role: "user", content: message },
      ],
    });

    return (
      res?.choices?.[0]?.message?.content?.trim() ||
      "죄송합니다, 답변을 가져오지 못했어요 😢"
    );
  } catch (error) {
    console.error("❌ OpenAI API Error:", error);
    return "현재 AI 서버 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요 🙏";
  }
}
