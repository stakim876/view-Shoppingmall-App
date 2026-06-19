# My Shop — AI Curator

자연어로 상품을 고르는 **AI 큐레이션 쇼핑몰** 데모입니다.  
처음 목표는 “CRUD 쇼핑몰”이었는데, 만들다 보니 **AI 추천 → 검색 → 결제 → 운영(관리자/CRM)** 까지 한 흐름으로 보여주고 싶어졌습니다.

프론트는 Vue3 + Vite, Pinia, Tailwind.  
백엔드는 Express + MySQL, 인증은 JWT입니다.

포트폴리오 + 실습용으로 만든 프로젝트입니다.  
기능이 꽤 많아진 건 사실인데, 로컬에서는 **MySQL만 있어도** 대부분 돌아가게 맞춰 두었습니다. (Elasticsearch는 선택)

---

## 이 프로젝트에서 보여주려는 것

1. **AI 큐레이터** — “5만 원대 백팩” 같은 자연어 → DB 상품 기반 추천  
2. **검색** — 서버 검색 + 관련도 정렬 + (선택) Elasticsearch  
3. **맞춤 추천** — 구매·찜·최근 본 상품 기반  
4. **CRM** — 관리자에서 고객 세그먼트, LTV, CSV export  
5. **실제 쇼핑 흐름** — 장바구니 → 결제(PortOne) → 주문 조회

---

## AI 큐레이터

- 홈에서 **자연어 조건 입력 → 등록 상품만** 추천 (DB에 없는 건 안 뜸)
- OpenAI로 요청을 **예산·카테고리·키워드**로 해석 (키 없으면 규칙 기반 fallback)
- 추천 **요청 / 노출 / 클릭 / 장바구니** 이벤트 수집
- 관리자 대시보드에서 **AI 전환 지표** 확인

---

## 검색

예전엔 프론트에서 상품 전체 받아와서 `filter()` 했는데, 상품 늘어나면 당연히 한계가 있어서 **서버 검색**으로 바꿨습니다.

- `GET /api/products?search=...` — 필터·정렬·페이지네이션
- `GET /api/search?q=...` — 검색 전용 API
- MySQL **관련도 점수** (이름 일치 > 부분 일치 > 설명 > 카테고리)
- 검색어 **서버 집계** (`search_events`) + 인기 검색어 API
- **Elasticsearch** (선택): `ELASTICSEARCH_URL` 넣으면 ES 사용, 없으면 MySQL

로컬 개발할 때 ES 안 깔아도 됩니다. 저도 기본은 MySQL로만 테스트합니다.

---

## 맞춤 추천 (개인화)

AI 추천이랑 별개로, **이미 행동한 데이터**로 추천하는 API도 넣었습니다.

- `GET /api/recommendations/personalized`
- 가중치: **구매 이력(3) > 찜(2) > 최근 본 상품(1)**
- 홈 AI 패널 + 마이페이지에 표시
- 비로그인도 **최근 본 상품 ID**만 있으면 어느 정도 동작

---

## 고객 CRM (관리자)

`/admin` → **고객 CRM** 탭

- 고객 목록 (이름/이메일 검색)
- 세그먼트: **VIP / 활성 / 신규 / 휴면 / 일반**
- **평균 LTV** 등 요약 KPI
- **CSV 내보내기**
- 고객 상세 → 최근 주문

세그먼트 기준은 `backend/.env.example`의 `CRM_*` 변수로 조절 가능합니다.

---

## 주요 기능 (전체)

- 회원가입 / 로그인 / 마이페이지
- 상품 목록·상세·카테고리·리뷰
- 장바구니 / 찜 / 쿠폰
- 주문 생성·조회 (서버 금액 재검증)
- PortOne 결제
- 관리자: 상품·주문·공지·**고객 CRM**·**AI KPI**
- 재입고 알림 / 챗봇 / 방문자 통계

---

## 배포 관련

