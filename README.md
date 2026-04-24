# My Shop

포트폴리오 + 실습용으로 만든 쇼핑몰 데모입니다.
셀렉트샵 느낌으로 화면을 구성했고, 관리자/사용자 기능을 분리해서 실제 쇼핑 흐름(담기 → 결제 → 배송조회)이 이어지도록 만들었습니다.

프론트는 Vue 3(Vite) 기반이고, 상태는 Pinia, 라우팅은 Vue Router, 스타일은 Tailwind를 사용했습니다.
API 요청은 `client/src/lib/api.js`에서만 호출하게 정리해 뒀고, 인터셉터에서 토큰/인증 에러를 공통 처리합니다.

## 배포 주소

- 프론트: https://view-shoppingmall-app.vercel.app/home
- API: (여기에 Railway 주소)/api

API 주소는 Railway 백엔드 서비스(`view-Shoppingmall-App`)의 `Settings > Networking`에서 확인할 수 있습니다.
형식은 `https://xxxxx.up.railway.app`이고, 이 프로젝트에서는 뒤에 `/api`를 붙여 사용합니다.

참고로 Trial expired 상태에서는 서비스가 offline으로 떠서 도메인 확인/접속이 막힐 수 있습니다.

## 설계 포인트

처음부터 기능을 많이 붙이기보다, 실제로 자주 터지는 부분을 먼저 막는 쪽으로 구현했습니다.

- API/인증 예외 처리 지점을 한 군데(`api.js`)로 모아 유지보수 비용 줄임
- 백엔드 응답 포맷을 `status + message/code`로 맞춰 프론트 분기 단순화
- 주문 금액/쿠폰은 서버에서 다시 계산해서 클라이언트 조작 방지
- 스키마가 덜 갖춰진 DB에서도 핵심 기능은 죽지 않게 방어 코드 추가

개인적으로는 여기서 트레이드오프가 있었다고 생각합니다.
`backend/server.js` 단일 진입은 처음엔 빠르게 기능 붙이기 좋았는데, 파일이 커지면서 수정 범위 파악이 어려워졌습니다.
그래서 공통 로직(`auth.js`, `coupon.js`, `productQuery.js` 등)은 `backend/lib`로 계속 분리해 왔고,
다음 단계에서는 라우트도 도메인 단위로 쪼개는 걸 목표로 두고 있습니다.

## 에러 처리

프론트는 `errorHandler.js`에서 타임아웃·끊김·HTTP 코드별로 사용자 문구 한번 정리해 두고, axios 인터셉터가 `error.userMessage`에 붙임. 페이지마다 `catch`에서 토스트나 본문에 뿌림. `main.js`에 Vue 전역 `errorHandler`, `unhandledrejection`, `router.onError`까지 걸어서 컴포넌트 밖에서 터진 것도 그냥 하얀 화면만 나오진 않게 함.

백은 검증·권한·비즈니스 규칙 깨지면 status랑 `message`/`code`로 내려주고, DB는 라우트에서 `try/catch`. 주문은 트랜잭션, 금액이랑 쿠폰은 서버에서 다시 까서 안 맞으면 거절. 테이블 없으면 그 기능만 빈 값·안내로 넘기는 코드도 있음(SQL 깔면 본격 동작).

보려면: `client/src/lib/errorHandler.js`, `api.js`, `main.js` / 백은 `backend/server.js`의 `fail()`이랑 각 라우트 `catch`.

## 작업하면서 막혔던 부분

1. 클라이언트 총액 신뢰 문제
   - 초반엔 프론트에서 넘어온 `total_price`를 그대로 쓰고 있었는데, 쿠폰/수량 조작 여지가 보여서 서버 재계산으로 바꿨습니다.
   - `POST /api/orders`에서 서버 계산값이 다르면 주문을 바로 거절합니다.
   - 이 부분은 실제로 테스트할 때 브라우저에서 요청값을 바꿔 보내보면서 확인했습니다.

2. 401/403 이후 화면 꼬임
   - 토큰 만료 시 요청이 여러 개 동시에 실패하면 화면 상태가 꼬이는 문제가 있었고,
   - 인터셉터에서 스토리지 정리 + 로그인 이동으로 공통 처리하도록 정리했습니다.

3. 환경별 DB 스키마 차이
   - 로컬/배포 환경에서 결제 컬럼이 완전히 같지 않은 경우가 있어서 저장 단계에서 에러가 났고,
   - `imp_uid`/`merchant_uid`는 컬럼이 있을 때만 넣게 수정했습니다.

4. 테이블 미구성 시 전체 장애
   - SQL을 일부만 적용한 상태에서 특정 라우트가 500으로 터지는 경우가 있었고,
   - 없는 테이블은 빈 결과/안내로 넘겨서 구매/주문 같은 핵심 흐름은 유지하게 처리했습니다.

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

배포: 포폴용 **Vercel + Railway(MySQL)** 는 [VERCEL_RAILWAY.md](./VERCEL_RAILWAY.md). VPS·Nginx는 [DEPLOYMENT.md](./DEPLOYMENT.md). 결제 연습은 [PAYMENT_REHEARSAL_CHECKLIST.md](./PAYMENT_REHEARSAL_CHECKLIST.md).
