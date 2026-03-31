# Supabase 기반 외부 배포 가이드 (초보자용)

이 문서는 **집·회사 PC가 아닌 인터넷 어디서나** 병원 치료 스케줄 웹앱에 접속할 수 있게 만드는 방법을 단계별로 설명합니다.

- **프론트엔드**: Vue 3 + Vite(브라우저에서 보는 화면)
- **백엔드(API)**: Express + Prisma + JWT(로그인·데이터 처리)
- **데이터베이스**: 로컬에서는 SQLite, **배포 시에는 Supabase가 제공하는 PostgreSQL**을 사용합니다.

> **Supabase를 “어떻게 쓰나요?”**  
> 이 프로젝트에서는 Supabase의 **PostgreSQL(관계형 DB)** 만 필수로 사용합니다. 로그인은 현재 **자체 JWT API**로 동작하므로, Supabase **Auth로 바꾸려면** 별도의 큰 코드 작업이 필요합니다.  
> 프론트의 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 는 **실시간 알림·Storage** 등을 나중에 붙일 때 선택 사항입니다.

---

## 목차

1. [전체 그림 (한눈에 보기)](#1-전체-그림-한눈에-보기)
2. [미리 알아두면 좋은 용어](#2-미리-알아두면-좋은-용어)
3. [Supabase 프로젝트 만들기](#3-supabase-프로젝트-만들기)
4. [로컬: Prisma를 PostgreSQL로 맞추기](#4-로컬-prisma를-postgresql로-맞추기)
5. [데이터베이스 연결 문자열 (Direct vs Pooler)](#5-데이터베이스-연결-문자열-direct-vs-pooler)
6. [마이그레이션·시드 실행](#6-마이그레이션시드-실행)
7. [API 서버 배포 (기본: Render)](#7-api-서버-배포-기본-render)
8. [프론트 배포 (기본: Vercel)](#8-프론트-배포-기본-vercel)
9. [처음 관리자 계정으로 로그인](#9-처음-관리자-계정으로-로그인)
10. [보안·운영 체크리스트](#10-보안운영-체크리스트)
11. [자주 나는 오류](#11-자주-나는-오류)
12. [환경 변수 예시 모음](#12-환경-변수-예시-모음)
13. [다른 호스팅으로 옮길 때](#13-다른-호스팅으로-옮길-때)

---

## 1. 전체 그림 (한눈에 보기)

브라우저는 **프론트 주소**(예: `https://my-app.vercel.app`)로 접속합니다. 화면에서 API를 호출할 때는 **`VITE_API_URL`** 에 넣어 둔 **백엔드 주소**(예: `https://my-api.onrender.com`)로 요청이 갑니다. 백엔드는 **Supabase Postgres**에 Prisma로 접속합니다.

```mermaid
flowchart LR
  subgraph browser [Browser]
    SPA[Vue_SPA]
  end
  subgraph vercel [Frontend_host]
    Static[Static_files_dist]
  end
  subgraph render [API_host]
    API[Express_API]
  end
  subgraph supabase [Supabase]
    PG[(Postgres)]
  end
  SPA --> Static
  SPA -->|"HTTPS VITE_API_URL"| API
  API -->|"DATABASE_URL"| PG
```

### CORS 가 뭔가요?

브라우저는 **보안상** “`https://a.com` 에서 뜬 자바스크립트가 `https://b.com` 으로 마음대로 요청하지 못하게” 막습니다.  
프론트(`a`)와 API(`b`)가 **주소가 다르면**, API 쪽에서 “`a` 주소에서 오는 요청은 허용한다”고 적어 줘야 합니다. 그게 **`CORS_ORIGIN`** 설정입니다. 이 프로젝트는 [`server/src/index.ts`](../server/src/index.ts)에서 `CORS_ORIGIN`을 쉼표로 나눠 여러 주소를 허용할 수 있습니다.

---

## 2. 미리 알아두면 좋은 용어

| 용어 | 쉬운 설명 |
|------|-----------|
| **환경 변수** | 서버·빌드 도구가 읽는 “비밀 설정”. 비밀번호·URL을 코드에 하드코딩하지 않기 위해 사용합니다. |
| **PostgreSQL** | DB 종류 하나. Supabase가 이걸 클라우드에서 제공합니다. |
| **Prisma** | Node.js에서 DB를 다루는 도구. `schema.prisma`와 마이그레이션으로 테이블 구조를 맞춥니다. |
| **마이그레이션** | DB 테이블 구조를 버전처럼 쌓아 두는 스크립트. 배포 서버에서 `migrate deploy`로 최신 구조를 적용합니다. |
| **시드(seed)** | 개발용 초기 데이터 넣기. 이 저장소는 **관리자 계정·샘플 환자** 등을 [`server/prisma/seed.ts`](../server/prisma/seed.ts)로 넣습니다. |
| **JWT** | 로그인 후 발급되는 토큰. 지금 앱의 로그인 방식입니다. |

---

## 3. Supabase 프로젝트 만들기

1. 브라우저에서 [https://supabase.com](https://supabase.com) 접속 → 회원가입/로그인.
2. **New project** 로 프로젝트 생성.
3. **Database password** 를 정하면 **반드시 메모장 등에 안전하게 저장**하세요. (나중에 연결 문자열에 들어갑니다.)
4. 리전(Region)은 가까운 곳(예: Northeast Asia)을 선택해도 됩니다. 생성에 1~2분 걸릴 수 있습니다.
5. 프로젝트 대시보드에서 **Project Settings**(톱니바퀴) → **Database** 로 이동합니다.
6. 여기서 **Connection string**(또는 URI)을 복사할 수 있습니다. 아래 [5절](#5-데이터베이스-연결-문자열-direct-vs-pooler)에서 어떤 형식을 쓸지 고릅니다.

**API Keys** 화면에 나오는 `anon` / `service_role` 키는 **이 배포 경로(Prisma + Express)에서는 DB 접속에 필수가 아닙니다.** DB 비밀번호가 들어간 **Postgres 연결 문자열**이 백엔드의 `DATABASE_URL` 입니다.  
(`service_role` 키는 절대 프론트엔드·GitHub에 노출하지 마세요.)

---

## 4. 로컬: Prisma를 PostgreSQL로 맞추기

지금 저장소의 [`server/prisma/schema.prisma`](../server/prisma/schema.prisma)는 로컬 편의를 위해 `sqlite`일 수 있습니다. **Supabase에 올릴 때는** 다음처럼 바꿉니다.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **`DIRECT_URL`**: `prisma migrate` / `db push` 같은 **DDL**용 연결입니다. Transaction pooler(6543)만 쓰면 **명령이 오래 멈춘 것처럼 보이거나** 실패할 수 있어, Supabase 대시보드의 **Session mode** 풀러(같은 `*.pooler.supabase.com` 호스트·포트 **5432**) 또는 **Direct** URI를 넣습니다.
- 로컬에서도 Postgres를 쓰고 싶으면, Supabase의 **같은 프로젝트**에 연결하거나, PC에 PostgreSQL을 설치해 `DATABASE_URL`과 `DIRECT_URL`을 **같은 URI**로 두고 테스트할 수 있습니다.
- **팁**: 팀에서 “로컬은 SQLite, 운영만 Postgres”로 두고 싶다면 스키마를 두 벌 관리하거나, 문서만 참고하고 실제로는 CI/배포 환경에서만 `provider`가 postgresql인 브랜치를 쓰는 방식도 있습니다. 초보자에게는 **로컬도 Supabase Dev DB 하나로 통일**하는 편이 덜 헷갈립니다.

모델 변경 후에는 반드시:

```bash
cd server
npx prisma generate
```

---

## 5. 데이터베이스 연결 문자열 (Direct vs Pooler)

Supabase는 보통 두 가지 연결 방식을 제공합니다.

| 구분 | 용도 (이 프로젝트 기준) |
|------|-------------------------|
| **Direct** (`db.*.supabase.co`, 포트 **5432**) | DDL·마이그레이션에 적합(가능하면 `DIRECT_URL`로 사용) |
| **Session pooler** (같은 pooler 호스트, 포트 **5432**) | Direct가 막힐 때(IPv6·방화벽 등) **`DIRECT_URL` 대안**으로 흔히 사용 |
| **Transaction pooler** (포트 **6543**, `pgbouncer=true`) | **`DATABASE_URL`(런타임)** — Express 등 연결 다발에 적합. **`db push` 전용으로만 쓰면 장시간 무반응**일 수 있음 |

Prisma를 Supabase와 함께 쓰는 공식 가이드:  
[https://www.prisma.io/docs/guides/database/supabase](https://www.prisma.io/docs/guides/database/supabase)

**배포된 API 서버의 `DATABASE_URL`** 에는 보통 **Pooler( Transaction mode )** URL을 쓰고, 끝에 Prisma용 파라미터를 붙입니다.

예시 형태(값은 본인 프로젝트 것으로 교체):

```text
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

- 비밀번호에 특수문자가 있으면 **URL 인코딩**이 필요할 수 있습니다.
- Supabase 대시보드의 **Connection pooling** 섹션에서 **Transaction** 모드 URI를 복사한 뒤, Prisma 문서에 맞게 `?pgbouncer=true` 등을 확인하세요.

Prisma CLI는 **`DIRECT_URL`** 로 접속해 스키마를 적용합니다. `server/.env` 에 **반드시** `DATABASE_URL`과 함께 넣습니다. (루트의 `server.env` 등 다른 파일은 Prisma가 읽지 않습니다. **`cd server` 뒤** `server/.env`만 로드됩니다.)

SSL이 필요한 경우 연결 문자열에 `sslmode=require` 가 포함되거나, Supabase 기본 URI에 이미 포함되는 경우가 많습니다. 오류 메시지에 `SSL` 이 보이면 Prisma/Supabase FAQ를 참고하세요. 디버깅 시 `connect_timeout=15` 를 쿼리에 붙이면 “무한 대기” 대신 빨리 실패하는 경우가 있습니다.

---

## 6. 마이그레이션·시드 실행

### 로컬(PC 터미널)에서 최초 정리

1. `server/.env` 에 `DATABASE_URL`(Transaction pooler 권장)과 `DIRECT_URL`(Session pooler 5432 또는 Direct 5432)을 설정합니다.
2. `schema.prisma` 의 `provider`가 `postgresql`인지 확인합니다.
3. 저장소에 이미 마이그레이션 폴더가 있다면:

```bash
cd server
npx prisma migrate deploy
```

개발 중에 스키마를 바꿨다면(팀 내부):

```bash
npx prisma migrate dev --name 설명용이름
```

### 시드(초기 데이터)

```bash
npm run db:seed -w server
```

또는:

```bash
cd server
npx tsx prisma/seed.ts
```

시드는 **환자·예약 샘플**을 넣고, **관리자 계정**을 만듭니다. 프로덕션에서 샘플이 부담스러우면, 시드 스크립트를 배포 후 한 번만 실행하거나, 나중에 DB에서 삭제할 수 있습니다.

> **GitHub에 `.env`를 올리지 마세요.** `DATABASE_URL` 안에 DB 비밀번호가 들어 있습니다.

---

## 7. API 서버 배포 (기본: Render)

아래는 **[Render](https://render.com)** 에 Express API를 올리는 일반적인 패턴입니다. (Railway, Fly.io도 개념은 같습니다.)

### 7-1. 준비물

- GitHub에 이 저장소가 push 되어 있어야 합니다.
- Supabase `DATABASE_URL`(Transaction pooler), **`DIRECT_URL`(Session 또는 Direct)**, 강한 **`JWT_SECRET`**, 프론트 배포 후 확정되는 **프론트 URL**.

### 7-2. Render에서 Web Service 생성

1. Render 대시보드 → **New** → **Web Service**.
2. GitHub 저장소 연결 후 선택.
3. **Root Directory** 에 `server` 입력 (모노레포이므로 API만 이 폴더에서 빌드).
4. **Build Command** 예시 (`DIRECT_URL` 을 안 넣었을 때도 P1012 가 나지 않도록 `build:render` 권장):

   ```bash
   npm install && npm run build:render
   ```

   (구식: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` — 이때는 Render에 **`DIRECT_URL` 필수**.)

5. **Start Command** 예시:

   ```bash
   npm run start
   ```

   (`package.json`의 `start`가 `node dist/index.js`인지 확인하세요.)

6. **Environment** 에 다음을 추가:

   | Key | 값 |
   |-----|-----|
   | `DATABASE_URL` | Supabase Transaction pooler URI (`pgbouncer=true` 등) |
   | `DIRECT_URL` | Session pooler `:5432` 또는 Direct — 빌드/시작 시 `prisma migrate deploy` 에 필요 |
   | `JWT_SECRET` | 32자 이상 무작위 문자열(추측 불가능하게) |
   | `PORT` | Render가 자동 주입하는 경우가 많음(비우거나 `10000` 등 플랫폼 안내 따름) |
   | `CORS_ORIGIN` | 프론트 주소. 예: `https://my-app.vercel.app` (로컬도 쓰려면 `http://localhost:5173,https://my-app.vercel.app` 처럼 **쉼표로 나열**) |

7. 배포가 끝나면 API 주소가 생깁니다. 예: `https://hospital-api-xxxx.onrender.com`  
   브라우저에서 `https://....../health` 를 열어 `{"ok":true}` 가 나오면 통신은 됩니다.

### 7-3. 무료 티어 참고

Render 무료 인스턴스는 **일정 시간 요청이 없으면 잠깐 잠들었다가** 첫 요청이 느릴 수 있습니다. 병원 실사용이면 유료 플랜을 검토하세요.

---

## 8. 프론트 배포 (기본: Vercel)

### 8-1. Vercel 설정

1. [https://vercel.com](https://vercel.com) 에서 GitHub 저장소 Import.
2. **Root Directory** 를 `frontend` 로 지정.
3. Framework: **Vite** 로 인식되는지 확인.
4. **Build Command**: `npm run build` (기본값일 수 있음).
5. **Output Directory**: `dist`.

### 8-2. 환경 변수 (Vercel → Settings → Environment Variables)

| Key | 설명 |
|-----|------|
| `VITE_API_URL` | **배포된 API의 원점**. 끝에 슬래시 없이. 예: `https://hospital-api-xxxx.onrender.com` |

저장 후 **Redeploy** 해야 빌드에 반영되는 경우가 많습니다.

### 8-3. 동작 원리

[`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts)는 `VITE_API_URL`이 있으면 `fetch` 대상이 그 호스트로 갑니다.  
로컬 개발 시 `VITE_API_URL`이 비어 있으면 Vite 프록시([`frontend/vite.config.ts`](../frontend/vite.config.ts))가 `/api`를 `localhost:4000`으로 넘깁니다.

### 8-4. Supabase 브라우저 클라이언트 (선택)

| Key | 설명 |
|-----|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

현재 앱의 **로그인/승인**은 이 값 없이도 동작합니다. 실시간·Storage를 붙일 때만 필요합니다.

---

## 9. 처음 관리자 계정으로 로그인

[`server/prisma/seed.ts`](../server/prisma/seed.ts) 기준:

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | 기본: `admin@hospital.local` | `admin1234` |
| (샘플) | `therapist@hospital.local` | `therapy1234` |

**운영 환경에서는 시드 실행 직후 관리자 비밀번호를 반드시 변경**하세요. (로그인 후 정책상 “비밀번호 변경 화면”이 없다면, 일단 DB·시드로 교체하는 방법을 팀에서 정합니다.)

회원가입으로 만든 계정은 **가입 승인** 메뉴에서 관리자가 승인해야 로그인할 수 있습니다.

---

## 10. 보안·운영 체크리스트

- [ ] `JWT_SECRET` 을 추측 불가능한 긴 값으로 바꿨다.
- [ ] `DATABASE_URL` · `DIRECT_URL` · `.env` 가 Git 저장소에 올라가지 않았다 (`.gitignore` 확인).
- [ ] Supabase **service_role** 키·DB 비밀번호를 프론트 코드나 Vercel 프론트 ENV에 넣지 않았다.
- [ ] `CORS_ORIGIN` 에 **실제 서비스 도메인**만 넣었다 (필요 시 로컬용 주소는 쉼표로 추가).
- [ ] API와 프론트 모두 **HTTPS** 로 접속한다.
- [ ] 가능하면 배포 후 `health` 와 로그인·환자 목록 API를 한 번씩 수동 테스트했다.

---

## 11. 자주 나는 오류

### 브라우저 콘솔에 CORS 에러

- **원인**: `CORS_ORIGIN` 이 실제 프론트 주소와 다르거나(프로토콜 `http` vs `https`, 끝 `/` 포함 등), 빌드 시점의 `VITE_API_URL`이 잘못됨.
- **조치**: Render 환경 변수 `CORS_ORIGIN` 수정 후 재배포. Vercel에서 `VITE_API_URL` 확인 후 재배포.

### Prisma: `P1001` (연결 안 됨) / timeout

- **원인**: 방화벽, 잘못된 호스트/포트, Pooler/Direct 혼동.
- **조치**: Supabase 대시보드에서 URI 재복사, Pooler 사용 시 Prisma용 쿼리 파라미터 확인.

### Prisma: `db push` / `migrate` 가 오래 멈춤·반응 없음

- **원인**: **Transaction pooler(6543)** 만 쓰면 DDL이 제대로 처리되지 않거나 대기만 길어지는 경우가 많습니다.
- **조치**: `schema.prisma`에 `directUrl` + `server/.env`의 **`DIRECT_URL`**(Session pooler **5432** 또는 Direct)을 설정한 뒤 다시 실행합니다.

### Prisma: SSL 관련 오류

- **조치**: 연결 문자열에 SSL 관련 옵션이 필요한지 [Prisma · Supabase 가이드](https://www.prisma.io/docs/guides/database/supabase) 확인.

### API는 뜨는데 로그인 후 데이터가 안 보임

- **원인**: DB 마이그레이션·시드가 해당 Supabase DB에 안 돌아갔음.
- **조치**: 배포 로그에서 `prisma migrate deploy` 성공 여부 확인 후, 필요 시 서버에서 시드 재실행.

---

## 12. 환경 변수 예시 모음

### 로컬 `server/.env` (Supabase Postgres 사용 시)

```env
DATABASE_URL="postgresql://postgres.xxxxx:비밀번호@....pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.xxxxx:비밀번호@....pooler.supabase.com:5432/postgres?sslmode=require"
JWT_SECRET="여기에-긴-무작위-문자열"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

### 로컬 `frontend/.env` (로컬 API만 쓸 때)

```env
VITE_API_URL=
```

### Vercel (프론트)

```env
VITE_API_URL=https://your-api.onrender.com
# 선택
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### Render (API)

```env
DATABASE_URL=postgresql://...pooler...:6543/...?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...pooler...:5432/...?sslmode=require
JWT_SECRET=...
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:5173
```

---

## 13. 다른 호스팅으로 옮길 때

- **API**: Railway, Fly.io, AWS EC2, 자사 서버 + `pm2` 등 어디서나 가능합니다. 조건은 **Node 실행**, **`prisma migrate deploy`**, **환경 변수 동일**입니다.
- **프론트**: Netlify, Cloudflare Pages, S3+CloudFront 등 정적 호스팅이면 됩니다. **빌드 시 `VITE_API_URL`만 맞으면** 됩니다.
- **DB**: Supabase 대신 RDS, Neon, 자체 Postgres도 됩니다. `DATABASE_URL`만 맞추면 Prisma는 동일하게 동작합니다(드물게 PostgreSQL 버전/확장 제약 확인).

---

## 도움이 되는 공식 문서

- Supabase: [https://supabase.com/docs](https://supabase.com/docs)
- Prisma + Supabase: [https://www.prisma.io/docs/guides/database/supabase](https://www.prisma.io/docs/guides/database/supabase)
- Render Docs: [https://render.com/docs](https://render.com/docs)
- Vercel: [https://vercel.com/docs](https://vercel.com/docs)

질문이 있으면 이 저장소의 이슈나 팀 위키에 “어느 단계에서 어떤 오류 메시지가 났는지”를 함께 적어 두면 해결에 도움이 됩니다.
