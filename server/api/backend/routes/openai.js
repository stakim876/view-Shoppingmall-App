import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        text: "서버에 OpenAI API 키가 설정되지 않았어요. 관리자에게 문의해주세요.",
      });
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ text: "질문을 입력해 주세요." });
    }

    const { data } = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              process.env.OPENAI_SYSTEM_PROMPT ||
              "당신은 쇼핑몰 쇼핑 도움말 담당입니다. 배송·교환·상품 문의에 친절하고 간결하게 답합니다. 답변에 이모지는 사용하지 마세요.",
          },
          { role: "user", content: message.trim() },
        ],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "죄송합니다. 답변을 생성하지 못했습니다.";

    res.json({ text });
  } catch (err) {
    console.error("❌ OpenAI API 오류:", err.response?.data || err.message);

    const status = err.response?.status;
    const message = err.response?.data?.error?.message || err.message;

    if (status === 401) {
      return res.status(500).json({
        text: "API 키가 올바르지 않아요. 관리자에게 문의해주세요.",
      });
    }
    if (status === 429) {
      return res.status(503).json({
        text:
          "지금은 질문 처리 한도에 걸려 잠시 답변이 어렵습니다. 1~2분 뒤에 다시 시도해 주세요. 계속되면 OpenAI 계정의 사용량·결제를 확인해 주세요.",
      });
    }

    res.status(500).json({
      text: "일시적으로 응답을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
});

export default router;
