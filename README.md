# MY Shop - 유리병 전문 쇼핑몰

투명한 품질, 깨끗한 선택 — 당신의 일상을 더욱 특별하게 만드는 프리미엄 유리병 전문샵

## 🚀 시작하기

### 사전 요구사항

- Node.js (v18 이상)
- MySQL (v8.0 이상)
- npm 또는 yarn

### 설치 방법

1. 저장소 클론:
```bash
git clone <repository-url>
cd my-shop
```

2. Backend 설정:
```bash
cd backend
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일을 열어 데이터베이스 정보 등 실제 값 입력
```

3. Frontend 설정:
```bash
cd client
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일을 열어 API URL 등 실제 값 입력
```

4. 데이터베이스 설정:
```sql
CREATE DATABASE myshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. 개발 서버 실행:

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd client
npm run dev
```

## 📁 프로젝트 구조

```
my-shop/
├── backend/          # Express.js 백엔드 서버
│   ├── lib/         # 유틸리티 및 라이브러리
│   ├── server.js    # 메인 서버 파일
│   └── .env         # 환경 변수 (생성 필요)
├── client/          # Vue.js 프론트엔드
│   ├── src/
│   │   ├── components/  # Vue 컴포넌트
│   │   ├── store/       # Pinia 스토어
│   │   ├── router/      # Vue Router
│   │   └── lib/         # 유틸리티
│   └── .env         # 환경 변수 (생성 필요)
└── DEPLOYMENT.md    # 배포 가이드
```

## 🔧 환경 변수 설정

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=replace_with_strong_random_secret
JWT_EXPIRES_IN=7d
ADMIN_INVITE_CODE=replace_with_admin_invite_code
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=myshop
DB_PORT=3306
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001/api
VITE_PORTONE_STORE_ID=impXXXXXXXX
VITE_OPENAI_API_KEY=your_openai_api_key
```

자세한 내용은 각 디렉토리의 `.env.example` 파일을 참고하세요.

## 📦 주요 기능

- ✅ 상품 조회 및 검색
- ✅ 장바구니 기능
- ✅ 주문 및 결제
- ✅ 쿠폰 할인 (정액/정률)
- ✅ 관리자 페이지
- ✅ AI 챗봇
- ✅ 카테고리 필터링
- ✅ 가격대 필터링
- ✅ 정렬 기능
- ✅ 페이지네이션
- ✅ Toast 알림 시스템
- ✅ 스켈레톤 로딩
- ✅ 재입고 알림 신청 (품절 상품 이메일 알림)

## 🔎 상품 API 고도화

- `GET /api/products`는 `search`, `category`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`, `page`, `limit`를 지원합니다.
- 기본 응답은 기존 호환을 위해 배열입니다.
- `withMeta=1`을 추가하면 페이지네이션 메타가 포함된 객체 응답을 받습니다.
- 조회 성능을 위해 응답 캐시(TTL 기본 60초)를 사용하며, 상품 추가/수정/삭제 시 캐시를 무효화합니다.
- DB 인덱스는 `backend/database/performance_indexes.sql`을 실행해 적용할 수 있습니다.
- 재입고 알림 기능은 `backend/database/restock_subscriptions.sql` 실행 후 사용할 수 있습니다.

## 🛠️ 기술 스택

### Frontend
- Vue 3 (Composition API)
- Pinia (상태 관리)
- Vue Router
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MySQL

## 📚 배포

프로덕션 배포 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md) 파일을 참고하세요.
결제 리허설은 [PAYMENT_REHEARSAL_CHECKLIST.md](./PAYMENT_REHEARSAL_CHECKLIST.md) 파일을 참고하세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
