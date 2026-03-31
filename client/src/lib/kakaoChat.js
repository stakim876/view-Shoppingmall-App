
const PLACEHOLDER_RE = /yourChannelId|xXXXXX/i;
const CHAT_URL_RE = /^https:\/\/pf\.kakao\.com\/_[^/]+\/chat$/i;
const FALLBACK = "https://center-pf.kakao.com/";

export function getKakaoChatUrl(raw) {
  const url = String(raw || "").trim();
  if (!url || PLACEHOLDER_RE.test(url) || !CHAT_URL_RE.test(url)) {
    return FALLBACK;
  }
  return url;
}
