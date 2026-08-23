import path from "node:path";

let activeModelId: string | null = null;
let qvacSdkModule: typeof import("@qvac/sdk") | null = null;

async function getSdk() {
  if (!qvacSdkModule) {
    try {
      qvacSdkModule = await import("@qvac/sdk");
    } catch (err) {
      throw new Error(`No se pudo cargar @qvac/sdk: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return qvacSdkModule;
}

/**
 * Obtiene o inicializa el modelo multimodal SmolVLM2 500M Q8_0 en QVAC.
 */
export async function getOrLoadQvacModel(): Promise<string> {
  if (activeModelId) {
    return activeModelId;
  }

  const sdk = await getSdk();
  const { loadModel, SMOLVLM2_500M_MULTIMODAL_Q8_0, MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 } = sdk;

  try {
    const loaded = await loadModel({
      modelSrc: SMOLVLM2_500M_MULTIMODAL_Q8_0,
      modelConfig: {
        projectionModelSrc: MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
        // El default del SDK (LLM_CONFIG_DEFAULTS.ctx_size) es 1024. Confirmado en vivo:
        // una imagen + el prompt de extraccion revienta eso con CONTEXT_OVERFLOW, y por debajo
        // del limite el modelo devuelve salida sin relacion con la imagen (probablemente
        // porque los tokens de vision quedan truncados). 4096 da margen para imagen + prompt.
        ctx_size: 4096,
      },
    });

    const modelId = typeof loaded === "string" ? loaded : (loaded as any)?.id ?? "smolvlm2-500m";
    activeModelId = modelId;
    return modelId;
  } catch (err) {
    throw new Error(`Error al inicializar modelo multimodal en QVAC: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Ejecuta una inferencia multimodal con una imagen local y un prompt de texto.
 * `responseFormat` permite forzar la gramatica de salida (p.ej. json_schema) via el SDK.
 */
export async function runQvacMultimodal(
  imagePath: string,
  prompt: string,
  options?: { responseFormat?: Record<string, unknown> }
): Promise<string> {
  const sdk = await getSdk();
  const { completion } = sdk;
  const modelId = await getOrLoadQvacModel();

  const absoluteImagePath = path.resolve(imagePath);

  const history = [
    {
      role: "user",
      content: prompt,
      attachments: [{ path: absoluteImagePath }],
    },
  ];

  const run = completion({
    modelId,
    history,
    stream: false,
    ...(options?.responseFormat ? { responseFormat: options.responseFormat as any } : {}),
  });

  const final = await run.final;
  return final.contentText || final.raw?.fullText || (await run.text) || "";
}

/**
 * Descarga y libera los recursos del modelo en memoria.
 */
export async function unloadQvacModel(): Promise<void> {
  if (!activeModelId) return;

  try {
    const sdk = await getSdk();
    if (typeof sdk.unloadModel === "function") {
      await sdk.unloadModel({ modelId: activeModelId });
    }
  } catch (err) {
    console.warn(`[WARN] Error al descargar modelo QVAC: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    activeModelId = null;
  }
}
