import type { ExtractoLinea } from "../types.js";

/** Parser simple de CSV: soporta campos entre comillas con comas/comillas escapadas ("" -> "). */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

export function parseExtractoCsv(csvText: string): ExtractoLinea[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const [header, ...rows] = lines;
  const cols = parseCsvLine(header).map((c) => c.trim().toLowerCase());
  const idx = {
    fecha: cols.indexOf("fecha"),
    monto: cols.indexOf("monto"),
    contraparte: cols.indexOf("contraparte"),
    referencia: cols.indexOf("referencia"),
  };
  if (Object.values(idx).some((i) => i === -1)) {
    throw new Error(`extracto.csv: encabezado invalido, se esperaba fecha,monto,contraparte,referencia. Recibido: ${header}`);
  }
  return rows.map((line) => {
    const f = parseCsvLine(line);
    return {
      fecha: f[idx.fecha].trim(),
      monto: Number(f[idx.monto]),
      contraparte: f[idx.contraparte].trim(),
      referencia: f[idx.referencia].trim(),
    };
  });
}
