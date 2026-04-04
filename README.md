# My Shop

포폴 겸 연습으로 만든 쇼핑몰 데모. 사이트 카피는 셀렉트샵 느낌으로 잡아 놨고, 관리자가 상품·주문·공지 건드리고 사용자는 담기→결제→배송 조회까지 도는 구조로 맞춰 둠.

프론트는 Vue 3, Vite, Pinia, Vue Router, Tailwind. API는 `client/src/lib/api.js` axios 한 군데로만 쓰고, 인터셉터에서 Bearer 달고 401/403(토큰 깨짐)이면 로컬 스토리지 비운 뒤 로그인으로 보냄. 다크모드는 `useTheme`, 체크아웃은 다음 우편번호로 주소만 받아오게 해둠. 홈은 히어로·캐러셀·추천 상품 위주.

## 에러 처리

프론트는 `errorHandler.js`에서 타임아웃·끊김·HTTP 코드별로 사용자 문구 한번 정리해 두고, axios 인터셉터가 `error.userMessage`에 붙임. 페이지마다 `catch`에서 토스트나 본문에 뿌림. `main.js`에 Vue 전역 `errorHandler`, `unhandledrejection`, `router.onError`까지 걸어서 컴포넌트 밖에서 터진 것도 그냥 하얀 화면만 나오진 않게 함.

백은 검증·권한·비즈니스 규칙 깨지면 status랑 `message`/`code`로 내려주고, DB는 라우트에서 `try/catch`. 주문은 트랜잭션, 금액이랑 쿠폰은 서버에서 다시 까서 안 맞으면 거절. 테이블 없으면 그 기능만 빈 값·안내로 넘기는 코드도 있음(SQL 깔면 본격 동작).

보려면: `client/src/lib/errorHandler.js`, `api.js`, `main.js` / 백은 `backend/server.js`의 `fail()`이랑 각 라우트 `catch`.

## 백엔드

진짜 쓰는 API는 `backend/server.js` 한 파일이 진입점. (루트에 다른 `server/` 폴더 있어도 프론트는 `VITE_API_URL`이 가리키는 쪽만 보면 됨.) JSON은 대부분 `success` / `message` 패턴.

로직은 `backend/lib/`에 흩어 놨음. 인증·비번 해시·JWT는 `auth.js`, 상품 목록 쿼리 조립은 `productQuery.js` — 여기서 `sortBy`는 화이트리스트만 통과. 쿠폰은 `coupon.js`에서 기간·최소금액·정액정률·사용횟수 체크. 로그인 실패/캡차는 `loginSecurity`, Turnstile은 `captcha`, 메일은 `mailer`, 택배 조회 링크 조립은 `tracking.js`.

`GET /api/products`는 옛날 호환 때문에 기본이 배열이고, 메타까지 필요하면 `withMeta=1`. 목록은 메모리에 잠깐 캐시했다가 상품 바뀌면 비움. 인덱스는 `database/performance_indexes.sql` 참고.

주문 `POST /api/orders`는 트랜잭션. 서버가 다시 깐 금액이랑 클라이언트 `total_price`가 어긋나면 거절하고, 쿠폰도 서버에서 한 번 더 검증함. `imp_uid` / `merchant_uid`는 컬럼 있을 때만 넣게 해서 스키마 덜 맞춘 DB에서도 안 터지게 해둠.

배송 상태는 paid → preparing → shipping → done 기준으로 마이페이지에 타임라인 그렸고, 예전에 쓰던 shipped 같은 값도 라벨에서 흡수. 관리자가 택배사·송장 넣으면 조회 URL까지 내려줌.

JWT 로그인. 관리자는 `ADMIN_INVITE_CODE` 있는 `/signup-admin` 쪽. 비번 찾기·재입고 메일은 SMTP 없으면 그냥 안 감. 챗봇은 `POST /api/ai/chat`, OpenAI 키는 백엔드 env에만 (프론트에 넣지 말 것). 나머지는 찜, 리뷰, 공지, 관리자 KPI, 짧은 analytics 정도.

## DB

처음 한 번에 박을 거면 `init_full.sql`. 이후 기능별로 `coupons.sql`, `wishlist.sql`, `reviews_and_gallery.sql`, `notices.sql`, `restock_subscriptions.sql`, `order_tracking.sql`, `orders_update.sql` 같은 거 골라서. 테이블 없으면 어떤 API는 빈 결과로 넘어가서, 기능이 안 붙으면 SQL 안 깐 경우부터 의심하면 됨.

## env

전체 목록은 `backend/.env.example`, `client/.env.example`. 포트는 백 `PORT`랑 `VITE_API_URL`이랑 꼭 짝 맞추고, CORS랑 `CLIENT_BASE_URL`은 보통 로컬이면 `http://localhost:5173`.

## 로컬

MySQL 깔고, Node 18쯤 있으면 됨.

```bash
cd backend && npm i && cp .env.example .env
cd ../client && npm i && cp .env.example .env
```

윈도우면 `cp` 대신 `copy`.

루트에서 `npm i` 하고 `npm run dev` 하면 concurrently로 백이랑 Vite 같이 올라감.

## 페이지 대충

`/home` 메인, `/products` `/product/:id` 상품, `/cart` `/wishlist`, `/checkout`은 로그인 후 쿠폰+포트원, `/order-complete`, `/order/:id`, `/mypage` 주문·타임라인, `/notice`, `/admin` 운영판, `/admin-signup`. `/order-lookup`은 번호 치는 화면만 있는데 상세 API가 JWT+본인/관리자라 비회원만으로는 안 열릴 수 있음 — 그냥 그렇게 묶여 있음.

배포는 [DEPLOYMENT.md](./DEPLOYMENT.md), 결제 연습은 [PAYMENT_REHEARSAL_CHECKLIST.md](./PAYMENT_REHEARSAL_CHECKLIST.md).

