/**
 * Utility to export data as a CSV file that triggers a browser download.
 */

/** Convert an array of objects to a CSV string */
function toCsvString(headers: string[], rows: (string | number)[][]): string {
  const escape = (val: string | number) => {
    const str = String(val ?? "");
    // Wrap in quotes if the value contains commas, quotes or newlines
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const headerLine = headers.map(escape).join(",");
  const dataLines  = rows.map(row => row.map(escape).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

/** Trigger a CSV download in the browser */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const csv  = toCsvString(headers, rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
