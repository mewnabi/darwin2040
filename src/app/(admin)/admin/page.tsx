import { Calendar, Users, Mic2, CreditCard } from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    { label: "총 세미나", value: "0", icon: Calendar, color: "bg-blue-50 text-blue-600" },
    { label: "총 회원", value: "0", icon: Users, color: "bg-green-50 text-green-600" },
    { label: "등록 연사", value: "0", icon: Mic2, color: "bg-purple-50 text-purple-600" },
    { label: "이번 달 매출", value: "₩0", icon: CreditCard, color: "bg-gold-50 text-gold-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">관리자 대시보드</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">최근 세미나</h2>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">최근 신청</h2>
          <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
        </div>
      </div>
    </div>
  );
}
