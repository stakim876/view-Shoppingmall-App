# My Shop

**말로 고르는 쇼핑** — 자연어로 상품을 찾고, 바로 담아 결제까지 이어지는 풀스택 쇼핑몰 데모입니다.

Vue 3 + Vite + Pinia + Tailwind (프론트) · Express + MySQL + JWT (백엔드)

포트폴리오·실습용 프로젝트입니다. 로컬에서는 **MySQL만 있으면** 대부분 동작합니다. (Elasticsearch·PortOne·SMTP는 선택)

---

## 한눈에 보기

| 구분 | 내용 |
|------|------|
| 홈 | AI 추천 스트립 + 상품 카탈로그 (구매 중심 레이아웃) |
| AI 추천 | 자연어 → DB 조건 → **등록된 상품만** 최대 3개 추천 |
| 쇼핑 흐름 | 상품 → 장바구니 → 결제(mock/PortOne) → 주문 조회 |
| 인증 | JWT, 라우트 가드, 서버 `authenticateToken` |
| 보너스 | 서버 검색·맞춤 추천·관리자 CRM·AI KPI (발표 시 선택적으로 소개) |

---

## 30초 데모 시나리오

1. 홈에서 **「5만 원대 백팩」** 같은 문장 입력 → **추천 받기**
2. 추천 상품 **장바구니 담기** → 헤더 장바구니 이동
3. **회원가입** 또는 로그인 후 **결제** (PortOne 없이 mock 결제 가능)
4. 마이페이지에서 **주문 내역** 확인
5. (선택) `admin@myshop.com`으로 `/admin` — 상품·주문·CRM

---

## 로컬 실행

**요구 사항:** Node 18+, MySQL

```bash
# 1. 백엔드 환경
cd backend
cp .env.example .env   # DB, JWT_SECRET 등 수정
npm i

# 2. 프론트 환경
cd ../client
cp .env.example .env
npm i

# 3. (선택) DB·시드 자동 설정
cd ..
npm i
npm run setup:local

# 4. 개발 서버 (API + 클라이언트 동시 실행)
npm run dev
```

- 프론트: `http://localhost:5173`
- API: `http://localhost:3102` (`.env`의 `PORT`)

서버 기동 시 `schemaBootstrap`이 테이블·데모 상품·쿠폰(`WELCOME10` 등)을 없으면 자동 생성합니다.

### 테스트 계정

| 용도 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | `admin@myshop.com` | `MyShopAdmin1` |

일반 회원은 `/signup`에서 가입하면 됩니다.

> **주의:** `.env` 파일은 git에 올리지 마세요. `.env.example`만 참고하세요.

---

## 환경 변수 (자주 쓰는 것)

**backend/.env**

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=myshop
JWT_SECRET=16자_이상_랜덤_문자열

# 선택 — AI·챗봇
OPENAI_API_KEY=

# 선택 — Elasticsearch (없으면 MySQL 검색)
# ELASTICSEARCH_URL=http://localhost:9200

# 선택 — PortOne 결제 검증
# PORTONE_API_KEY=
# PORTONE_API_SECRET=
```

**client/.env**

```env
VITE_API_URL=http://localhost:3102/api

# PortOne 없이 주문 테스트 (기본 true)
VITE_DEV_MOCK_PAYMENT=true
# VITE_PORTONE_STORE_ID=impXXXXXXXX
```

`VITE_DEV_MOCK_PAYMENT=true`이면 PG 없이 `dev_imp_*` mock 결제로 주문·검증 흐름을 끝까지 테스트할 수 있습니다.

---

## 주요 기능

- 회원가입 / 로그인 / 비밀번호 재설정
- 상품 목록·상세·카테고리·리뷰
- 홈 AI 추천 (자연어 → MySQL 상품)
- 장바구니 / 찜 / 쿠폰
- 주문 생성·조회 (서버 금액·재고 재검증, PortOne 또는 mock)
- 맞춤 추천 (구매·찜·최근 본 상품)
- 서버 검색 + 관련도 정렬 (+ 선택 Elasticsearch)
- 관리자: 상품·주문·공지·고객 CRM·AI KPI
- 재입고 알림 / 챗봇 / 방문자 통계

---

## 구현 포인트

### 주문·결제
- 프론트 `total_price`를 그대로 믿지 않고 **서버에서 재계산** 후 불일치 시 거절
- 재고는 트랜잭션 + `SELECT ... FOR UPDATE`로 동시 주문 방지
- PortOne 키가 있으면 `imp_uid` 검증, 없으면 mock(`dev_imp_*`) 허용

### AI 추천
- OpenAI는 **조건 JSON**만 추출하고, 상품은 항상 **MySQL SELECT** 결과
- 조건에 맞는 상품이 없으면 인기 상품으로 fallback

### 인증
- JWT를 axios 인터셉터로 자동 첨부
- 401/403 시 로그인 페이지로 (로그인 실패 401은 제외)
- 라우트 가드 + 서버 `authenticateToken` 이중 검증

---

## 프로젝트 구조

백엔드 진입점: `backend/server.js`  
공통 로직: `backend/lib/` (`auth`, `portone`, `schemaBootstrap`, `searchEngine`, `personalizedRecommend`, `adminCrm` 등)

프론트: `client/src/` — `views/`, `components/brand/`, `store/`, `lib/`

---

## API 요약

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/products` | 상품 목록 (search, category, page…) |
| GET | `/api/search` | 검색 전용 |
| POST | `/api/ai/recommend` | AI 자연어 추천 |
| GET | `/api/recommendations/personalized` | 맞춤 추천 |
| POST | `/api/orders` | 주문 생성 (인증 필요) |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/admin/users` | 고객 목록 (관리자) |

---

## 포트폴리오·면접에서 강조할 것

**핵심 4단:** AI 추천 → 상품 탐색 → 주문·결제 → 관리자 운영

**보너스 (시간 있을 때만):** Elasticsearch 검색, CRM 세그먼트/LTV, AI 전환 KPI

기능이 많아도 데모는 **홈 AI → 장바구니 → mock 결제** 한 줄기만 보여줘도 충분합니다.

---

## 테스트

```bash
cd backend
npm test
```
