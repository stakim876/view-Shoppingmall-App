# Vercel(프론트) + Railway(API·MySQL)

포폴용으로 프론트는 Vercel, API·DB는 Railway에 올리는 흐름이다. 레포는 `client/` / `backend/` 나뉜 구조 그대로 쓰면 된다.

## 지금 배포 시작할 때 순서 (한 번에)

1. **GitHub에 푸시** — 로컬 변경사항 전부 올려 두기 (`.env`는 커밋하지 말 것).
2. **Railway** [railway.app](https://railway.app) → 로그인 → **New Project** → **Database** → **MySQL** 추가.
3. 같은 프로젝트에서 **New** → **GitHub Repo** → 이 저장소 선택 → 생성된 서비스 **Settings → Root Directory** = `backend` → 저장 후 배포되게 두기.  
   - 레포에 `backend/railway.toml` 있음 → `npm start`, 헬스체크 `/api/health`.
4. **백엔드 Variables**  
   - MySQL은 Railway에서 **Variable Reference**로 `MYSQLHOST`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQLPORT`(또는 대시보드에 보이는 이름)를 `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`에 연결하거나, 값을 복사해 넣기.  
   - 추가로 직접 입력: `JWT_SECRET`(긴 랜덤), `JWT_EXPIRES_IN=7d`, `ADMIN_INVITE_CODE`, `NODE_ENV=production`.  
   - `CORS_ORIGIN` / `CLIENT_BASE_URL`은 **아직 비워 두거나**, 임시로 `http://localhost:5173`만 넣어도 됨 → **Vercel 주소 나온 뒤(6번) 꼭 수정**.
5. **Networking** → 백엔드 서비스에 **Generate Domain** → 주소 복사. 브라우저에서 `https://(그주소)/api/health` 확인.
6. **DB 스키마** — Workbench 등으로 Railway MySQL에 붙어서(퍼블릭 URL 켜져 있으면) `backend/database/init_full.sql` + 필요한 SQL 실행. 또는 덤프 import.
7. **Vercel** [vercel.com](https://vercel.com) → **Add New Project** → 같은 레포 → **Root Directory** = `client` → Build `npm run build`, Output `dist`.  
   - Environment Variable: `VITE_API_URL` = `https://(5번 Railway 주소)/api` (**끝에 `/api`**).
8. Vercel 배포 완료 후 **프론트 URL** 확인 → Railway 백엔드 Variables에 `CORS_ORIGIN`과 `CLIENT_BASE_URL`을 그 **https URL 하나**로 넣고 **Redeploy**.

이후 브라우저에서 Vercel URL로 들어가서 동작 확인하면 된다.

---

## 0. 전제

- 코드가 **GitHub**에 올라가 있음.
- 로컬에서 `backend` + `client` + MySQL 조합이 한 번이라도 성공한 상태.

## 1. Railway — MySQL

1. [railway.app](https://railway.app) 로그인 → **New Project** → **Database** → **MySQL** 추가.
2. MySQL 서비스 들어가서 **Variables** 탭에서 연결 정보 확인.  
   (호스트·포트·유저·비번·DB 이름 — 플랫폼마다 이름이 조금 다를 수 있음. `MYSQL_*` / `DATABASE_URL` 등으로 줄 때도 있음.)
3. 이 값들을 나중에 백엔드 서비스의 `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`에 그대로 맞춰 넣으면 된다.  
   `DATABASE_URL`만 주는 경우는 URL 파싱하거나, Railway 대시보드에 표시되는 개별 항목을 복사해 쓰면 된다.

4. 로컬이나 Railway 콘솔에서 `mysql` 클라이언트로 붙어 **`init_full.sql` + 필요한 마이그레이션** 실행해 테이블을 만든다.  
   (Railway는 **Query** 탭이나 외부 툴로 접속하는 방식이 안내되어 있음.)

## 2. Railway — Node(API)

1. 같은 프로젝트에 **New** → **GitHub Repo**로 이 저장소 연결.
2. 생성된 서비스 **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install` (비워 두면 Nixpacks가 알아서 할 때도 많음)
   - **Start Command**: `npm start`
3. **Variables**에 최소한 아래를 넣는다. (`PORT`는 Railway가 자동으로 주는 경우가 많아서 건드리지 않아도 됨.)

| 변수 | 설명 |
|------|------|
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` / `DB_PORT` | 위 MySQL 값과 동일 |
| `JWT_SECRET` | 긴 랜덤 문자열 |
| `JWT_EXPIRES_IN` | 예: `7d` |
| `ADMIN_INVITE_CODE` | 관리자 가입용 |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | Vercel 주소(아래 3번 후에 확정). **쉼표로 여러 개** 가능 (`backend/server.js`에서 처리) |
| `CLIENT_BASE_URL` | 최종 사용자가 보는 프론트 URL (`https://xxx.vercel.app` 등) |

4. **Deploy** 후 **Settings → Networking → Generate Domain** 으로 공개 URL을 받는다.  
   예: `https://my-shop-api-production-xxxx.up.railway.app`

5. 브라우저에서 `https://(위주소)/api/health` 가 JSON으로 응답하면 API는 통과.

**참고:** 무료/저가 플랜은 **슬립** 걸릴 수 있음. 포폴 데모면 감안하면 됨.

## 3. Vercel — Vue(client)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → GitHub에서 이 레포 선택.
2. **Root Directory**를 `client` 로 지정.
3. Framework는 **Vite**로 잡히면 그대로.  
   - Build Command: `npm run build`  
   - Output Directory: `dist`
4. **Environment Variables**:
   - `VITE_API_URL` = `https://(Railway API 도메인)/api`  
     예: Railway가 `https://abc.up.railway.app` 이면  
     `https://abc.up.railway.app/api`  
     (**끝에 `/api`까지** 맞출 것. 이 프로젝트 라우트가 `/api/...` 기준이다.)
5. 배포 후 나온 주소를 복사한다. 예: `https://my-shop.vercel.app`

## 4. CORS / CLIENT 다시 맞추기

Vercel 주소가 확정되면 Railway 백엔드 Variables를 수정한다.

- `CORS_ORIGIN` = `https://my-shop.vercel.app` (프로덕션 도메인만 넣는 게 좋음)
- `CLIENT_BASE_URL` = 동일 URL

저장 후 Railway가 **재배포**되게 하면 프론트에서 API 호출이 막히지 않는다.

## 5. 체크리스트

- [ ] MySQL에 스키마·시드 반영됨  
- [ ] Railway API `/api/health` OK  
- [ ] Vercel `VITE_API_URL`이 Railway **https + `/api`**  
- [ ] `CORS_ORIGIN` / `CLIENT_BASE_URL`이 **Vercel URL**과 일치  
- [ ] 포트원·카카오·SMTP 등은 필요할 때만 넣기 (없으면 해당 기능만 비활성)

## 6. 이 레포에 넣어 둔 것

- `client/vercel.json` — Vue Router **history 모드**용으로 모든 경로를 `index.html`로 넘김 (정적 파일은 Vercel이 먼저 처리).
- `backend/railway.toml` — Railway에서 `backend`만 서비스로 올릴 때 `npm start`로 구동.

로컬 전용 가이드는 기존 `DEPLOYMENT.md`(VPS·Nginx)를 보면 된다.
