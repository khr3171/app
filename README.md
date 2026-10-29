# 점심시간 빠르게 “런”치자!

내 마음을 알아주는 오늘의 점심 메뉴 추천. 사용자가 제공한 밥알 셰프 캐릭터와 크림색·노란색·갈색으로 꾸민 반응형 한국어 웹앱입니다. 첫 화면은 제목·소개·시작 버튼·캐릭터를 중심으로 간결하게 구성했습니다.

**대상 저장소:** https://github.com/khr3171/app

![첫 화면](home-preview.png)

## 구성

- **GitHub**: 소스와 잠금 파일 관리, GitHub Actions 테스트·빌드
- **Vercel**: Vite 정적 프런트엔드 + `api/index.mjs` Node.js 서버리스 함수
- **Firebase Authentication**: 익명 체험, 이름·생년월일을 서버에서 확인한 뒤 Custom Token으로 로그인
- **Firebase Realtime Database**: 회원별 테스트 기록, 공유 링크, 전체 통계, 서버 요청 제한
- **네이버**: 공식 지역 검색 API와 선택적 Dynamic Map, 지도 검색·길찾기 링크
- **캐치테이블·배달의민족**: 외부 서비스 연결. 매장별 예약·배달 지원 여부를 자동으로 확정하지 않습니다.

별도의 SQLite나 파일 데이터베이스가 없습니다. Vercel의 임시 파일시스템에 사용자 정보를 저장하지 않습니다. OpenAI API나 유료 AI 키는 사용하지 않습니다.

## 지금 가능한 것 / 연결 후 가능한 것

Firebase 설정 전에도 8개 질문, 답변 자동 이동, 이전 질문, 42개 메뉴의 추천 TOP 3, 이유, 4개 점심 유형, 결과 텍스트 공유, 주소 기반 네이버 지도 검색을 체험할 수 있습니다. 체험 결과는 서버에 저장하지 않습니다.

Firebase 연결 후 로그인·가입, 게스트 결과의 회원 계정 이전, 개인별 기록·카테고리 통계, 관리자 전체 통계, 실제 결과 공유 링크·삭제가 동작합니다. 사용자별 데이터는 서버에서 Firebase ID 토큰과 소유권을 확인합니다.

네이버 검색 키를 설정하면 실제 지역 검색 응답의 식당명·주소만 표시합니다. 검색어 일치 결과이며 **최단거리순·판매 메뉴·영업 상태를 보장하지 않습니다**. Dynamic Map 키까지 설정하면 응답 좌표에 실제 지도 마커를 표시합니다. 키가 없거나 연결이 실패하면 네이버 지도 검색 링크를 제공합니다. 가짜 음식점이나 실제 매장 가격, 알레르기 안전 정보는 생성하지 않습니다.

## 로컬 실행

Node.js 24 LTS를 설치한 뒤 이 폴더에서 실행합니다.

```powershell
npm ci
npm run dev
```

http://127.0.0.1:3000 에 접속합니다. `.env`가 없어도 체험 모드는 실행됩니다. Firebase를 연결하려면 `.env.example`을 `.env`로 복사하고 값을 입력합니다. 실제 비밀키는 Git에 올리지 마세요.

```powershell
npm test
npm run build
```

## GitHub에 올리기

이 폴더의 **내용 전체가 저장소 루트**에 있어야 합니다. `package.json`, `vercel.json`, `api/`, `lib/`, `public/` 등이 최상위에 놓이는 구조입니다. `node_modules/`, `dist/`, `.env`, 서비스 계정 JSON은 올리지 않습니다. `.gitignore`가 포함되어 있습니다.

GitHub Desktop에서 이 폴더를 로컬 저장소로 추가하거나, Git 인증을 마친 터미널에서 다음과 같이 연결할 수 있습니다. 원격 저장소가 비어 있을 때의 예시이며 기존 파일이 있다면 먼저 내려받아 병합하세요.

```powershell
git init
git add .
git commit -m "Build lunch recommendation web app"
git branch -M main
git remote add origin https://github.com/khr3171/app.git
git push -u origin main
```

Git에서 작성자 설정을 요청하면 본인의 이름·이메일을 설정하세요. 계정 인증은 GitHub Desktop 또는 본인의 Git 자격 증명 관리자로 진행합니다.

## Firebase 설정

자세한 연결 절차는 [Realtime Database 연결 안내](RealtimeDatabase-연결안내.md)를 참고하세요.

