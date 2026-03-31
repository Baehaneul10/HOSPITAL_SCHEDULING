<script setup lang="ts">
import { RouterLink } from "vue-router";
</script>

<template>
  <div>
    <h1 class="h1">환영합니다</h1>
    <p class="lead">
      구글 스프레드시트의 <strong>치료스케줄</strong>·<strong>암센터 환자명부</strong> 형태에 맞춘 웹 화면입니다. Pinia로 상태를 관리하고, API는 Prisma(DB)와 연동합니다.
    </p>
    <ul class="links">
      <li><RouterLink to="/schedule/counter-pulsation">치료스케줄관리</RouterLink> — 일자·시간 슬롯, 치료명(역박동·페인잼머 등), 환자·명부 연동, 옵션, 상태, 자동 저장</li>
      <li><RouterLink to="/schedule/calendar">월별 캘린더</RouterLink> — 시간·환자·치료명·옵션·상태 한 줄 표시</li>
      <li><RouterLink to="/schedule/search">기간별 스케줄 검색</RouterLink> — 기간·환자·치료명·옵션 필터 및 표 형태 목록</li>
      <li><RouterLink to="/patients">환자명부</RouterLink> — 차트, 입원/외래, 기간, 치료정보, 예상금액 등록·수정</li>
    </ul>
    <p class="note">
      Supabase는 <code>frontend/src/lib/supabase.ts</code>에서 클라이언트를 만들고, 실시간 구독·Storage 등에 연결할 수 있습니다. 인증은 현재 API JWT와 병행해 구성하면 됩니다.
    </p>
  </div>
</template>

<style scoped>
.h1 {
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
}
.lead {
  color: #475569;
  line-height: 1.6;
  max-width: 52rem;
}
.links {
  margin: 1rem 0 0;
  padding-left: 1.25rem;
  line-height: 1.8;
  color: #334155;
}
.note {
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #64748b;
  max-width: 52rem;
}
code {
  background: #e2e8f0;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.8rem;
}
</style>
