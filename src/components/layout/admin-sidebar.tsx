"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Mic2,
  Users,
  CreditCard,
  ClipboardList,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/seminars", label: "세미나 관리", icon: Calendar },
  { href: "/admin/speakers", label: "연사 관리", icon: Mic2 },
  { href: "/admin/members", label: "회원 관리", icon: Users },
  { href: "/admin/payments", label: "결제/정산", icon: CreditCard },
  { href: "/admin/surveys", label: "설문 관리", icon: ClipboardList },
  { href: "/admin/reports", label: "보고서", icon: FileBarChart },
  { href: "/admin/settings", label: "설정", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-navy-500 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-navy-400">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-1">
            <span className="text-lg font-bold">Darwin</span>
            <span className="text-lg font-bold text-gold-400">2040</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-navy-400 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Admin Badge */}
      {!collapsed && (
        <div className="px-4 py-2">
          <span className="text-xs bg-gold-500 text-navy-900 px-2 py-0.5 rounded-full font-medium">
            관리자
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="mt-2 px-2 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gold-500 text-navy-900"
                  : "text-navy-200 hover:bg-navy-400 hover:text-white",
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
