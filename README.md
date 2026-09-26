# 프로파일러 · AI 사건실

사진을 관찰하고 AI에게 질문하면서 사건의 전말을 복원하는 한국어 웹게임입니다. 객관식 용의자 선택이나 시청자 투표는 없습니다. 질문 입력창과 서술형 사건 해석 입력창이 별도로 있습니다.

## 플레이

1. 치지직으로 로그인합니다. 치지직은 사용자 본인 확인과 랭킹에만 사용합니다.
2. 랜덤 사건을 시작합니다. 사용자별로 10개의 사건이 중복 없이 출제되며, 진행 중인 사건은 이어서 플레이합니다.
3. AI에게 질문합니다. 답변은 **맞습니다 / 그럴 수도 있습니다 / 아닙니다**로 한정됩니다. 최대 40질문이며 타이머는 없습니다.
4. 별도의 사건 해석 입력창에 실제 상황, 원인과 전개, 근거를 서술합니다. 이름만 적는 답안은 정답으로 인정하지 않습니다.
5. 제출 기회는 3회입니다. 1·2회 오답은 정답과 점수를 숨기고 수사를 계속합니다. **“오답입니다. 진실 아직 밝혀지지 않았습니다”**를 브라우저 TTS로 읽습니다. AI/API 실패는 기회를 차감하지 않습니다.
6. 정답이거나 3회차 오답이면 A–D 분석지와 정답, 전체 질문·제출 기록을 보여줍니다. 분석지는 TXT로 저장하거나 인쇄/PDF로 출력할 수 있습니다.

브라우저 새로고침 후에도 서버의 질문과 제출 이력이 남습니다. 작성 중인 답안은 현재 브라우저 탭의 sessionStorage에 임시 저장됩니다. 10개 사건을 모두 완료하면 시즌이 끝나며 재출제하지 않습니다.

## 채점

| 항목 | 배점 |
|---|---:|
| 핵심 상황 | 30 |
| 원인·동기 | 20 |
| 사건 재구성 | 25 |
| 근거 연결 | 15 |
| 질문·추리 과정 | 10 |

AI는 문장 자체의 일치가 아니라 정답과 의미가 얼마나 가까운지 평가합니다. 이름이나 정확한 분 단위 시각을 암기할 필요는 없습니다. 핵심 상황 **24점 이상**, 원인 **10점 이상**, 사건 재구성 **15점 이상**, 앞의 네 항목 합계 **60점 이상**이면 정답입니다. A 80–100, B 60–79, C 40–59, D 0–39. 정답 기준에 도달하지 못하면 최종 총점은 최대 59점으로 제한되어 최고 C등급을 받습니다. 실제 사람의 지능·성격·직업 능력에 대한 진단이 아닙니다.

사용자 랭킹은 완료한 사건의 총점 → 해결 사건 수 → 평균순입니다. 각 사건은 최종 평가 한 번만 반영하며, 10개 사건 최대 1,000점입니다. 개발 계정은 랭킹에 포함하지 않습니다. AI 채점에는 변동 가능성이 있으며 금전적 보상이 걸린 경쟁용 검증을 제공하지 않습니다.

## Railway 배포

저장소 루트의 Dockerfile과 railway.json을 그대로 사용합니다. **Root Directory를 profiler로 바꾸지 마세요.**

1. Railway에서 이 GitHub 저장소를 연결합니다.
2. 같은 프로젝트에 PostgreSQL 서비스를 추가합니다.
3. 웹 서비스 Variables에 아래 값을 설정합니다.
4. 웹 서비스의 공개 도메인을 생성한 뒤 PUBLIC_URL과 치지직 리디렉션 URL을 일치시킵니다.
5. 배포합니다. 시작 시 필요한 테이블과 인덱스가 자동 생성됩니다. Healthcheck는 `/health`입니다.

