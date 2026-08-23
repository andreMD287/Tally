# Tally : Agente Local Autónomo para Operaciones Financieras

> **Aleph Hackathon 2026 : Tether QVAC Track**  
> **Track Principal**: Track 1 : Agentes locales para trabajo de operaciones ($1,000 USDt)  
> **Track Secundario**: Track 2 : Modelos pequeños, tareas difíciles y confiabilidad ($500 USDt)  
> **Reto Adicional**: The Vault Guardian ($500 USDt pool)  
> *Para la versión en inglés, consulte [README.md](README.md).*

---

## 1. El Problema Operativo

Las pequeñas y medianas empresas (PyMEs) pierden entre 3 y 5 horas al mes cuadrando facturas recibidas de proveedores contra extractos bancarios. Este proceso manual sufre de tres cuellos de botella:

1. **Privacidad y Cumplimiento**: Las facturas contienen NITs, nombres de clientes y flujos de caja. Subir estos documentos a APIs comerciales en la nube viola normativas de protección de datos (Habeas Data / GDPR).
2. **Entradas Degradadas**: Las facturas reales llegan como fotos inclinadas de smartphones, escaneos con sombras o arrugas, y formatos heterogéneos donde el OCR tradicional falla.
3. **Casos Borde Financieros**: Pagos divididos en múltiples transacciones, facturas duplicadas enviadas dos veces por error, e inconsistencias en dígitos de verificación tributarios.

---

## 2. Nuestra Solución: Tally

**Tally** es un agente autónomo de operaciones que se ejecuta **100% en el dispositivo** mediante el SDK de Tether QVAC (`@qvac/sdk`).

```mermaid
flowchart TD
    A[Facturas Fisicas y Fotos] --> B[Sharp Ingestion: Auto-rotacion EXIF]
    B --> C[@qvac/sdk Local: SmolVLM2-500M Q8_0]
    C --> D[Sanitizado JSON y Validacion Zod]
    D --> E[Motor Tributario: Modulo 11 DIAN / AFIP / SAT]
    E --> F[Auto-Correccion Algebraica]
    
    G[Extracto Bancario CSV] --> H[Ingesta de Extracto Bancario]
    H --> I[Motor de Conciliacion Inteligente]
    F --> I
    
    I --> J1[Libro de Compras CSV]
    I --> J2[Reporte de Discrepancias en 5s MD]
    I --> J3[Sello Criptografico SHA-256 JSON]
    I --> J4[Dashboard Web Local Puerto 3000]
```

---

## 3. Matriz de Tecnologías y Capacidades

| Componente | Tecnología / Modelo | Función |
| :--- | :--- | :--- |
| **Inferencia Local** | `@qvac/sdk` (^0.17.1) | Carga y ejecución del modelo multimodal sin conexión |
| **Modelo de Visión** | `SmolVLM2-500M-Instruct (Q8_0)` | Extracción estructurada de entidades en ~500 MB de RAM |
| **Validación de Esquema** | `zod` (^3.23.8) | Garantía estricta de tipos e integridad de campos |
| **Preprocesamiento** | `sharp` (^0.33.5) | Auto-rotación EXIF y normalización visual a 1600px |
| **Reglas Tributarias** | TypeScript puro | Algoritmos oficiales Módulo 11 (DIAN, AFIP, SAT) |
| **Sello de Privacidad** | `node:crypto` (SHA-256) | Certificado inmutable que certifica 0 bytes de fuga |
| **Dashboard** | `node:http` + Tailwind CSS | Interfaz web local ligera con inicio en <50ms |

---

## 4. Permalinks de Integración de QVAC

- **Ciclo de Vida de Inferencia QVAC**: [`src/qvac/client.ts#L30-L75`](src/qvac/client.ts)
- **Extracción Multimodal y Sanitizado JSON**: [`src/extract/qvac.ts#L45-L120`](src/extract/qvac.ts)
- **Motor de Auto-Corrección Algebraica**: [`src/validate/heal.ts#L14-L57`](src/validate/heal.ts)
- **Validación Tributaria Multi-País**: [`src/validate/jurisdictions/`](src/validate/jurisdictions/)
- **Cuantificación de Incertidumbre y Confianza**: [`src/validate/confidence.ts#L20-L60`](src/validate/confidence.ts)
- **Conciliación de Pagos Divididos (Split-Match)**: [`src/match/index.ts#L19-L107`](src/match/index.ts)
- **Certificado Criptográfico SHA-256**: [`src/report/crypto-certificate.ts#L36-L86`](src/report/crypto-certificate.ts)
- **Herramienta de Auditoría Humana en 5s**: [`src/report/audit.ts#L1-L160`](src/report/audit.ts)
- **Suite de Vectores Vault Guardian**: [`tools/vault-guardian/cracker.ts#L1-L80`](tools/vault-guardian/cracker.ts)

---

## 5. Guía de Inicio Rápido (Quickstart)

### Requisitos Previos
- Node.js 18+ (o Bare runtime).

### Instalación
```bash
git clone https://github.com/andreMD287/Tally.git
cd Tally
npm install
```

### Ejecución de Pruebas Automatizadas
```bash
npm test
npm run typecheck
```

### Ejecución del Pipeline Completo
```bash
# Modo determinístico (ground-truth rápido para evaluación)
npm run demo

# Simulación de escenario de cliente PyME
npm run client:demo

# Modo inferencia QVAC local (requiere pesos GGUF descargados)
npm run cli -- ./data/facturas ./data/extracto.csv --qvac
```

### Iniciar Dashboard Web Local
```bash
npm run ui
# Abrir http://localhost:3000 en el navegador
```

### Auditoría Humana en 5 Segundos (CLI)
```bash
npm run audit
```

### Suite de Ataque Vault Guardian
```bash
npm run vault:crack
```

---

## 6. Licencia

Este proyecto está licenciado bajo la Licencia MIT. Consulte el archivo [LICENSE](LICENSE) para más detalles.
