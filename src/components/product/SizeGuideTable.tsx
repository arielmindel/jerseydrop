export default function SizeGuideTable() {
  const rows: { size: string; chest: string; length: string; shoulder: string }[] = [
    { size: "S", chest: "94-100", length: "68", shoulder: "44" },
    { size: "M", chest: "100-106", length: "70", shoulder: "46" },
    { size: "L", chest: "106-112", length: "72", shoulder: "48" },
    { size: "XL", chest: "112-118", length: "74", shoulder: "50" },
    { size: "2XL", chest: "118-124", length: "76", shoulder: "52" },
    { size: "3XL", chest: "124-130", length: "78", shoulder: "54" },
    { size: "4XL", chest: "130-136", length: "80", shoulder: "56" },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        המידות בס״מ. בגרסת Player הגזרה קצת יותר צמודה לגוף — עלו מידה אם אתם
        בין שני מידות.
      </p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="font-display text-xs uppercase tracking-widest text-muted">
              <th className="py-2 text-start ps-3">מידה</th>
              <th className="py-2 text-start">חזה</th>
              <th className="py-2 text-start">אורך</th>
              <th className="py-2 text-start pe-3">כתף</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.size}>
                <td className="py-2 ps-3 font-display font-bold">{r.size}</td>
                <td className="py-2">{r.chest}</td>
                <td className="py-2">{r.length}</td>
                <td className="py-2 pe-3">{r.shoulder}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
