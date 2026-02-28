"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { useSeminars } from "@/hooks/use-seminars";
import { SeminarList } from "@/components/seminars/seminar-list";
import { SEMINAR_TYPE_LABELS } from "@/constants/seminar-types";
import { CONTENT_CATEGORIES } from "@/constants/content-categories";
import { cn } from "@/lib/utils";

const TYPE_FILTERS = [
  { value: "", label: "전체" },
  ...Object.entries(SEMINAR_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export default function HomePage() {
  const { data: session } = useSession();
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: seminars, isLoading } = useSeminars({
    status: "PUBLISHED",
    type: typeFilter || undefined,
    search: search || undefined,
  });

  const filteredSeminars = seminars?.filter((s) => {
    if (categoryFilter && s.category !== categoryFilter) return false;
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-500 to-navy-700 text-white py-16 md:py-24">
        <div className="container text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            <span className="text-gold-400">Darwin</span> 2040
          </h1>
          <p className="text-lg md:text-xl text-navy-200 mb-8 max-w-2xl mx-auto">
            창업가와 중소기업 경영자를 위한 비즈니스 세미나 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#seminars"
              className="inline-flex items-center justify-center rounded-md bg-gold-500 px-6 py-3 text-sm font-medium text-navy-900 hover:bg-gold-400 transition-colors"
            >
              세미나 둘러보기
            </a>
            {session ? (
              <a
                href="/my"
                className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                마이페이지
              </a>
            ) : (
              <a
                href="/register"
                className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                회원 가입
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Seminar List Section */}
      <section id="seminars" className="container py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            다가오는 세미나
          </h2>

          {/* Filters */}
          <div className="space-y-4">
            {/* Type Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {TYPE_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTypeFilter(filter.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    typeFilter === filter.value
                      ? "bg-navy-500 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Category + Search Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">전체 카테고리</option>
                {CONTENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="세미나 검색..."
                    className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-md bg-navy-500 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
                >
                  검색
                </button>
              </form>
            </div>
          </div>
        </div>

        <SeminarList seminars={filteredSeminars} isLoading={isLoading} />

        {!isLoading && filteredSeminars?.length === 0 && seminars && seminars.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              선택한 카테고리에 해당하는 세미나가 없습니다.
            </p>
            <button
              onClick={() => setCategoryFilter("")}
              className="mt-2 text-sm text-navy-500 hover:underline"
            >
              필터 초기화
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