| 환경변수 | 값 |
|---|---|
| `NODE_ENV` | `production` (Dockerfile 기본값) |
| `DATABASE_URL` | Railway Postgres 서비스 참조, 예: `${{Postgres.DATABASE_URL}}` |
| `PUBLIC_URL` | 실제 HTTPS 서비스 주소, 경로 없이 입력 |
| `SESSION_SECRET` | 충분히 긴 무작위 문자열, 32자 이상 |
| `OPENAI_API_KEY` | 사용자 OpenAI API 키 |
| `OPENAI_MODEL` | `gpt-5.6-sol` (기본값) |
| `CHZZK_CLIENT_ID` | 치지직 개발자 앱 Client ID |
| `CHZZK_CLIENT_SECRET` | 치지직 개발자 앱 Client Secret |
| `OPENAI_TTS_MODEL` | 선택, 기본 `gpt-4o-mini-tts` |
| `OPENAI_TTS_VOICE` | 선택, 기본 `onyx` |
| `GOOGLE_SITE_VERIFICATION` | 선택, Search Console HTML 태그의 `content` 값 |
| `ALLOWED_CHANNEL_IDS` | 선택, 참여 허용할 채널 ID를 쉼표로 구분. 빈 값은 모든 인증 사용자 허용 |

Railway가 주입하는 PORT에 맞춰 `0.0.0.0`으로 수신합니다. 단일 인스턴스로 구성되어 있습니다. 서버 메모리 요청 제한을 분산 배포에 쓰려면 공유 저장소 기반 제한으로 바꾸어야 합니다. PostgreSQL이 없으면 운영 서버는 시작하지 않습니다. 테스트 설정 `MOCK_AI=true` 또는 `ALLOW_DEV_LOGIN=true`는 운영 모드에서 시작을 차단합니다.

GPT-5.6 Sol을 기본 모델로 사용하며, Responses API의 structured outputs와 low reasoning을 사용합니다. 사용 계정에서 해당 모델 접근 권한과 API 잔액이 필요합니다. 기본 키를 프런트엔드로 전달하지 않습니다. 키가 없는 환경에서 실제 모델의 의미 판정 품질은 검증할 수 없으므로, 배포 후 대표 정답·부분 정답·오답으로 실사용 확인을 권장합니다.

## 검색엔진 등록

서버는 `PUBLIC_URL`을 기준으로 canonical URL, Open Graph, JSON-LD, `/robots.txt`, `/sitemap.xml`을 생성합니다. API와 로그인 경로는 크롤링에서 제외하고 공개 게임 페이지와 사건 이미지 10개를 사이트맵에 포함합니다.

