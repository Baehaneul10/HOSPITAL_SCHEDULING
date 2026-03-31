import { PatientsClient } from "./PatientsClient";

export default function PatientsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">환자명부</h1>
      <p className="mb-6 text-sm text-slate-600">
        차트번호·환자명·입원/외래·입원일·치료기간·치료정보·예상금액·참고사항을 관리합니다. 등록·수정·삭제는 경영(관리자) 계정만 가능합니다.
      </p>
      <PatientsClient />
    </div>
  );
}
