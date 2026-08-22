import type { Invoice } from "../../src/types.js";

export interface LineItem {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface RenderMeta {
  ciudad: string;
  ivaPct: number;
}

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("es-CO");

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemsRows(items: LineItem[], x: number, yStart: number, rowH: number, font: string, size: number, color: string): string {
  return items
    .map((it, i) => {
      const y = yStart + i * rowH;
      return `
      <text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${color}">${esc(it.descripcion)}</text>
      <text x="${x + 340}" y="${y}" font-family="${font}" font-size="${size}" fill="${color}" text-anchor="end">${it.cantidad}</text>
      <text x="${x + 460}" y="${y}" font-family="${font}" font-size="${size}" fill="${color}" text-anchor="end">${fmtMoney(it.precioUnitario)}</text>
      <text x="${x + 600}" y="${y}" font-family="${font}" font-size="${size}" fill="${color}" text-anchor="end">${fmtMoney(it.total)}</text>`;
    })
    .join("\n");
}

// Design 1: moderno, barra azul, sans-serif
function design1(inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const W = 800, H = 1100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <rect x="0" y="0" width="${W}" height="90" fill="#1f4fd6"/>
  <text x="40" y="55" font-family="Arial, sans-serif" font-size="30" fill="white" font-weight="bold">FACTURA DE VENTA</text>
  <text x="40" y="130" font-family="Arial, sans-serif" font-size="22" fill="#111" font-weight="bold">${esc(inv.proveedor)}</text>
  <text x="40" y="155" font-family="Arial, sans-serif" font-size="14" fill="#444">NIT ${esc(inv.nit ?? "")}  -  ${esc(meta.ciudad)}</text>
  <text x="${W - 40}" y="130" font-family="Arial, sans-serif" font-size="14" fill="#444" text-anchor="end">No. ${esc(inv.numeroFactura ?? "")}</text>
  <text x="${W - 40}" y="150" font-family="Arial, sans-serif" font-size="14" fill="#444" text-anchor="end">Fecha: ${esc(inv.fecha)}</text>
  <line x1="40" y1="190" x2="${W - 40}" y2="190" stroke="#1f4fd6" stroke-width="2"/>
  <text x="40" y="220" font-family="Arial, sans-serif" font-size="13" fill="#888" font-weight="bold">DESCRIPCION</text>
  <text x="380" y="220" font-family="Arial, sans-serif" font-size="13" fill="#888" font-weight="bold" text-anchor="end">CANT</text>
  <text x="500" y="220" font-family="Arial, sans-serif" font-size="13" fill="#888" font-weight="bold" text-anchor="end">V.UNIT</text>
  <text x="640" y="220" font-family="Arial, sans-serif" font-size="13" fill="#888" font-weight="bold" text-anchor="end">TOTAL</text>
  ${itemsRows(items, 40, 255, 34, "Arial, sans-serif", 14, "#222")}
  <line x1="40" y1="${255 + items.length * 34}" x2="${W - 40}" y2="${255 + items.length * 34}" stroke="#ccc" stroke-width="1"/>
  <text x="500" y="${300 + items.length * 34}" font-family="Arial, sans-serif" font-size="14" fill="#444" text-anchor="end">Subtotal</text>
  <text x="640" y="${300 + items.length * 34}" font-family="Arial, sans-serif" font-size="14" fill="#222" text-anchor="end">${fmtMoney(inv.subtotal)}</text>
  <text x="500" y="${330 + items.length * 34}" font-family="Arial, sans-serif" font-size="14" fill="#444" text-anchor="end">IVA (${meta.ivaPct}%)</text>
  <text x="640" y="${330 + items.length * 34}" font-family="Arial, sans-serif" font-size="14" fill="#222" text-anchor="end">${fmtMoney(inv.iva)}</text>
  <text x="500" y="${365 + items.length * 34}" font-family="Arial, sans-serif" font-size="18" fill="#1f4fd6" font-weight="bold" text-anchor="end">TOTAL</text>
  <text x="640" y="${365 + items.length * 34}" font-family="Arial, sans-serif" font-size="18" fill="#1f4fd6" font-weight="bold" text-anchor="end">${fmtMoney(inv.total)}</text>
</svg>`;
}

// Design 2: carta clasica, serif, centrado
function design2(inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const W = 800, H = 1100;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#fdfcf8"/>
  <text x="${W / 2}" y="70" font-family="Georgia, serif" font-size="26" fill="#222" text-anchor="middle" font-weight="bold">${esc(inv.proveedor)}</text>
  <text x="${W / 2}" y="95" font-family="Georgia, serif" font-size="13" fill="#555" text-anchor="middle">NIT ${esc(inv.nit ?? "")} - ${esc(meta.ciudad)}</text>
  <line x1="150" y1="115" x2="${W - 150}" y2="115" stroke="#222" stroke-width="1"/>
  <line x1="150" y1="119" x2="${W - 150}" y2="119" stroke="#222" stroke-width="1"/>
  <text x="${W / 2}" y="150" font-family="Georgia, serif" font-size="18" fill="#222" text-anchor="middle">Factura No. ${esc(inv.numeroFactura ?? "")}</text>
  <text x="${W / 2}" y="172" font-family="Georgia, serif" font-size="13" fill="#555" text-anchor="middle">Fecha de emision: ${esc(inv.fecha)}</text>
  <text x="70" y="230" font-family="Georgia, serif" font-size="12" fill="#666">DESCRIPCION</text>
  <text x="410" y="230" font-family="Georgia, serif" font-size="12" fill="#666" text-anchor="end">CANT</text>
  <text x="530" y="230" font-family="Georgia, serif" font-size="12" fill="#666" text-anchor="end">V.UNIT</text>
  <text x="670" y="230" font-family="Georgia, serif" font-size="12" fill="#666" text-anchor="end">TOTAL</text>
  ${itemsRows(items, 70, 265, 32, "Georgia, serif", 13, "#222").replace(/x="380"/g, 'x="410"').replace(/x="460"/g, 'x="530"').replace(/x="600"/g, 'x="670"')}
  <line x1="70" y1="${310 + items.length * 32}" x2="${W - 70}" y2="${310 + items.length * 32}" stroke="#999" stroke-width="1"/>
  <text x="530" y="${345 + items.length * 32}" font-family="Georgia, serif" font-size="13" fill="#444" text-anchor="end">Subtotal</text>
  <text x="670" y="${345 + items.length * 32}" font-family="Georgia, serif" font-size="13" fill="#222" text-anchor="end">${fmtMoney(inv.subtotal)}</text>
  <text x="530" y="${372 + items.length * 32}" font-family="Georgia, serif" font-size="13" fill="#444" text-anchor="end">IVA ${meta.ivaPct}%</text>
  <text x="670" y="${372 + items.length * 32}" font-family="Georgia, serif" font-size="13" fill="#222" text-anchor="end">${fmtMoney(inv.iva)}</text>
  <text x="530" y="${405 + items.length * 32}" font-family="Georgia, serif" font-size="17" fill="#222" font-weight="bold" text-anchor="end">Valor Total</text>
  <text x="670" y="${405 + items.length * 32}" font-family="Georgia, serif" font-size="17" fill="#222" font-weight="bold" text-anchor="end">${fmtMoney(inv.total)}</text>
</svg>`;
}

// Design 3: caja/tabla, tipo software contable
function design3(inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const W = 800, H = 1100;
  const tableTop = 220;
  const rowH = 30;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="#333" stroke-width="2"/>
  <text x="50" y="65" font-family="Consolas, monospace" font-size="18" fill="#000" font-weight="bold">${esc(inv.proveedor)}</text>
  <text x="50" y="88" font-family="Consolas, monospace" font-size="12" fill="#333">NIT: ${esc(inv.nit ?? "")}   Ciudad: ${esc(meta.ciudad)}</text>
  <text x="50" y="108" font-family="Consolas, monospace" font-size="12" fill="#333">Factura: ${esc(inv.numeroFactura ?? "")}   Fecha: ${esc(inv.fecha)}</text>
  <rect x="50" y="${tableTop}" width="${W - 100}" height="26" fill="#e5e5e5" stroke="#333"/>
  <text x="58" y="${tableTop + 18}" font-family="Consolas, monospace" font-size="12" fill="#000">DESCRIPCION</text>
  <text x="420" y="${tableTop + 18}" font-family="Consolas, monospace" font-size="12" fill="#000" text-anchor="end">CANT</text>
  <text x="560" y="${tableTop + 18}" font-family="Consolas, monospace" font-size="12" fill="#000" text-anchor="end">V.UNIT</text>
  <text x="700" y="${tableTop + 18}" font-family="Consolas, monospace" font-size="12" fill="#000" text-anchor="end">TOTAL</text>
  <rect x="50" y="${tableTop + 26}" width="${W - 100}" height="${items.length * rowH}" fill="none" stroke="#333"/>
  ${itemsRows(items, 58, tableTop + 26 + 20, rowH, "Consolas, monospace", 12, "#111").replace(/x="380"/g, 'x="420"').replace(/x="460"/g, 'x="560"').replace(/x="600"/g, 'x="700"')}
  <text x="560" y="${tableTop + 26 + items.length * rowH + 40}" font-family="Consolas, monospace" font-size="13" fill="#333" text-anchor="end">Subtotal:</text>
  <text x="700" y="${tableTop + 26 + items.length * rowH + 40}" font-family="Consolas, monospace" font-size="13" fill="#000" text-anchor="end">${fmtMoney(inv.subtotal)}</text>
  <text x="560" y="${tableTop + 26 + items.length * rowH + 65}" font-family="Consolas, monospace" font-size="13" fill="#333" text-anchor="end">IVA ${meta.ivaPct}%:</text>
  <text x="700" y="${tableTop + 26 + items.length * rowH + 65}" font-family="Consolas, monospace" font-size="13" fill="#000" text-anchor="end">${fmtMoney(inv.iva)}</text>
  <rect x="440" y="${tableTop + 26 + items.length * rowH + 80}" width="270" height="34" fill="#000"/>
  <text x="560" y="${tableTop + 26 + items.length * rowH + 103}" font-family="Consolas, monospace" font-size="14" fill="white" text-anchor="end">TOTAL:</text>
  <text x="700" y="${tableTop + 26 + items.length * rowH + 103}" font-family="Consolas, monospace" font-size="14" fill="white" text-anchor="end">${fmtMoney(inv.total)}</text>
</svg>`;
}

// Design 4: recibo angosto tipo POS
function design4(inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const W = 420, H = 700 + items.length * 26;
  let y = 120;
  const rows = items
    .map((it) => {
      const line = `
      <text x="20" y="${y}" font-family="Consolas, monospace" font-size="12" fill="#111">${esc(it.descripcion)}</text>
      <text x="${W - 20}" y="${y + 16}" font-family="Consolas, monospace" font-size="12" fill="#111" text-anchor="end">${it.cantidad} x ${fmtMoney(it.precioUnitario)} = ${fmtMoney(it.total)}</text>`;
      y += 40;
      return line;
    })
    .join("\n");
  const totalsY = y + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <text x="${W / 2}" y="35" font-family="Consolas, monospace" font-size="15" fill="#000" text-anchor="middle" font-weight="bold">${esc(inv.proveedor)}</text>
  <text x="${W / 2}" y="52" font-family="Consolas, monospace" font-size="10" fill="#333" text-anchor="middle">NIT ${esc(inv.nit ?? "")}</text>
  <text x="${W / 2}" y="66" font-family="Consolas, monospace" font-size="10" fill="#333" text-anchor="middle">${esc(meta.ciudad)}</text>
  <line x1="15" y1="80" x2="${W - 15}" y2="80" stroke="#000" stroke-dasharray="4,3"/>
  <text x="20" y="98" font-family="Consolas, monospace" font-size="11" fill="#000">Factura ${esc(inv.numeroFactura ?? "")}</text>
  <text x="${W - 20}" y="98" font-family="Consolas, monospace" font-size="11" fill="#000" text-anchor="end">${esc(inv.fecha)}</text>
  <line x1="15" y1="108" x2="${W - 15}" y2="108" stroke="#000" stroke-dasharray="4,3"/>
  ${rows}
  <line x1="15" y1="${totalsY - 15}" x2="${W - 15}" y2="${totalsY - 15}" stroke="#000" stroke-dasharray="4,3"/>
  <text x="20" y="${totalsY}" font-family="Consolas, monospace" font-size="12" fill="#000">SUBTOTAL</text>
  <text x="${W - 20}" y="${totalsY}" font-family="Consolas, monospace" font-size="12" fill="#000" text-anchor="end">${fmtMoney(inv.subtotal)}</text>
  <text x="20" y="${totalsY + 18}" font-family="Consolas, monospace" font-size="12" fill="#000">IVA ${meta.ivaPct}%</text>
  <text x="${W - 20}" y="${totalsY + 18}" font-family="Consolas, monospace" font-size="12" fill="#000" text-anchor="end">${fmtMoney(inv.iva)}</text>
  <text x="20" y="${totalsY + 42}" font-family="Consolas, monospace" font-size="15" fill="#000" font-weight="bold">TOTAL</text>
  <text x="${W - 20}" y="${totalsY + 42}" font-family="Consolas, monospace" font-size="15" fill="#000" font-weight="bold" text-anchor="end">${fmtMoney(inv.total)}</text>
</svg>`;
}

// Design 5: colorido, bloque de logo, caja de totales
function design5(inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const W = 800, H = 1100;
  const colors = ["#e8622c", "#0f9d58", "#8e24aa", "#00838f"];
  const accent = colors[inv.total % colors.length] ?? colors[0];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  <rect x="40" y="40" width="70" height="70" fill="${accent}"/>
  <text x="55" y="82" font-family="Arial, sans-serif" font-size="24" fill="white" font-weight="bold">${esc(inv.proveedor.slice(0, 2).toUpperCase())}</text>
  <text x="125" y="65" font-family="Arial, sans-serif" font-size="20" fill="#111" font-weight="bold">${esc(inv.proveedor)}</text>
  <text x="125" y="88" font-family="Arial, sans-serif" font-size="13" fill="#555">NIT ${esc(inv.nit ?? "")}  |  ${esc(meta.ciudad)}</text>
  <rect x="${W - 260}" y="40" width="220" height="70" fill="#f2f2f2" stroke="${accent}" stroke-width="2"/>
  <text x="${W - 250}" y="65" font-family="Arial, sans-serif" font-size="12" fill="#333">Factura No.</text>
  <text x="${W - 250}" y="85" font-family="Arial, sans-serif" font-size="15" fill="#111" font-weight="bold">${esc(inv.numeroFactura ?? "")}</text>
  <text x="${W - 250}" y="102" font-family="Arial, sans-serif" font-size="11" fill="#555">Fecha: ${esc(inv.fecha)}</text>
  <rect x="40" y="140" width="${W - 80}" height="30" fill="${accent}"/>
  <text x="50" y="161" font-family="Arial, sans-serif" font-size="13" fill="white" font-weight="bold">DESCRIPCION</text>
  <text x="420" y="161" font-family="Arial, sans-serif" font-size="13" fill="white" font-weight="bold" text-anchor="end">CANT</text>
  <text x="560" y="161" font-family="Arial, sans-serif" font-size="13" fill="white" font-weight="bold" text-anchor="end">V.UNIT</text>
  <text x="720" y="161" font-family="Arial, sans-serif" font-size="13" fill="white" font-weight="bold" text-anchor="end">TOTAL</text>
  ${itemsRows(items, 50, 200, 34, "Arial, sans-serif", 14, "#222").replace(/x="380"/g, 'x="420"').replace(/x="460"/g, 'x="560"').replace(/x="600"/g, 'x="720"')}
  <rect x="450" y="${240 + items.length * 34}" width="310" height="120" fill="#f9f9f9" stroke="#ddd"/>
  <text x="470" y="${270 + items.length * 34}" font-family="Arial, sans-serif" font-size="13" fill="#444">Subtotal</text>
  <text x="740" y="${270 + items.length * 34}" font-family="Arial, sans-serif" font-size="13" fill="#222" text-anchor="end">${fmtMoney(inv.subtotal)}</text>
  <text x="470" y="${296 + items.length * 34}" font-family="Arial, sans-serif" font-size="13" fill="#444">IVA (${meta.ivaPct}%)</text>
  <text x="740" y="${296 + items.length * 34}" font-family="Arial, sans-serif" font-size="13" fill="#222" text-anchor="end">${fmtMoney(inv.iva)}</text>
  <text x="470" y="${330 + items.length * 34}" font-family="Arial, sans-serif" font-size="17" fill="${accent}" font-weight="bold">TOTAL</text>
  <text x="740" y="${330 + items.length * 34}" font-family="Arial, sans-serif" font-size="17" fill="${accent}" font-weight="bold" text-anchor="end">${fmtMoney(inv.total)}</text>
</svg>`;
}

export const DESIGNS = [design1, design2, design3, design4, design5];

export function renderInvoiceSvg(designIndex: number, inv: Invoice, items: LineItem[], meta: RenderMeta): string {
  const fn = DESIGNS[designIndex % DESIGNS.length];
  return fn(inv, items, meta);
}
