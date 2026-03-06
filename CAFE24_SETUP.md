# 카페24 상품 연동 가이드

이 홈페이지(JJpackage)의 **상품은 카페24에서 등록·관리**하고, 카페24 Open API를 통해 **이 사이트에 표시**됩니다.

---

## 동작 방식

| 설정 | 상품 출처 |
|------|-----------|
| `CAFE24_MALL_ID` + `CAFE24_ACCESS_TOKEN` **있음** | **카페24** API에서 상품 목록·상세 조회 → 홈/상품목록/상세에 표시 |
| **없음** 또는 API 실패 시 | MySQL `products` 테이블에서 조회 (폴백) |

- 상품 등록·수정·삭제는 **카페24 쇼핑몰 관리자**에서 진행합니다.
- 이 사이트는 **조회만** 하며, 카페24에 올린 상품이 그대로 홈/카테고리/상세에 나옵니다.

---

## 1. 카페24에서 상품 등록

1. **카페24 쇼핑몰 관리자** 로그인  
   (예: https://your-mall.cafe24.com)
2. **상품** → **상품 등록**에서 상품명, 가격, 이미지, 카테고리 등 입력 후 저장
3. 등록한 상품이 이 홈페이지의 **상품 목록 / 카테고리 / 상세**에 노출되려면 아래 API 설정이 필요합니다.

---

## 2. 백엔드 환경 변수 설정

`backend/.env`에 다음을 설정합니다.

```env
# 필수 (둘 다 있어야 카페24 연동 사용)
CAFE24_MALL_ID=your_mall_id
CAFE24_ACCESS_TOKEN=your_access_token

# API URL (선택, 미입력 시 https://{CAFE24_MALL_ID}.cafe24api.com 사용)
# CAFE24_API_URL=https://your-mall.cafe24api.com
```

- **CAFE24_MALL_ID**: 카페24 쇼핑몰 ID (예: `your-mall` → URL이 `your-mall.cafe24.com`인 경우)
- **CAFE24_ACCESS_TOKEN**: 카페24 Open API용 **Access Token** (아래 3단계에서 발급)

---

## 3. Access Token 발급 (카페24 개발자센터)

1. **카페24 개발자센터** 접속: https://developers.cafe24.com
2. **앱 개발** → **앱 만들기** 또는 기존 앱 선택
3. **API 권한**에서 아래 권한 요청:
   - **상품** 읽기 (Products Read)
4. **OAuth 2.0**으로 **Access Token** 발급
   - 개발/테스트: 개발자센터에서 "토큰 발급" 등으로 발급
   - 운영: 실제 쇼핑몰 연동 후 OAuth 인증 플로우로 토큰 발급·갱신
5. 발급받은 **Access Token** 값을 `backend/.env`의 `CAFE24_ACCESS_TOKEN`에 넣습니다.

> 토큰 만료 시 재발급이 필요합니다. 운영 환경에서는 갱신 로직을 두는 것을 권장합니다.

---

## 4. 동작 확인

1. 백엔드 서버 재시작  
   (예: `cd backend && npm run dev` 또는 PM2 재시작)
2. 브라우저에서 홈페이지 접속 후 **상품 목록** 확인
3. 카페24에 등록한 상품이 보이면 연동 정상입니다.

**API 테스트 (선택)**  
백엔드에서 카페24 연동 여부를 확인하는 엔드포인트가 있다면 호출해 보세요.

- 예: `GET /api/cafe24/test` (구현된 경우)
- 또는 `GET /api/products` 응답이 카페24 상품 데이터 형식이면 카페24에서 가져온 것입니다.

---

## 5. 카테고리 매칭

- 홈페이지 **카테고리 필터** (와인병, 샴페인병, 주류병 등)는 **상품의 카테고리명**과 매칭됩니다.
- 카페24에서 상품에 지정한 **카테고리 이름**이 이 사이트의 카테고리 목록과 **같게** 넣어야, 해당 카테고리 선택 시 상품이 필터됩니다.
- 카페24 API가 반환하는 카테고리 필드명이 다를 수 있으므로, `backend/lib/cafe24.js`의 `transformProduct()`에서 `category` 매핑을 확인·수정할 수 있습니다.

---

## 6. 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| 상품이 안 나옴 | `CAFE24_MALL_ID`, `CAFE24_ACCESS_TOKEN`이 `.env`에 올바르게 설정되었는지 확인 |
| 401/403 에러 | Access Token 만료 또는 권한(상품 읽기) 미허용 여부 확인 |
| 상품은 나오는데 이미지/카테고리 안 맞음 | `backend/lib/cafe24.js`의 `transformProduct()`에서 Cafe24 API 응답 필드명과 매핑 확인 |

카페24 API 상세 스펙은 [Cafe24 개발자 문서](https://developers.cafe24.com/docs/api/admin)를 참고하세요.
