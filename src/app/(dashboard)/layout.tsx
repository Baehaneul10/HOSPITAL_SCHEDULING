import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { ROLES } from "@/lib/constants";

const nav = [
  { href: "/schedule/search", label: "기간 검색" },
  { href: "/schedule/calendar", label: "월별 캘린더" },
  { href: "/therapist/counter-pulsation", label: "역박동 스케줄" },
  { href: "/patients", label: "환자명부" },
] as const;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-blue-900 bg-blue-950 text-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/schedule/search" className="text-lg font-semibold tracking-tight">
              치료 스케줄 관리
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-1 text-blue-100 hover:bg-blue-900 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-blue-200">
              {session.user.name ?? session.user.email}
              <span className="ml-2 rounded bg-blue-800 px-1.5 py-0.5 text-xs">
                {session.user.role === ROLES.ADMIN ? "경영" : "치료사"}
              </span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
