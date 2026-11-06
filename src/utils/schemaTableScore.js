// Only explicitly named faculty/self score columns contribute to the table total.
// Keep answer lookup identical to the dynamic renderer; do not rename stored keys.
//
// `maxMarks` (optional, the table field's own configured ceiling) clamps the
// returned TOTAL only — it never blocks or rewrites what's typed into an
// individual row. A table with e.g. a 10-per-row cap and a 60 table-level cap
// can still have more than 6 rows each scored near 10 (nothing stops a 7th
// row), so the raw per-row sum can legitimately exceed the table's own max;
// this is what keeps the displayed/stored total from exceeding it anyway.
export function schemaTableScore(columns, rows, maxMarks) {
  const scoreColumns = columns.filter((column) => {
    const label = String(column.label || column.name || column.key || '')
      .trim().toLowerCase().replace(/\s+/g, ' ');
    return ['faculty score', 'self score'].includes(label)
      && ['number', 'integer', 'text', 'computed'].includes(column.type);
  });
  const total = rows.reduce((total, row) => total + scoreColumns.reduce((sum, column) => {
    const answer = row[column.name || column.key];
    if (typeof answer !== 'number' && typeof answer !== 'string') return sum;
    const value = Number(answer);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0), 0);
  const max = Number(maxMarks);
  if (maxMarks === undefined || maxMarks === null || !Number.isFinite(max)) return total;
  return Math.min(Math.max(0, total), max);
}
