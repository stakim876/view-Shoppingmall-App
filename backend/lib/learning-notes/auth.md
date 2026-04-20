# `auth.js` 학습 노트

## 목적

회원가입·로그인 이후 **“이 요청이 로그인된 사용자인가?”**와 **비밀번호를 안전하게 다루는 일**을 한곳에 모아, 라우트에서는 미들웨어나 몇 줄의 호출만으로 분기할 수 있게 하기 위한 모듈입니다.

## 이 파일에서 관리하는 것

- **비밀번호**: `bcrypt`로 해시(`hashPassword`) / 로그인 시 비교(`verifyPassword`).
- **JWT**: `JWT_SECRET`(필수), `JWT_EXPIRES_IN`(기본 `7d`)으로 토큰 발급(`generateToken`)·검증(`verifyToken`). 검증 실패 시 `null`을 돌려 호출 쪽에서 401 등으로 처리하기 쉽게 맞춤.
- **Express 미들웨어** `authenticateToken`: `Authorization: Bearer <token>`을 읽어 디코딩한 페이로드를 `req.user`에 넣고 `next()`. 토큰 없음·무효 시 JSON 401 응답.

## 요약

인증에 필요한 **비밀번호 처리 + JWT 생성/검증 + 보호 라우트용 미들웨어**를 모아 둔 파일입니다. `server.js`에서는 관리자·위시리스트·주문 등 **로그인이 필요한 API**에 `authenticateToken`만 붙이면 되고, 로그인 성공 시에는 `generateToken`으로 토큰만 내려주면 됩니다.