1. Firebase 프로젝트와 웹 앱을 등록합니다.
2. Authentication의 **익명(Anonymous)** 로그인을 활성화합니다.
3. 이미 생성한 **Realtime Database**를 사용합니다. 데이터 탭의 데이터베이스 주소를 복사합니다.
4. Realtime Database → 규칙 탭에 `database.rules.json` 내용을 붙여 넣고 게시합니다. 읽기·쓰기는 차단하고 조회용 인덱스만 추가합니다.
5. 웹 앱 설정값, 서비스 계정, 데이터베이스 주소를 아래 Vercel 환경변수로 등록합니다.
6. Authentication 승인된 도메인에 `app-2ygj.vercel.app`을 추가합니다.
7. Vercel에서 재배포하고 `/api/config`에서 `storage: "realtime-database"`와 `configured: true`를 확인한 뒤 가입·기록 저장을 테스트합니다.

Admin SDK는 서버의 서비스 계정 권한으로 접근합니다. 브라우저 직접 접근을 허용할 필요는 없습니다. 계정은 `accounts`, 결과는 `results`, 요청 제한은 `rateLimits`에 저장합니다. 요청 제한 문서는 같은 키를 재사용하며 서버가 만료 시간을 직접 검사합니다.

### Vercel 환경변수

| 이름 | 값 / 용도 | 공개 여부 |
| --- | --- | --- |
| `FIREBASE_API_KEY` | Firebase 웹 앱의 apiKey | 웹 공개 설정 |
| `FIREBASE_AUTH_DOMAIN` | Firebase 웹 앱의 authDomain | 웹 공개 설정 |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID | 웹 공개 설정 |
| `FIREBASE_APP_ID` | Firebase 웹 앱의 appId | 웹 공개 설정 |
| `FIREBASE_DATABASE_URL` | Realtime Database 데이터 탭의 데이터베이스 주소 | 서버 연결 설정 |
| `FIREBASE_CLIENT_EMAIL` | 서비스 계정 client_email | 서버 전용 |
| `FIREBASE_PRIVATE_KEY` | 서비스 계정 private_key 전체 PEM | 서버 전용 비밀값 |
| `RATE_LIMIT_SECRET` | 임의의 길고 무작위인 문자열 | 서버 전용 비밀값 |
| `ADMIN_NAME` | 요청한 관리자 이름 | 서버 전용 |
| `ADMIN_PASSWORD` | 요청한 관리자 6자리 비밀번호 | 서버 전용 비밀값 |
| `NAVER_CLIENT_ID` | 네이버 개발자센터 지역 검색 Client ID | 서버 전용 |
| `NAVER_CLIENT_SECRET` | 네이버 개발자센터 Client Secret | 서버 전용 비밀값 |
| `NAVER_MAP_CLIENT_ID` | 네이버 클라우드 Dynamic Map의 공개 Key ID | 선택·도메인 제한 필수 |

`FIREBASE_PRIVATE_KEY`는 `-----BEGIN PRIVATE KEY-----`부터 마지막 줄까지 입력합니다. 실제 줄바꿈 또는 문자 `\n` 모두 처리합니다. `.env`에서 사용할 때는 값을 큰따옴표로 감싸세요. Firebase 웹 설정의 API 키와 서비스 계정 비밀키는 서로 다릅니다.

관리자 이름은 기본값이 `김하림`입니다. 비밀번호는 요청하신 값을 `ADMIN_PASSWORD`로 직접 설정하세요. 비밀번호는 소스에 포함되어 있지 않습니다. 최초 관리자 로그인 요청에서만 해시 계정을 생성하며, 이후 환경변수만 바꿔도 기존 해시가 갱신되지는 않습니다. 변경할 때는 아래 명령을 신뢰할 수 있는 로컬 환경에서 실행하세요.

```powershell
npm run setup:admin
```

이 명령은 `.env`의 관리자 설정으로 관리자 계정 해시를 생성·갱신합니다. 기존 관리자 로그인 토큰을 폐기하며, 관리자 이름을 바꾸는 용도로 사용하지 마세요.

## Vercel 배포

