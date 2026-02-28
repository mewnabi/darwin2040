export default function RegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">신청자 관리</h1>
      <p className="text-muted-foreground">
        신청자 관리 — 개발 예정 (ID: {params.id})
      </p>
    </div>
  );
}