1. [Google Search Console](https://search.google.com/search-console/)에서 **URL 접두어** 속성으로 실제 `PUBLIC_URL`을 추가합니다.
2. HTML 태그 인증을 선택하고 `content="..."` 안의 값만 Railway의 `GOOGLE_SITE_VERIFICATION`에 저장한 뒤 재배포합니다.
3. Search Console의 URL 검사에서 홈 주소의 색인 생성을 요청합니다.
4. Sitemaps 메뉴에 `sitemap.xml`을 제출합니다.

Railway 기본 도메인도 색인할 수 있지만 서비스 이름을 기억하기 쉽고 주소를 오래 유지하려면 자체 도메인을 연결하는 편이 좋습니다. 자체 도메인으로 변경할 때 Railway의 `PUBLIC_URL`, 치지직 로그인 리디렉션 URL과 Search Console 속성도 새 주소로 맞춥니다. 기존 주소와 새 주소를 동시에 운영한다면 하나를 대표 주소로 정하고 다른 주소에서 대표 주소로 영구 리디렉션하는 것이 좋습니다.

## 치지직 앱 설정

[치지직 Developers 애플리케이션](https://developers.chzzk.naver.com/application)에서 앱을 등록합니다.

- 필요한 권한: **유저 정보 조회**. 채팅 조회나 채팅 전송 권한은 쓰지 않습니다.
- 로그인 리디렉션 URL: `https://실제서비스도메인/auth/chzzk/callback`
- 인증 코드를 서버에서 액세스 토큰으로 교환하고 `/open/v1/users/me`의 채널 ID를 사용자 ID로 사용합니다.
- 토큰은 프로필 확인에만 사용하며 DB에 저장하지 않습니다. DB에는 사용자 이름·채널 ID와 게임 이력이 남습니다.
- 랭킹에는 치지직에서 인증받은 표시 이름이 공개됩니다. 질문과 답안 상세는 소유자 로그인 후에만 읽을 수 있습니다.
- 개발자 앱의 사용 가능 상태 및 승인 요건은 치지직 개발자 센터에서 확인하세요.

## 로컬 실행

Node.js 24가 필요합니다.

```sh
npm ci
node scripts/preview.mjs
```

`http://localhost:3000`에서 로컬 테스트 계정으로 입장할 수 있습니다. 이 미리보기는 **127.0.0.1에만 바인딩**하고, 실제 API를 호출하지 않습니다. 질문 응답은 고정 예시이고, 테스트 답안에 `테스트정답`을 포함하면 성공 흐름을 확인할 수 있습니다. 이 데이터는 `data/preview.sqlite`에만 기록되고 Git에서 제외됩니다.

실제 OpenAI와 치지직을 로컬에서 사용하려면 `.env.example`을 `.env`로 복사하고 값을 넣은 뒤 `npm start`를 실행하세요. 치지직 앱에 로컬 리디렉션 URL도 등록해야 합니다. `.env`를 커밋하지 마세요.

## 소리와 현장 이미지

- `profiler/dist/images/case-01.png`부터 `case-10.png`까지 사건별로 AI 생성한 현장 사진 10장입니다. 관찰을 위한 재현이며, 이미지 속 작은 글씨나 수치 자체를 확정 증거로 쓰지 않습니다.
- 사건별 두 개의 팝업 힌트가 필요한 시각·기록·번호를 텍스트로 제공합니다. 이미지와 텍스트가 다르면 사건 설명, 힌트와 AI의 텍스트 답변을 기준으로 판단합니다.
- `profiler/dist/audio/case-01.wav`부터 `case-10.wav`까지 직접 합성한 오리지널 다크 앰비언트 루프 10곡입니다. 외부 상업 음원이나 샘플을 사용하지 않습니다.
- `node scripts/generate-music.mjs`로 같은 음원을 다시 생성합니다.
- 게임 시작 클릭 후 사건에 맞는 음원이 재생됩니다. 브라우저 자동재생 제한 시 재생 버튼을 누르면 됩니다.
- 사건 소개는 화면에만 표시하며 자동으로 읽지 않습니다. AI 질문 응답과 정답/오답 안내에는 선택한 브라우저 또는 OpenAI TTS를 사용하며, 기기에 설치된 음성에 따라 브라우저 목소리는 달라집니다.
- 짧은 판정 응답은 기본 브라우저 TTS이며 설정에서 OpenAI TTS를 선택할 수 있습니다. 말하는 동안 BGM은 자동으로 작아집니다.

## 저장 구조와 검증

PostgreSQL: 사용자 프로필(`streamers`), 로그인 세션, 단발 OAuth 상태, 게임(`games`), 질문(`questions`), 제출/정오답/분석(`attempts`). 정답과 내부 채점 기준은 `profiler/server/cases.js`에만 있으며 정적 서버에 노출하지 않습니다. 개발 환경에서는 같은 스키마의 SQLite를 사용합니다.

```sh
npm run check
npm test
```

테스트는 중복 없는 출제, 세 번의 기회, 정답 공개 시점, API 실패 시 기회 보존, 요청 재전송과 동시 제출, 사용자별 접근, 랭킹 계산, PostgreSQL SQL 호환성 등을 확인합니다. 실제 OpenAI/치지직 연결은 자격 증명이 제공되지 않아 별도로 검증해야 합니다.

공식 연동 문서: [OpenAI 모델 가이드](https://developers.openai.com/api/docs/guides/latest-model), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [음성 생성](https://developers.openai.com/api/docs/guides/text-to-speech), [치지직 인증](https://chzzk.gitbook.io/chzzk/chzzk-api/authorization), [치지직 유저](https://chzzk.gitbook.io/chzzk/chzzk-api/user), [Railway PostgreSQL](https://docs.railway.com/databases/postgresql).
