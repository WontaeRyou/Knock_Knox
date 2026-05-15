// console/app/page.tsx — 루트 페이지: 검수 콘솔로 안내
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold mb-3 tracking-tight">🛡 해일미리</h1>
      <p className="text-sm text-[#8A9BA8] mb-8">
        사내 업무 문의 자동 응답 AI Agent — Knox_Knox PoC
      </p>
      <div className="flex gap-3">
        <Link
          href="/console"
          className="px-5 py-2.5 rounded-lg bg-[#4F8AFE] hover:bg-[#3E78EA] text-sm font-semibold"
        >
          검수 콘솔 열기 →
        </Link>
        <Link
          href="/wiki/add"
          className="px-5 py-2.5 rounded-lg border border-[#2A2F36] bg-[#1A1F22] hover:bg-[#222A2F] text-sm"
        >
          Wiki 적재 페이지
        </Link>
      </div>
    </main>
  );
}
