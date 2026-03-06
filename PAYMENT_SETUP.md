# 결제 시스템 설정 가이드 (포트원/아임포트)

## 포트원(아임포트) 설정 방법

### 1. 포트원 가입 및 상점 ID 발급

1. [포트원 홈페이지](https://www.portone.io/) 접속
2. 회원가입 및 로그인
3. 상점 등록 후 **상점 ID (Store ID)** 발급
4. 테스트 모드와 운영 모드 상점 ID를 각각 발급받습니다

### 2. 환경 변수 설정

#### Frontend (`client/.env`)

```env
# 포트원 상점 ID
VITE_PORTONE_STORE_ID=imp12345678
```

#### Backend (`backend/.env`)

```env
# 포트원 API 키 (결제 검증용)
PORTONE_API_KEY=your_api_key
PORTONE_API_SECRET=your_api_secret
```

### 3. 결제 PG사 선택

포트원은 여러 PG사를 지원합니다:
- **html5_inicis** - 이니시스 (가장 많이 사용)
- **kcp** - NHN KCP
- **nice** - 나이스페이
- **tosspay** - 토스페이
- **kakaopay** - 카카오페이
- **payco** - 페이코

`PortOnePayment.vue` 파일에서 `pg` 값을 변경하세요:

```javascript
pg: "html5_inicis", // 원하는 PG사로 변경
```

### 4. 테스트 결제

포트원 테스트 모드에서는 실제 결제 없이 테스트할 수 있습니다:
- 카드번호: 1234-5678-9012-3456
- 유효기간: 12/34
- CVC: 123
- 비밀번호: 123456

### 5. 결제 검증 (백엔드)

실제 운영 시에는 결제 검증이 필수입니다. `backend/server.js`의 결제 검증 부분을 활성화하세요:

```javascript
// 포트원 결제 검증 함수 추가 필요
async function verifyPortOnePayment(imp_uid) {
  // 포트원 API를 통해 결제 정보 조회 및 검증
  // https://api.iamport.kr/payments/{imp_uid}
}
```

### 6. 주문 테이블에 결제 정보 추가

`orders` 테이블에 결제 정보 컬럼이 추가되었습니다:
- `imp_uid`: 포트원 결제 고유 번호
- `merchant_uid`: 주문 고유 번호

### 7. 보안 주의사항

- ⚠️ **절대 프론트엔드에서 결제 금액을 조작할 수 없도록** 백엔드에서 검증하세요
- ⚠️ **결제 검증은 반드시 백엔드에서** 포트원 API를 통해 수행하세요
- ⚠️ **API 키는 절대 프론트엔드에 노출하지 마세요**

## 참고 자료

- [포트원 공식 문서](https://developers.portone.io/)
- [아임포트 결제 연동 가이드](https://developers.portone.io/docs/ko)
