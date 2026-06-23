# MY Shop

말로 조건을 넣으면 상품을 골라 주는 쇼핑몰입니다.  
처음엔 CRUD 연습용으로 시작했는데, 검색·주문·결제·관리자까지 한 번에 이어지게 만들었습니다.

프론트는 Vue 3 + Vite + Pinia + Tailwind, 백엔드는 Express + MySQL + JWT입니다.

---

## 뭐가 되나

- 홈에서 문장으로 상품 찾기 (예: `5만 원대 백팩`)
- 상품 목록·상세·장바구니·찜·쿠폰
- 로그인 후 주문·결제 (PortOne 없이도 mock으로 테스트 가능)
- 관리자: 상품·주문·공지·고객 CRM
- 검색은 서버에서 처리 (Elasticsearch는 넣으면 켜짐)

OpenAI 키가 없어도 추천은 규칙 기반으로 돌아갑니다. 로컬은 MySQL만 있으면 대부분 됩니다.

---

## 로컬에서 실행

Node 18+, MySQL 필요합니다.

```bash
cd backend
cp .env.example .env    # DB, JWT_SECRET 수정
npm i

cd ../client
cp .env.example .env
npm i

cd ..
npm i
npm run setup:local     # 데모 관리자·로컬 설정
npm run dev
```

- 화면: http://localhost:5173 (포트는 Vite가 바뀔 수 있음)
- API: http://localhost:3102

서버 켜면 테이블·데모 상품·쿠폰(`WELCOME10` 등)이 없을 때 자동으로 채워집니다.

### 로그인

| | |
|---|---|
| 관리자 | `admin@myshop.com` / `MyShopAdmin1` |
| 일반 회원 | `/signup`에서 가입 |

로그인이 안 되면:

```bash
npm run fix:admin
```

그다음 `npm run dev` 다시 켜세요.

`.env`는 git에 올리지 마세요.

---

## 환경 변수

**backend/.env** — DB, `JWT_SECRET` 필수. 나머지는 선택.

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=myshop
JWT_SECRET=길고_랜덤한_문자열

ADMIN_BOOTSTRAP_EMAIL=admin@myshop.com
ADMIN_BOOTSTRAP_PASSWORD=MyShopAdmin1
```

**client/.env**

```env
VITE_API_URL=http://localhost:3102/api
VITE_DEV_MOCK_PAYMENT=true
```

`VITE_DEV_MOCK_PAYMENT=true`면 PG 없이 주문 흐름만 끝까지 확인할 수 있습니다.

배포(Railway 등)에서는 `ADMIN_BOOTSTRAP_*`를 Variables에 넣고, 로그인 확인 후 지우는 걸 권장합니다.

---

## 데모 흐름 (3분)

1. 홈에서 조건 입력 → 추천 받기
2. 장바구니 담기
3. 로그인 → 결제 (mock)
4. 마이페이지에서 주문 확인

---

## 구조

- `backend/server.js` — API 진입점
- `backend/lib/` — 인증, 결제 검증, 검색, CRM, DB 초기화 등
- `client/src/views/` — 화면
- `client/src/components/brand/` — 로고

주문 만들 때 프론트에서 보낸 금액은 그대로 안 믿고 서버에서 다시 계산합니다. 재고는 트랜잭션으로 맞춥니다.

---

## 배포

프론트 Vercel, 백엔드 Railway 쪽으로 연습해 봤습니다.  
배포할 때 DB URL·CORS·환경 변수 맞추는 게 제일 번거로웠습니다.

---

## 테스트

```bash
cd backend
npm test
```

---

개인 포트폴리오·실습용입니다. 기능이 꽤 많지만, 보여줄 때는 **홈 → 장바구니 → 결제** 한 줄만 잡아도 됩니다.
