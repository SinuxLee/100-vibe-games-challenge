export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

export function parseConfigCsv(raw: string): Record<string, number> {
  const rows = parseCsv(raw);
  const config: Record<string, number> = {};
  for (const row of rows) {
    if (row.key && row.value !== undefined) {
      config[row.key] = Number(row.value);
    }
  }
  return config;
}