프론트는 Vercel, 백엔드는 Render/Railway 쪽으로 붙여보면서 연습했습니다.

배포하면서 제일 많이 막힌 건 **DB 연결**이었습니다.  
로컬 `localhost`랑 배포 서버 `localhost`는 완전 다른 얘기더라고요.  
그때 외부 DB URL·SSL 설정 필요하다는 걸 제대로 이해했습니다.

---

## 구현하면서 바꾼 것들

### 1) 주문 금액 검증
프론트 `total_price` 그대로 받지 않고, **서버에서 다시 계산**합니다.  
조작해서 보내면 주문 거절.

### 2) 인증 에러 공통 처리
401/403이 페이지마다 반복돼서 `client/src/lib/api.js` 인터셉터로 모았습니다.

### 3) 스키마 차이 대응
환경마다 컬럼/테이블이 달라서 터진 적이 있어서,  
`imp_uid` 같은 건 **있을 때만** 저장하고, 테이블 없으면 해당 기능만 graceful fallback.

### 4) 검색·CRM 추가 (최근)
- 클라이언트 필터 검색 → **서버 검색**
- 관리자 **고객 탭 없음** → **CRM + CSV**
- AI만 추천 → **구매 이력 기반 맞춤 추천** 추가

---

## 구조 (현재)

백엔드 진입점은 아직 `backend/server.js` 하나입니다.  
기능 늘어나면서 파일이 커져서, 공통 로직은 `backend/lib`로 빼는 중입니다.

| 파일 | 역할 |
|------|------|
| `auth.js` | JWT, 비밀번호 |
| `productQuery.js` | 상품 목록 쿼리 |
| `searchEngine.js` | 검색 관련도 점수 |
| `searchAnalytics.js` | 검색어 집계 |
| `elasticsearch.js` | ES 연동 (선택) |
| `personalizedRecommend.js` | 맞춤 추천 |
| `adminCrm.js` | CRM 세그먼트·export |
| `coupon.js` / `mailer.js` / `tracking.js` 등 | 기타 |

다음에 손대고 싶은 건 **라우트를 도메인별로 분리**하는 것.

---

## 로컬 실행

MySQL + Node 18 기준.

```bash
cd backend
cp .env.example .env   # DB/JWT 등 수정
npm i

cd ../client
npm i

cd ..
npm i
npm run dev
```

- 프론트: 보통 `http://localhost:5173`
- 백엔드: `.env`의 `PORT` (기본 3102)

### 환경 변수 (자주 쓰는 것)

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

# 선택 — CRM 기준
# CRM_VIP_MIN_SPENT=500000
```

**client/.env**

```env
VITE_API_URL=http://localhost:3102/api
```

---

## API 한눈에

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/products` | 상품 목록 (search, category, page…) |
| GET | `/api/search` | 검색 전용 |
| GET | `/api/search/popular` | 인기 검색어 |
| POST | `/api/ai/recommend` | AI 자연어 추천 |
| GET | `/api/recommendations/personalized` | 맞춤 추천 |
| GET | `/api/admin/users` | 고객 목록 (CRM) |
| GET | `/api/admin/users/export` | 고객 CSV |
| GET | `/api/admin/crm/summary` | CRM KPI |

---

## 솔직한 후기

기능 체크리스트 채우려다 보니 “검색 엔진”, “CRM”, “추천”까지 욕심이 났습니다.  
근데 **전부 필수는 아닙니다.** 데모·포트폴리오로 보여줄 땐 AI 큐레이터 + 주문 흐름 + 관리자 정도만 집어도 충분해요.

Elasticsearch나 CRM 세그먼트는 “이것도 할 수 있다”는 **보너스 레이어**로 넣어 둔 거라,  
발표할 때는 **AI → 검색 → 결제 → 운영** 4단만 이야기해도 됩니다.

---

## 테스트

```bash
cd backend
npm test
```
