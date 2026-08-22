# 🎬 Guión de Video Demo (2 Minutos) — Tally

> **Hackathon**: Aleph Hackathon 2026 (Tether / QVAC Track)  
> **Duración**: 2 minutos (máximo 3 minutos)  
> **Objetivo**: Demostrar impacto en Track 1 ($1,000 USDt), Track 2 ($500 USDt) y The Vault Guardian ($500 USDt).

---

## ⏱️ Estructura Segundo a Segundo

### `0:00 - 0:25` — El Problema y la Tesis On-Device (Tether / QVAC)
* **Qué mostrar en pantalla**: Portada limpia de Tally o la carpeta de facturas desordenadas (`imprimibles_para_pruebas` / fotos de celular).
* **Qué decir (Voz en off)**:
  > *"En finanzas y operaciones contables, el cierre de mes es una pesadilla: cientos de facturas en PDF, fotos de recibos tomadas con celular y extractos bancarios que los contadores tardan horas en cruzar.*  
  > *Las empresas **no pueden enviar estos datos a APIs en la nube como OpenAI por secreto bancario y normativas fiscales**.*  
  > *Por eso construimos **Tally**: un agente local para operaciones que concilia facturas y extractos bancarios **100% on-device mediante QVAC y SmolVLM2**, usando solo 500 MB de RAM y cero nube."*

---

### `0:25 - 1:00` — Demostración en Vivo y Dashboard Interactivo
* **Qué mostrar en pantalla**: Abre la terminal, corre `npm run client:demo` y luego abre el navegador en `http://localhost:3000`.
* **Qué decir (Voz en off)**:
  > *"Aquí vemos a Tally procesando un lote real de compras. Al correr el pipeline, el modelo de visión **SmolVLM2-500M** extrae los campos clave de imágenes degradadas y fotos con ruido.*  
  > *En nuestro **Dashboard Web interactivo**, el analista ve de inmediato los KPIs: facturas conciliadas, total del IVA, y un **Sello Criptográfico SHA-256** que certifica matemáticamente que los datos nunca salieron de la laptop."*

---

### `1:00 - 1:40` — Casos Difíciles y Resiliencia (Track 2: Small Models, Hard Tasks)
* **Qué mostrar en pantalla**: Mostrar [`out/discrepancias.md`](../out/discrepancias.md) y la tabla del Dashboard.
* **Qué decir (Voz en off)**:
  > *"Los modelos de 500M suelen fallar en aritmética o reglas tributarias. La arquitectura híbrida de Tally resuelve esto con 3 innovaciones:*  
  > *1. **Split-Payment**: Si una factura de \$3.2M se pagó en 2 transferencias bancarias distintas, el algoritmo las detecta y las concilia automáticamente.*  
  > *2. **Motor Multi-Jurisdicción**: Valida algoritmos de Módulo 11 para la DIAN en Colombia, ARCA/AFIP en Argentina y SAT en México.*  
  > *3. **Self-Healing Engine**: Si una foto con sombra impide leer el subtotal, el agente lo deduce algebraicamente a partir del total y la tasa de IVA con una advertencia transparente."*

---

### `1:40 - 2:00` — Auditoría en 5s y Cierre
* **Qué mostrar en pantalla**: Mostrar la terminal corriendo `npm run audit` resolviendo una factura con la tecla `A`, y la suite `npm run vault:crack`.
* **Qué decir (Voz en off)**:
  > *"Para las discrepancias, el auditor humano las resuelve en 5 segundos con una tecla mediante nuestro CLI interactivo.*  
  > *Además, incluimos la suite automatizada para **The Vault Guardian** con 5 vectores de prompt injection.*  
  > *Tally es privado, determinístico, multi-país y listo para transformar las operaciones financieras locales. ¡Muchas gracias!"*
