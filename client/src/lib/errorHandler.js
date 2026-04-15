

export function getErrorMessage(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      return "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    }
    if (error.message.includes("Network Error")) {
      return "네트워크 연결을 확인해주세요.";
    }
    return "서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.";
  }

  const status = error.response.status;
  const message = error.response.data?.message || error.response.data?.error;

  switch (status) {
    case 400:
      return message || "잘못된 요청입니다. 입력 정보를 확인해주세요.";
    case 401:
      // 로그인 실패(401)도 같은 코드라서, 서버가 준 message(예: 비번 오류)를 우선 표시
      return message || "로그인이 필요합니다.";
    case 403:
      return "접근 권한이 없습니다.";
    case 404:
      return message || "요청한 정보를 찾을 수 없습니다.";
    case 429:
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
    case 500:
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    case 503:
      return "서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
    default:
      return message || `오류가 발생했습니다. (${status})`;
  }
}

export function logError(error, context = "") {
  const message = getErrorMessage(error);
  console.error(`❌ ${context ? `[${context}] ` : ""}${message}`, error);
  return message;
}

export const ErrorType = {
  NETWORK: "NETWORK",
  SERVER: "SERVER",
  CLIENT: "CLIENT",
  UNKNOWN: "UNKNOWN",
};

export function getErrorType(error) {
  if (!error.response) {
    return ErrorType.NETWORK;
  }
  const status = error.response.status;
  if (status >= 500) {
    return ErrorType.SERVER;
  }
  if (status >= 400) {
    return ErrorType.CLIENT;
  }
  return ErrorType.UNKNOWN;
}