1. [Vercel](https://vercel.com/new)에서 GitHub 저장소 `khr3171/app`을 Import합니다.
2. Root Directory는 `package.json`이 있는 폴더입니다. 파일을 저장소 루트에 올렸다면 기본값 그대로 둡니다.
3. Framework Preset은 **Other**, Node.js **24.x**, Build Command는 `npm run build`, Output Directory는 `dist`입니다. `vercel.json`에도 선언되어 있습니다.
4. 위 환경변수를 Production과 필요한 Preview 환경에 설정한 뒤 Deploy합니다. `/api/*` 요청은 서버리스 함수로 전달됩니다. `dist`만 별도의 정적 호스팅에 올리면 계정·기록 API가 동작하지 않습니다.
5. 배포 도메인을 Firebase 승인 도메인과 네이버 Maps 웹 서비스 URL에 추가합니다.
6. 환경변수 변경 후 Redeploy합니다. 이후 GitHub 기본 브랜치에 push하면 Vercel Git 연동이 새 버전을 배포합니다.

### 연결 후 실제 서비스 점검

Firebase와 네이버 계정 키가 제공되지 않은 상태에서는 실제 서비스 연동을 검증할 수 없습니다. 배포 후 다음을 확인해 주세요.

- 게스트 테스트 → 가입 → 게스트 결과가 마이페이지에 남는지
- 로그아웃·다른 계정 로그인 시 이전 계정의 기록을 볼 수 없는지
- 다른 기기에서 같은 이름·비밀번호로 로그인해 기존 기록을 보는지
- 관리자 로그인으로 전체 분포와 한국 시간 기준 오늘 횟수를 보는지
- 일반 계정에서 `#admin` 접근이 거절되는지
- 공유 링크에서 이름·주소 없이 결과만 보이고 기록 삭제 후 링크가 만료되는지
- 주소 검색 시 네이버 실제 응답과 지도 마커가 일치하는지
- 네이버 지도 앱이 없는 기기에서는 웹 지도 링크로 길찾기를 이용하는지

## 추천 방식

8개 질문: 기분 → 동행 → 배고픔 → 맛 → 형태·온도 → 날씨 → 모험 성향 → 예산. 답변은 약 0.24초 뒤 다음 질문으로 이동하며 뒤로 돌아가 바꿀 수 있습니다. 직전 식사와 식사 환경은 첫 질문의 접을 수 있는 추가 설정에서 선택합니다.

맛 취향 **30%**, 기분 **20%**, 배고픔 **20%**, 형태·온도 **15%**, 식사 상황·모험 **15%**를 적용합니다. 날씨는 형태·온도에, 동행·모험·식사 환경은 마지막 항목에 반영합니다. 직전 메뉴는 제외하고 예산군 상한으로 후보를 거릅니다. 예산군은 검증된 식당 가격이 아닌 메뉴의 일반적 경향입니다. 음식 형태와 가격은 조리법·매장에 따라 달라집니다.

점수는 답변 일치 점수이며 만족 확률·건강 지표·심리 진단이 아닙니다. 개인/전체 통계는 테스트마다 **1순위 추천**을 한 번씩 집계하며 실제 섭취 기록과 다릅니다. 같은 요청을 재시도해도 `requestId`로 중복 저장을 막습니다. 기록 삭제는 전체 통계에도 반영합니다.

## 로그인과 개인정보

이름은 계정 이름으로 저장하고 생년월일은 scrypt+무작위 salt 해시로만 저장합니다. 이름이 같으면 별칭을 덧붙여야 합니다. 생년월일 원문과 검색 주소는 Realtime Database에 저장하지 않습니다. 공유 링크에는 결과 유형·메뉴·추천 이유·결과 날짜만 포함됩니다. 기록 삭제 시 공유 링크도 만료됩니다.

요청하신 이름+생년월일 6자리 로그인은 추측하기 쉬운 **데모용 인증**입니다. 공개 서비스 운영 전에는 Firebase의 이메일·소셜 로그인, 계정 복구, 관리자 다중 인증 등으로 보강해야 합니다. 요청 제한은 보조 장치이며 이 약점을 없애지 않습니다. 현재 운영자 연락처·개인정보 보유기간은 지정되지 않았으므로 공개 운영 전에 실제 정책과 연락처를 보완하세요. Firebase 및 네이버 사용량에 따른 비용은 각 콘솔에서 한도·알림으로 관리하세요.

## 검증 범위

`npm test`는 17개 테스트와 1,200개 추천 조합을 검사합니다. Realtime Database용 메모리 테스트 저장소로 중복 저장, 계정별 접근, 공유 만료, 기록 삭제, 게스트 이전, 요청 제한을 검사합니다. 빌드 검증, 브라우저에서 8문항→결과→주소 검색 흐름과 모바일 가로 넘침을 확인했습니다. 실제 Firebase 계정 가입·클라우드 저장·관리자 권한 및 네이버 API 응답·지도 SDK는 실제 프로젝트 환경변수 설정 후 위 절차로 검증해야 합니다.

## 참고 문서

- [Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Firebase Custom Token 로그인](https://firebase.google.com/docs/auth/web/custom-auth)
- [Firebase 익명 로그인](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Realtime Database Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Realtime Database 데이터 저장](https://firebase.google.com/docs/database/admin/save-data)
- [네이버 지역 검색](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [네이버 지도 SDK](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html)
- [네이버 지도 앱 연결](https://guide.ncloud-docs.com/docs/maps-url-scheme)
