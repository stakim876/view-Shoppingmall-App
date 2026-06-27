import { ref, onUnmounted } from "vue";

// [면접] Web Speech API — Chrome/Edge의 SpeechRecognition, 별도 API 키 없음 (브라우저 마이크 권한 필요)
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useSpeechRecognition(options = {}) {
  const { lang = "ko-KR", onResult, onError } = options;

  const isSupported = !!getSpeechRecognition();
  const isListening = ref(false);
  const errorMessage = ref("");

  let recognition = null;

  const stop = () => {
    if (!recognition) return;
    try {
      recognition.stop();
    } catch {
    }
    isListening.value = false;
  };

  const start = () => {
    errorMessage.value = "";
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      errorMessage.value = "이 브라우저는 음성 입력을 지원하지 않습니다. (Chrome·Edge 권장)";
      onError?.(errorMessage.value);
      return;
    }

    if (isListening.value) {
      stop();
      return;
    }

    recognition = new SpeechRecognitionCtor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      isListening.value = true;
    };

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || "";
      if (transcript) onResult?.(transcript);
    };

    recognition.onerror = (event) => {
      const code = event?.error;
      if (code === "aborted") {
        errorMessage.value = "";
      } else if (code === "no-speech") {
        errorMessage.value = "음성이 들리지 않았습니다. 다시 말씀해 주세요.";
      } else if (code === "not-allowed") {
        // [면접] 마이크 거부 시 UI에서 mic-denied로 안내 (브라우저 사이트 설정에서 허용 필요)
        errorMessage.value = "mic-denied";
      } else {
        errorMessage.value = "음성 인식에 실패했습니다. 다시 시도해 주세요.";
      }
      if (errorMessage.value) onError?.(errorMessage.value);
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };

    try {
      recognition.start();
    } catch {
      errorMessage.value = "음성 입력을 시작할 수 없습니다.";
      onError?.(errorMessage.value);
      isListening.value = false;
    }
  };

  const toggle = () => {
    if (isListening.value) stop();
    else start();
  };

  onUnmounted(stop);

  return {
    isSupported,
    isListening,
    errorMessage,
    start,
    stop,
    toggle,
  };
}
