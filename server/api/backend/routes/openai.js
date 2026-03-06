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
      return res.status(400).json({ text: "질문을 입력해주세요 🙂" });
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
              "당신은 쇼핑몰 고객 상담 챗봇입니다. 친절하고 간결하게 답변하세요.",
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
      "죄송합니다, 답변을 생성하지 못했어요 😢";

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
        text: "요청이 너무 많아요. 잠시 후 다시 시도해주세요 ⚙️",
      });
    }

    res.status(500).json({
      text: "현재 서버 응답이 지연되고 있어요. 잠시 후 다시 시도해주세요 ⚙️",
    });
  }
});

export default router;
