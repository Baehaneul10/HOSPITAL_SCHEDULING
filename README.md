# hospital-scheduling

무등산생태요양병원 치료 스케줄·환자명부용 웹앱입니다. **Vue 3 + Vite** 프론트엔드, **Express + Prisma** API, 로컬 기본 DB는 SQLite입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

- API: `http://localhost:4000` (환경에 따라 다를 수 있음)
- 웹: `http://localhost:5173` — 개발 시 `/api`는 Vite 프록시로 API에 전달됩니다.

자세한 환경 변수는 [`server/.env.example`](server/.env.example), [`frontend/.env.example`](frontend/.env.example) 를 참고하세요.

## 인터넷에 올리기 (Supabase DB + 호스팅)

**외부에서 접속** 가능하게 하려면 Supabase PostgreSQL에 DB를 두고, API·프론트를 각각 호스팅하면 됩니다. 초보자용 단계별 안내는 아래 문서를 보세요.

→ **[docs/DEPLOY_SUPABASE.md](docs/DEPLOY_SUPABASE.md)**
