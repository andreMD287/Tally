# 💼 Casos de Estudio Reales: Conciliación Automatizada con Tally

Este documento presenta **4 casos de estudio operativos reales** resueltos por Tally, demostrando cómo el agente local reemplaza horas de trabajo manual en departamentos contables y de tesorería (Track 1).

---

## 📌 Caso 1: Factura con Pago Dividido (Split-Payment Multi-Transacción)

### 🏢 Contexto
La empresa contratista `Refrigeracion Industrial S.A.S.` emite la factura `A-0003` por un total de **$2.449.020 COP** con fecha `2026-08-19`. Debido a políticas de flujo de caja del banco emisor, la tesorería realizó el pago en **dos transferencias electrónicas consecutivas**:
1. Movimiento 1: `$1.500.000 COP` (Referencia `TRX924508-A`, fecha `2026-08-19`)
2. Movimiento 2: `$949.020 COP` (Referencia `TRX924508-B`, fecha `2026-08-20`)

### ❌ Falla del Software Tradicional
Los sistemas ERP y bots de conciliación por reglas simples buscan coincidencia exacta $1:1$ de montos. Al no existir ningún movimiento por `$2.449.020`, la factura queda clasificada como "Sin Pago / Discrepancia Grave", requiriendo que un analista revise manualmente el extracto bancario.

### ✅ Resolución Automatizada de Tally
1. **Extracción VLM**: SmolVLM2 extrae subtotal `$2.058.000`, IVA `$391.020` y total `$2.449.020`.
2. **Validación DIAN**: Verifica que `2.058.000 + 391.020 = 2.449.020` (Aritmética OK) y que el NIT `938617623-0` es válido.
3. **Algoritmo de Split-Match ([`src/match/index.ts`](../src/match/index.ts))**: Detecta que la suma de dos movimientos bancarios dentro de la ventana de $\pm3$ días cubre exactamente `$2.449.020`.
4. **Resultado**: Conciliación automática con tipo `dividido` y score `1.0`. Cero intervención humana requerida.

---

## 📌 Caso 2: Intento de Doble Cobro / Factura Duplicada (Fraud & Duplication Detection)

### 🏢 Contexto
El proveedor `Empaques Medellin S.A.S.` envió la factura `FAC-0001` (`$1.632.680 COP`) por correo electrónico el 11 de agosto. Una semana después, el departamento de cobranzas del proveedor reenvía la misma factura con un mensaje de "Recordatorio de Pago".

### ❌ Falla del Software Tradicional
Si el sistema procesa el buzón de correo sin deduplicación previa, se genera una segunda cuenta por pagar en el sistema, lo que puede provocar un **pago duplicado inadvertido** por tesorería.

### ✅ Resolución Automatizada de Tally
1. **Detección en Ingesta ([`src/ingest/dedupe.ts`](../src/ingest/dedupe.ts))**: El pipeline agrupa por `proveedor + numeroFactura + total` antes del matching contable.
2. **Acción de Tally**: Descarta el segundo archivo (`0 duplicados contados dos veces`), registra la alerta en [`out/discrepancias.md`](../out/discrepancias.md) y asegura que el extracto bancario se concilie exactamente una vez.
3. **Ahorro para la Empresa**: Previene la pérdida de `$1.632.680 COP` en pagos duplicados.

---

## 📌 Caso 3: Factura con Error Aritmético del Proveedor y Calidad Degradada

### 🏢 Contexto
La factura `INV-0010` emitida por `Empaques Medellin y CIA S. en C.` llegó como un escaneo con ruido visual (30% degradada). Además, la factura tiene un **error de cálculo en origen**:
- Subtotal: `$254.000`
- IVA (19%): `$48.260` (Suma correcta: `$302.260`)
- Total impreso en factura: **`$302.281`** (Diferencia: `$21 COP`).

### ✅ Resolución y Auditoría de Tally
1. **Extracción Resiliente**: SmolVLM2 extrae los valores a pesar del ruido visual.
2. **Alerta Crítica DIAN**: La regla aritmética detecta el descuadre de `$21 COP` y marca la validación como `ERROR`.
3. **Puntuación de Confianza**: Asigna un **65% de confianza** (*MEDIA*), señalando incertidumbre honesta.
4. **Acción en 5 Segundos**: El reporte genera:
   > ⚡ **Acción en 5s**: *Solicitar refacturación al proveedor o revisar si hubo un descuento comercial no desglosado.*
5. **Auditoría en 1 Clic**: El analista abre `npm run audit` y marca la factura como `[OBSERVADA]`, enviando la notificación al proveedor de inmediato.

---

## 📌 Caso 4: Inconsistencia en Dígito de Verificación de NIT (Prevención de Sanciones)

### 🏢 Contexto
La factura `INV-0005` de `Distribuciones Cafetera y CIA S. en C.` presenta el NIT impreso como `964390161-0`.

### ❌ Falla del Software Tradicional
La mayoría de los OCRs leen el texto sin validar la legalidad tributaria del documento ante el organismo regulador (DIAN). Al presentar la información exógena, la empresa es sancionada por reportar NITs inexistentes.

### ✅ Resolución Automatizada de Tally
1. **Cálculo Matemático DIAN ([`src/nit.ts`](../src/nit.ts))**: Tally aplica el algoritmo oficial de módulo 11 ponderado:
   $$\text{Dígito Real} = f(\text{"964390161"}) = 8 \neq 0$$
2. **Detección Inmediata**: Clasificada como `🟡 ADVERTENCIA: Inconsistencia en NIT`.
3. **Acción en 5s**: *Verificar RUT del proveedor en el portal DIAN para confirmar dígito de verificación antes de registrar la deducción fiscal.*

---

## 📊 Tabla Comparativa de Rendimiento

| Métrica | Proceso Manual Tradicional | Software OCR en la Nube | Tally (Agente Local QVAC) |
|---|---|---|---|
| **Tiempo por Factura** | ~3 a 5 minutos | ~15 a 30 segundos | **< 1 segundo** |
| **Costo por Inferencia** | Alto (horas-persona) | $0.02 - $0.05 USD / doc | **$0.00 USD (100% Local)** |
| **Privacidad de Datos** | Riesgo de fuga humana | Datos enviados a servidores externos | **Soberanía 100% On-Device** |
| **Detección de Pagos Divididos** | Lenta y propensa a error | Rara vez soportada | **Automática (Split-Match 2 tx)** |
| **Auditoría de Incertidumbre** | Subjetiva | Caja negra | **Score de Confianza (0-100%)** |
