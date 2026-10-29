# Realtime Database 버전으로 연결하기

기존 화면 디자인을 유지하면서 회원·테스트 기록·공유·통계를 Firebase Realtime Database로 변경한 버전입니다. Cloud Firestore를 따로 만들 필요가 없습니다. Firebase Authentication은 계속 사용합니다.

## 1. GitHub 파일 갱신

바탕화면 `어플` 폴더의 최신 소스를 GitHub `khr3171/app`에 반영합니다. ZIP 파일만 업로드하지 말고 압축을 푼 실제 파일과 폴더를 올려야 합니다.

주요 변경 파일은 `api/index.mjs`, `lib/engine.mjs`, `lib/realtime-store.mjs`, `public/app.mjs`, `scripts/setup-admin.mjs`, `vercel.json`, `firebase.json`, `database.rules.json`입니다. `lib` 폴더도 반드시 올려주세요. 추천 엔진은 `public/engine.mjs`에서 `lib/engine.mjs`로 이동했습니다. 예전 `public/engine.mjs`, `firestore.rules`, `firestore.indexes.json`은 더 이상 사용하지 않습니다.

## 2. 현재 Realtime Database 규칙 화면

현재 `.read: false`, `.write: false`는 그대로 유지해도 서버의 Admin SDK는 연결할 수 있습니다. 아래 전체 규칙을 적용하면 기록·공유·회원 조회에 필요한 인덱스도 추가됩니다. JSON 형식이며 `rules_version`이나 `service cloud.firestore` 문장을 넣지 않습니다.

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "accounts": { ".indexOn": ["role"] },
    "results": { ".indexOn": ["uid", "shareId"] }
  }
}
```

Firebase Console → Realtime Database → 규칙에서 위 내용으로 바꾸고 게시합니다. 인덱스는 조회 성능을 위한 설정이며 읽기·쓰기 권한을 열지 않습니다. 파일로는 `database.rules.json`에 있습니다.

## 3. 데이터베이스 주소 복사

Realtime Database → **데이터** 탭 상단에 표시되는 `https://...firebaseio.com` 또는 `https://...firebasedatabase.app` 형태의 주소를 복사합니다. 주소를 직접 추측하지 마세요. Firebase 콘솔 페이지 주소, `/data`가 붙은 주소, GitHub 주소, Vercel 주소를 넣는 것이 아닙니다.

Vercel → 프로젝트 → Settings → Environment Variables에 다음 항목을 추가합니다.

| Key | Value |
| --- | --- |
| `FIREBASE_DATABASE_URL` | 방금 복사한 데이터베이스 주소 전체 |

## 4. 나머지 Firebase 환경변수

이미 등록한 항목은 그대로 유지합니다. 아직 등록하지 않았다면 아래 항목도 넣습니다. 웹 앱과 서비스 계정은 같은 Firebase 프로젝트의 것이어야 합니다.

| Key | 가져오는 곳 |
| --- | --- |
| `FIREBASE_API_KEY` | 프로젝트 설정 → 일반 → 웹 앱 설정의 `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | 같은 화면의 `authDomain` |
| `FIREBASE_PROJECT_ID` | 같은 화면의 `projectId` |
| `FIREBASE_APP_ID` | 같은 화면의 `appId` |
| `FIREBASE_CLIENT_EMAIL` | 프로젝트 설정 → 서비스 계정 → 발급한 서버 키의 `client_email` |
| `FIREBASE_PRIVATE_KEY` | 같은 서버 키의 `private_key` 전체 PEM |
| `RATE_LIMIT_SECRET` | 임의의 충분히 긴 무작위 문자열 |
| `ADMIN_NAME` | 김하림 |
| `ADMIN_PASSWORD` | 사용자가 지정한 관리자 6자리 비밀번호 |

서비스 계정 JSON과 비밀키, 실제 비밀번호는 GitHub에 업로드하거나 채팅에 보내지 마세요. 비밀키는 Vercel 환경변수에 직접 입력합니다.

Firebase → Authentication → 로그인 방법에서 **익명**을 활성화합니다. 설정 → 승인된 도메인에는 `app-2ygj.vercel.app`을 추가합니다.

## 5. Vercel 재배포 후 확인

환경변수를 Production에 저장하고 Deployments → Redeploy를 누릅니다. GitHub 파일 수정만으로 자동 배포가 시작됐다면 환경변수 설정을 마친 뒤 다시 배포합니다.

https://app-2ygj.vercel.app/api/config 를 열어 다음 내용을 확인합니다.

- `storage: "realtime-database"`: 새 버전이 배포됨
- `configured: true`: 필수 환경변수가 채워짐. 실제 키의 유효성까지 확인된 것은 아닙니다.
- `configured: false`: 필수 환경변수 중 빠진 값이 있음

여전히 `FUNCTION_INVOCATION_FAILED`가 보이면 Vercel Logs에서 해당 요청의 상세 오류를 확인해야 합니다. 이 오류는 앱 함수가 시작하지 못한 상태이며 규칙을 공개로 바꾸어 해결하지 않습니다.

앱에서 테스트 → 가입 → 마이페이지 기록 표시 → 로그아웃·재로그인을 확인합니다. Realtime Database의 **데이터** 탭에는 가입 후 `accounts`, 테스트 완료 후 `results`, 요청 후 `rateLimits` 경로가 자동으로 생깁니다. 직접 경로를 만들 필요는 없습니다.

관리자 로그인 후 마이페이지의 관리자 통계에서 전체 결과가 보이는지도 확인합니다. 기록을 삭제하면 해당 공유 링크가 만료되고 통계에서도 빠집니다.

## 변경·검증 범위

계정 이름 중복 방지, 결과 중복 저장 방지, 소유권 변경, 공유·삭제에 Realtime Database 트랜잭션을 사용합니다. 관리자 통계는 현재 남아 있는 결과에서 계산하므로 삭제와 게스트 기록 이전을 반영합니다. 전체 결과가 많아지면 관리자 집계 읽기 비용과 응답 크기를 고려해 별도의 집계 방식을 도입해야 합니다.

기존 Cloud Firestore에 데이터가 있었다면 자동으로 복사되지 않습니다. 이번 변경은 새로운 Realtime Database 저장 구조를 사용합니다. 기존 Firestore 프로젝트나 데이터를 삭제하지 않습니다.

로컬 테스트는 Firebase 인터페이스를 흉내 낸 메모리 저장소로 동시 저장, 권한, 삭제, 공유, 게스트 이전을 검사합니다. 실제 Firebase 프로젝트 연결은 사용자의 환경변수를 설정한 뒤 위 절차로 별도 확인해야 합니다.
