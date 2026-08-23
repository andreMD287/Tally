import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("imprimibles_para_pruebas");

// Helper para crear bordes sutiles
const thinBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: "CCCCCC",
};

const cellBorders = {
  top: thinBorder,
  bottom: thinBorder,
  left: thinBorder,
  right: thinBorder,
};

async function createDocx1(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "DISTRIBUCIONES INDUSTRIALES DE COLOMBIA S.A.S.",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "NIT: 900.542.189-3 | Régimen Común\n", bold: true }),
              new TextRun("Calle 26 # 69D-91, Bogotá D.C. | PBX: (601) 745-0000\n"),
              new TextRun("Resolución DIAN No. 187640029381 de 2026-01-15"),
            ],
          }),
          new Paragraph({ text: "\n" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: cellBorders,
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "FACTURA ELECTRÓNICA DE VENTA: ", bold: true }), new TextRun("FE-1084")] }),
                      new Paragraph({ children: [new TextRun({ text: "FECHA DE EMISIÓN: ", bold: true }), new TextRun("2026-08-14")] }),
                    ],
                  }),
                  new TableCell({
                    borders: cellBorders,
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "CLIENTE: ", bold: true }), new TextRun("Empresas Unidas S.A.S.")] }),
                      new Paragraph({ children: [new TextRun({ text: "NIT CLIENTE: ", bold: true }), new TextRun("860.123.456-7")] }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "\nDETALLE DE PRODUCTOS:" }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Item", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Descripción", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Cant.", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Valor Unit.", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph("1")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("Rodamientos de Alta Precisión")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("10")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$100.000")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$1.000.000")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph("2")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("Aceite Lubricante Sintético 5 Gal")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("2")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$250.000")] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$500.000")] }),
                ],
              }),
            ],
          }),
          new Paragraph({ text: "\n" }),
          new Table({
            alignment: AlignmentType.RIGHT,
            width: { size: 50, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "SUBTOTAL:", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$1.500.000")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "IVA (19%):", bold: true })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph("$285.000")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL A PAGAR:", bold: true, size: 28 })] })] }),
                  new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "$1.785.000", bold: true, size: 28 })] })] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function createDocx2(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "========================================", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "RESTAURANTE Y ASADERO EL BUEN SABOR", alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_2 }),
          new Paragraph({ text: "NIT: 830.124.958-1", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "Carrera 15 # 85-30, Bogotá", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "TIQUETE POS No: POS-5420", alignment: AlignmentType.CENTER, children: [new TextRun({ text: "\nFecha: 2026-08-16  Hora: 13:45", bold: true })] }),
          new Paragraph({ text: "========================================", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "CANT  DESCRIPCIÓN                    VALOR" }),
          new Paragraph({ text: "----------------------------------------" }),
          new Paragraph({ text: "  2   Almuerzo Ejecutivo Especial   $ 80.000" }),
          new Paragraph({ text: "  2   Jugo Natural en Agua          $ 20.000" }),
          new Paragraph({ text: "  1   Corte de Carne Angus 400g     $ 45.000" }),
          new Paragraph({ text: "----------------------------------------" }),
          new Paragraph({ text: "SUBTOTAL:                           $ 145.000", alignment: AlignmentType.RIGHT }),
          new Paragraph({ text: "IVA (0% Excluido):                  $       0", alignment: AlignmentType.RIGHT }),
          new Paragraph({ text: "TOTAL:                              $ 145.000", alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "\nTOTAL PAGADO EN EFECTIVO", bold: true })] }),
          new Paragraph({ text: "========================================", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "¡Gracias por su compra!", alignment: AlignmentType.CENTER }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function createDocx3(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "CUENTA DE COBRO POR HONORARIOS PROFESIONALES", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "CONSECUTIVO: CC-2026-08", alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "\nFecha: 2026-08-18", bold: true })] }),
          new Paragraph({ text: "\nDEBE A:" }),
          new Paragraph({ children: [new TextRun({ text: "CARLOS ALBERTO MENDOZA RÍOS\n", bold: true }), new TextRun("C.C. 1.018.452.930 de Bogotá\n"), new TextRun("Tel: 310-555-1234 | Correo: carlos.mendoza@email.com")] }),
          new Paragraph({ text: "\nLA SUMA DE:" }),
          new Paragraph({ text: "TRES MILLONES DOSCIENTOS MIL PESOS M/CTE ($3.200.000 COP)", children: [new TextRun({ bold: true, size: 26 })] }),
          new Paragraph({ text: "\nPOR CONCEPTO DE:" }),
          new Paragraph({ text: "Desarrollo e implementación del módulo de conciliación y arquitectura backend para el sistema contable corporativo durante el periodo del 1 al 15 de agosto de 2026." }),
          new Paragraph({ text: "\nRESUMEN DE LIQUIDACIÓN:" }),
          new Table({
            width: { size: 60, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph("Subtotal Honorarios:")] }), new TableCell({ borders: cellBorders, children: [new Paragraph("$3.200.000")] })] }),
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph("IVA (No responsable de IVA):")] }), new TableCell({ borders: cellBorders, children: [new Paragraph("$0")] })] }),
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL A COBRAR:", bold: true })] })] }), new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "$3.200.000", bold: true })] })] })] }),
            ],
          }),
          new Paragraph({ text: "\n\n___________________________________\nCARLOS ALBERTO MENDOZA RÍOS\nC.C. 1.018.452.930" }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function createDocx4(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "PAPELERÍA Y SUMINISTROS EL CENTRO S.A.S.", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "NIT: 901.238.471-5 | Carrera 7 # 19-45, Cali\n", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "FACTURA DE VENTA: FAC-3391", alignment: AlignmentType.LEFT, children: [new TextRun({ text: "\nFECHA: 2026-08-20", bold: true })] }),
          new Paragraph({ text: "\nDESCRIPCIÓN DE MERCANCÍA:" }),
          new Paragraph({ text: "- 10 Resmas de Papel Carta Reprograf ($150.000)" }),
          new Paragraph({ text: "- 5 Cajas de Bolígrafos Kilométrico ($100.000)" }),
          new Paragraph({ text: "- 20 Carpetas de Archivo Fuelle ($200.000)" }),
          new Paragraph({ text: "\n" }),
          new Table({
            width: { size: 50, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.RIGHT,
            rows: [
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph("SUBTOTAL:")] }), new TableCell({ borders: cellBorders, children: [new Paragraph("$450.000")] })] }),
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph("IVA (19%):")] }), new TableCell({ borders: cellBorders, children: [new Paragraph("$85.500")] })] }),
              new TableRow({ children: [new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "TOTAL IMPRESO (ERROR):", bold: true })] })] }), new TableCell({ borders: cellBorders, children: [new Paragraph({ children: [new TextRun({ text: "$550.000", bold: true })] })] })] }),
            ],
          }),
          new Paragraph({ text: "\n*(Nota para el test: El subtotal $450.000 + IVA $85.500 debería sumar $535.500, pero la factura tiene impreso $550.000 intencionalmente para validar la regla DIAN de Tally)*", children: [new TextRun({ italics: true, color: "777777" })] }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function createDocx5(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ text: "FERRETERÍA LA CAMPANA LTDA.", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "NIT: 860.002.411-9 (NIT ADULTERADO CON DÍGITO ERRÓNEO)", alignment: AlignmentType.CENTER, children: [new TextRun({ bold: true, color: "FF0000" })] }),
          new Paragraph({ text: "Avenida 68 # 12-40, Medellín | Tel: (604) 444-1234\n", alignment: AlignmentType.CENTER }),
          new Paragraph({ text: "FACTURA COMERCIAL No: FV-8820", children: [new TextRun({ text: "\nFecha: 2026-08-22", bold: true })] }),
          new Paragraph({ text: "\nMATERIALES DE CONSTRUCCIÓN:" }),
          new Paragraph({ text: "1. 10 Bultos de Cemento Gris Argos 50kg: $300.000" }),
          new Paragraph({ text: "2. Varillas Corrugadas de 1/2 pulgada: $447.899" }),
          new Paragraph({ text: "3. IVA (19%): $142.101" }),
          new Paragraph({ text: "\nTOTAL A PAGAR: $890.000 COP", children: [new TextRun({ bold: true, size: 28 })] }),
          new Paragraph({ text: "\n*(Nota para el test: El NIT 860002411 tiene como dígito real el 4, pero la factura dice 9. Tally lo detecta con el algoritmo DIAN)*", children: [new TextRun({ italics: true, color: "777777" })] }),
        ],
      },
    ],
  });
  return await Packer.toBuffer(doc);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Generando 5 documentos Word (.docx) para pruebas de impresión y escaneo...");

  await writeFile(path.join(OUT_DIR, "01_Factura_Electronica_FE-1084.docx"), await createDocx1());
  await writeFile(path.join(OUT_DIR, "02_Tiquete_Restaurante_POS-5420.docx"), await createDocx2());
  await writeFile(path.join(OUT_DIR, "03_Cuenta_de_Cobro_CC-2026-08.docx"), await createDocx3());
  await writeFile(path.join(OUT_DIR, "04_Factura_Error_Aritmetico_FAC-3391.docx"), await createDocx4());
  await writeFile(path.join(OUT_DIR, "05_Factura_NIT_Invalido_FV-8820.docx"), await createDocx5());

  // Generamos también un extracto bancario de prueba que contiene los movimientos correspondientes
  const extractoCsv = `fecha,monto,contraparte,referencia
2026-08-14,1785000,DISTRIBUCIONES INDUSTRIALES,TRX-BCOL-9901
2026-08-16,145000,RESTAURANTE EL BUEN SABOR,TRX-BCOL-9902
2026-08-18,2000000,CARLOS ALBERTO MENDOZA,TRX-BCOL-9903-P1
2026-08-19,1200000,CARLOS ALBERTO MENDOZA,TRX-BCOL-9903-P2
2026-08-22,890000,FERRETERIA LA CAMPANA,TRX-BCOL-9905
`;
  await writeFile(path.join(OUT_DIR, "extracto_bancario_pruebas.csv"), extractoCsv);

  const guiaTxt = `========================================================================
 GUÍA DE PRUEBA REAL (IMPRESIÓN -> FOTO CON CELULAR -> CONCILIACIÓN)
========================================================================

Archivos generados en esta carpeta:
1. 01_Factura_Electronica_FE-1084.docx  -> Factura comercial estándar ($1.785.000).
2. 02_Tiquete_Restaurante_POS-5420.docx -> Tiquete de caja tipo tirilla térmica ($145.000).
3. 03_Cuenta_de_Cobro_CC-2026-08.docx  -> Honorarios ($3.200.000) pagados en 2 cuotas en banco ($2M + $1.2M).
4. 04_Factura_Error_Aritmetico_FAC-3391.docx -> Factura con descuadre matemático intencional.
5. 05_Factura_NIT_Invalido_FV-8820.docx -> Factura con dígito de verificación DIAN errado.
6. extracto_bancario_pruebas.csv       -> Extracto del banco con los movimientos del mes.

CÓMO HACER LA PRUEBA EN TU ENTORNO:
-----------------------------------
1. Abre e imprime (o abre a pantalla completa en otra pantalla) los archivos .docx.
2. Tómales fotos con tu celular (puedes tomarlas con algo de ángulo, sombra o arrugas).
3. Guarda las fotos en una carpeta llamada 'mis_fotos_facturas' (en formato .jpg o .png).
4. Corre Tally apuntando a tus fotos y al extracto de prueba:
   
   npm run cli -- ./mis_fotos_facturas ./imprimibles_para_pruebas/extracto_bancario_pruebas.csv --qvac

5. Abre los reportes generados en 'out/libro_compras.csv' y 'out/discrepancias.md'.
========================================================================
`;
  await writeFile(path.join(OUT_DIR, "INSTRUCCIONES_DE_PRUEBA.txt"), guiaTxt);

  console.log(`\n5 Word test documents and bank statement successfully generated in:\n   ${OUT_DIR}\n`);
}

main().catch((err) => {
  console.error("Error al generar docx:", err);
  process.exit(1);
});
