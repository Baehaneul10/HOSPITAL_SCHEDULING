import { ScheduleCalendarClient } from "./ScheduleCalendarClient";

export default function ScheduleCalendarPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">월별 캘린더</h1>
      <p className="mb-6 text-sm text-slate-600">
        월을 이동하며 예약을 확인합니다. 표시 형식(이름 / 이름+치료 / 줄바꿈)을 선택할 수 있습니다.
      </p>
      <ScheduleCalendarClient />
    </div>
  );
}
