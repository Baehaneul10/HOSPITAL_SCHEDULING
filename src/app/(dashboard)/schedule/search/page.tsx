import { ScheduleSearchClient } from "./ScheduleSearchClient";

export default function ScheduleSearchPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">기간별 스케줄 검색</h1>
      <p className="mb-6 text-sm text-slate-600">
        시작·종료일과 키워드(이름, 치료명, 병동, 치료옵션, 치료상태 등)로 예약을 검색합니다.
      </p>
      <ScheduleSearchClient />
    </div>
  );
}
