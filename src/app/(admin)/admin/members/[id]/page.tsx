export default function AdminMemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">회원 상세</h1>
      <p className="text-muted-foreground">
        회원 상세 — 개발 예정 (ID: {params.id})
      </p>
    </div>
  );
}
