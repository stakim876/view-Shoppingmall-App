# 배포 가이드

이 문서는 MY Shop 쇼핑몰을 프로덕션 환경에 배포하는 방법을 안내합니다.

## 📋 목차

1. [사전 준비사항](#사전-준비사항)
2. [환경 변수 설정](#환경-변수-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [프론트엔드 빌드](#프론트엔드-빌드)
5. [백엔드 배포](#백엔드-배포)
6. [프론트엔드 배포](#프론트엔드-배포)
7. [Nginx 설정](#nginx-설정)
8. [SSL 인증서 설정](#ssl-인증서-설정)
9. [PM2 설정](#pm2-설정)

---

## 사전 준비사항

### 필요한 도구
- Node.js (v18 이상)
- MySQL (v8.0 이상)
- Nginx (웹 서버)
- PM2 (프로세스 관리자)
- SSL 인증서 (Let's Encrypt 권장)

### 서버 요구사항
- 최소 2GB RAM
- 최소 20GB 디스크 공간
- Ubuntu 20.04 LTS 이상 (또는 동등한 Linux 배포판)

---

## 환경 변수 설정

### Backend 환경 변수

1. `backend` 디렉토리로 이동:
```bash
cd backend
```

2. `.env.example` 파일을 복사:
```bash
cp .env.example .env
```

3. `.env` 파일을 열어 실제 값 입력:
```env
PORT=3001
NODE_ENV=production

DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=myshop
DB_PORT=3306

CORS_ORIGIN=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### Frontend 환경 변수

1. `client` 디렉토리로 이동:
```bash
cd client
```

2. `.env.example` 파일을 복사:
```bash
cp .env.example .env
```

3. `.env` 파일을 열어 실제 값 입력:
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

---

## 데이터베이스 설정

### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE myshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'myshop_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON myshop.* TO 'myshop_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 데이터베이스 스키마 생성

다음 SQL 스크립트를 **반드시** 실행하세요. (주문/결제 500 오류 방지)

```bash
# MySQL 접속 후
mysql -u myshop_user -p myshop

# users 테이블 생성
SOURCE /path/to/backend/database/users.sql;

# orders, order_items 테이블 생성 (주문·결제용)
SOURCE /path/to/backend/database/orders_schema.sql;

# 쿠폰 테이블 및 orders에 coupon_id, discount_amount 추가 (쿠폰 기능 사용 시)
SOURCE /path/to/backend/database/coupons.sql;
```

- `backend/database/users.sql` — 회원(users) 테이블
- `backend/database/orders_schema.sql` — 주문(orders), 주문상품(order_items) 테이블 (imp_uid, merchant_uid 포함)
- `backend/database/coupons.sql` — 쿠폰(coupons) 테이블 및 orders 확장 (선택)

이미 `orders` 테이블만 있고 결제 컬럼이 없다면 `backend/database/orders_update.sql`을 실행해 imp_uid, merchant_uid 컬럼을 추가할 수 있습니다.

---

## 프론트엔드 빌드

```bash
cd client

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build
```

빌드된 파일은 `client/dist` 디렉토리에 생성됩니다.

---

## 백엔드 배포

### 1. 의존성 설치

```bash
cd backend
npm install --production
```

### 2. PM2로 실행

```bash
# PM2 전역 설치 (처음 한 번만)
npm install -g pm2

# 애플리케이션 시작
pm2 start server.js --name myshop-backend

# 자동 재시작 설정
pm2 startup
pm2 save
```

### 3. PM2 명령어

```bash
# 상태 확인
pm2 status

# 로그 확인
pm2 logs myshop-backend

# 재시작
pm2 restart myshop-backend

# 중지
pm2 stop myshop-backend
```

---

## 프론트엔드 배포

### Nginx를 사용한 정적 파일 서빙

빌드된 `client/dist` 디렉토리의 내용을 웹 서버에 배포합니다.

```bash
# 빌드된 파일을 웹 서버 디렉토리로 복사
sudo cp -r client/dist/* /var/www/myshop/
```

---

## Nginx 설정

### `/etc/nginx/sites-available/myshop` 파일 생성

```nginx
# 프론트엔드 (React/Vue 앱)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/myshop;
    index index.html;

    # SPA 라우팅 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 프록시
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 백엔드 API (별도 도메인 사용 시)
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Nginx 활성화 및 재시작

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/myshop /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## SSL 인증서 설정

### Let's Encrypt 사용 (Certbot)

```bash
# Certbot 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

---

## PM2 설정

### `ecosystem.config.js` 파일 생성 (선택사항)

```javascript
module.exports = {
  apps: [{
    name: 'myshop-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

사용 방법:
```bash
pm2 start ecosystem.config.js
```

---

## 보안 체크리스트

- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 데이터베이스 비밀번호가 강력한지 확인
- [ ] JWT 시크릿 키가 설정되어 있는지 확인
- [ ] CORS 설정이 프로덕션 도메인으로 제한되어 있는지 확인
- [ ] HTTPS가 활성화되어 있는지 확인
- [ ] 방화벽 설정 확인 (필요한 포트만 열기)
- [ ] 정기적인 백업 설정

---

## 모니터링

### PM2 모니터링

```bash
# 실시간 모니터링
pm2 monit

# 메트릭 확인
pm2 list
```

### 로그 확인

```bash
# 백엔드 로그
pm2 logs myshop-backend

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 문제 해결

### 백엔드가 시작되지 않는 경우

1. 포트가 이미 사용 중인지 확인:
```bash
sudo lsof -i :3001
```

2. 환경 변수가 올바르게 설정되었는지 확인:
```bash
cd backend
cat .env
```

3. 데이터베이스 연결 확인:
```bash
mysql -u your_db_user -p -h localhost myshop
```

### 프론트엔드가 API에 연결되지 않는 경우

1. CORS 설정 확인 (`backend/.env`의 `CORS_ORIGIN`)
2. API URL 확인 (`client/.env`의 `VITE_API_URL`)
3. Nginx 프록시 설정 확인

---

## 참고 자료

- [PM2 공식 문서](https://pm2.keymetrics.io/)
- [Nginx 공식 문서](https://nginx.org/en/docs/)
- [Let's Encrypt 문서](https://letsencrypt.org/docs/)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html)
