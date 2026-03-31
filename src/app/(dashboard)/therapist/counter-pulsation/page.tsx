import { CounterPulsationClient } from "./CounterPulsationClient";

export default function CounterPulsationPage() {
  return (
    <div>
      <div className="mb-2 border-b-2 border-blue-900 bg-blue-950 px-4 py-3 text-white">
        <h1 className="text-lg font-semibold">Counter-pulsation (역박동) 스케줄 관리 [무등산 에코요양병원]</h1>
      </div>
      <CounterPulsationClient />
    </div>
  );
}
