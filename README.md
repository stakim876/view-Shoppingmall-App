📦 MyShop – Vue 쇼핑몰 웹 서비스

Vue 3 + Node.js + MySQL 기반의 풀스택 쇼핑몰 프로젝트입니다.
사용자 인증, 상품/장바구니/주문 기능은 물론 **OpenAI API 기반 AI 챗봇(MyShop AI 도우미)**까지 포함된 실전형 웹 서비스입니다.

🚀 주요 기능
🔐 회원 인증

JWT 기반 로그인/회원가입

Axios Interceptor로 모든 요청에 토큰 자동 주입

로그인 상태 유지(LocalStorage 활용)

🛍 상품 기능

상품 목록 조회

단일 상품 상세 조회

장바구니 담기 (수량 관리 포함)

🛒 장바구니 기능 (Pinia)

전역 상태 관리(Pinia)

로그인 후에도 장바구니 유지

주문 시 자동으로 데이터 변환

📦 주문 기능(Checkout)

배송 정보 입력

장바구니 기반 주문 생성 API

MySQL에 주문/주문상품 테이블 저장

🤖 MyShop AI 도우미 (ChatGPT 기반)

프로젝트의 핵심 차별화 기능입니다.

✔ 기능 설명

Vue 컴포넌트로 구현된 플로팅 챗봇 UI

Node.js 서버에서 OpenAI API 호출

API 키는 백엔드에서만 관리해 보안 강화

사용자의 질문 → Node 서버 → OpenAI → Vue로 답변 반환

✔ 사용 기술

Vue 3 (Composition API)

Node.js + Express

OpenAI API

Axios 기반 메시지 송수신

대화 내역을 실시간 렌더링하는 UI

✔ 구현 구조
Vue(프론트)
  → Node.js(백엔드)
      → OpenAI API
          → Node.js
  → Vue UI로 응답 표시

✔ 챗봇 활용 예시

쇼핑 관련 Q&A

상품 정보 설명

사이트 기능 안내

사용자 편의 기능 자동화

🧩 기술 스택
Frontend

Vue 3 (Composition API)

Pinia

Vue Router

Axios

Tailwind CSS

Backend

Node.js + Express

MySQL + MySQL2

JWT 인증

dotenv

OpenAI API

🗂 프로젝트 구조
src/
 ├─ components/
 ├─ pages/
 ├─ store/                # Pinia 스토어
 ├─ router/
 ├─ lib/
 │   └─ axios.js          # baseURL + Interceptor
 ├─ chatbot/              # 챗봇 컴포넌트 + UI
 ├─ backend/
 │   ├─ routes/
 │   ├─ controllers/
 │   ├─ models/
 │   ├─ openai/
 │   │   └─ openaiService.js
 │   └─ db.js             # MySQL 연결

🔑 핵심 구현 포인트
✔ 1. 프론트–백 완전 분리 구조

SPA(Vue) + REST API(Express)

✔ 2. JWT 토큰 자동 관리

Interceptor로 인증이 필요한 요청은 자동 처리.

✔ 3. Pinia로 전역 상태 정리

복잡한 장바구니 상태를 안정적으로 관리.

✔ 4. 챗봇을 위한 서버 사이드 OpenAI 호출

API 키 노출 없이 안전하고 확장성 있는 구조.

✔ 5. MySQL ERD 직접 설계

users

products

carts

orders

order_items

🧪 실행 방법
📌 Frontend
npm install
npm run dev

📌 Backend
npm install
node server.js

🎯 프로젝트 목표

쇼핑몰의 전체 데이터 흐름을 직접 설계

풀스택 아키텍처 이해

실전형 JWT 인증 구조 구현

OpenAI를 활용한 고객 지원형 챗봇 개발

유지보수 가능한 구조 설계

✨ 향후 개선 사항

상품 추천 모델 추가

관리자(Admin) 페이지 구축

AI 챗봇 답변 학습 데이터 정교화

이미지 업로드 기능(S3 or Cloudflare)
