# MY Shop

처음엔 상품 CRUD 연습하려고 만든 프로젝트인데, 하다 보니 **주문·결제·관리자**까지 붙이는 게 맞겠다 싶어서 이렇게까지 키웠습니다.  
기능은 **기업이 실제로 보는 것**만 남겼어요. 화려한 UI나 AI 데모보다, 쇼핑이 끝까지 되는지·주문을 믿을 수 있는지가 중요하다고 생각합니다.

**Vue 3 + Vite + Pinia + Tailwind** / **Express + MySQL + JWT**

---

## 있는 기능 (핵심만)

| 구분 | 내용 |
|------|------|
| 쇼핑 | 홈(베스트·신상·카테고리) → 상품 목록·상세 → 장바구니 → 결제 → 주문 확인 |
| 회원 | 가입·로그인·마이페이지·찜·쿠폰 |
| 상품 | 검색·필터·리뷰(상세 페이지) |
| 운영 | 관리자 — 상품·주문·공지 |
| 기타 | 주문/배송 조회, 공지사항 |

**빼 둔 것:** 쉬운 장보기, AI 큐레이터, CRM, 견적문의 등 — 포트폴리오 설명에 집중하려고 메뉴에서 제거했습니다. (백엔드 API는 남아 있을 수 있음)

---

## 이 프로젝트에서 말하고 싶은 것

- 프론트 금액을 **서버에서 다시 검증** (쿠폰·배송비 포함)
- 재고 **트랜잭션 + `FOR UPDATE`**
- 홈은 **전환 구조** (베스트·신상·카테고리), 전체 목록은 `/products`
- 관리자에서 **상품·주문·공지** 처리

설계 메모: [`docs/INTERVIEW_ARCHITECTURE.md`](docs/INTERVIEW_ARCHITECTURE.md)

---

## 로컬 실행

Node 18+, MySQL 필요합니다.

```bash
cd backend
cp .env.example .env
npm i

cd ../client
cp .env.example .env
npm i

cd ..
npm i
npm run setup:local
npm run dev
```

- 화면: http://localhost:5173
- API: http://localhost:3102

### 테스트 계정

| | |
|---|---|
| 관리자 | `admin@myshop.com` / `MyShopAdmin1` |
| 일반 회원 | `/signup`에서 가입 |

로그인 안 되면 `npm run fix:admin` 후 `npm run dev` 다시 실행.

**client/.env**

```env
VITE_API_URL=http://localhost:3102/api
VITE_DEV_MOCK_PAYMENT=true
```

PG 없이 mock 결제로 주문 흐름까지 확인할 수 있습니다.

---

## 데모 (3분)

1. 홈 — 베스트·신상·카테고리
2. 상품 담기 → 장바구니 → 로그인 → 결제(mock)
3. 마이페이지 주문 확인
4. 관리자 — 주문 상태 변경

---

## 테스트

```bash
cd backend
npm test
```

---

개인 포트폴리오용입니다.
