/**
 * PWA Model Prefetcher
 * Downloads and warms up offline-capable local LLM models via Web Worker.
 * Models are only auto-downloaded when app is installed as a PWA.
 */

export interface ModelPackage {
  name: string;
  version: string;
  description: string;
  size: number; // in MB
  modelId: string;
  optional: boolean;
  minRamGb: number;
}

interface StoredModelMetadata extends ModelPackage {
  downloadedAt: string;
  source: "pwa-prefetch" | "chat-runtime";
  actualModelId?: string;
  actualModelLabel?: string;
}

interface DownloadProgress {
  modelName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
}

const MODEL_METADATA_KEY = "sopna-model-metadata-v2";
const MODEL_AUTO_INSTALL_KEY = "sopna-models-auto-installed-v2";
const PREFETCH_TIMEOUT_MS = 12 * 60 * 1000;

const AVAILABLE_MODELS: ModelPackage[] = [
  {
    name: "mobile-pro-qa",
    version: "2.0.0",
    description:
      "Large reliable offline Q&A model for ~3GB mobile RAM (recommended).",
    size: 620,
    modelId: "Xenova/LaMini-Flan-T5-248M",
    optional: false,
    minRamGb: 3,
  },
  {
    name: "mobile-balanced",
    version: "2.0.0",
    description: "Balanced multilingual fallback for slower devices.",
    size: 300,
    modelId: "Xenova/flan-t5-small",
    optional: true,
    minRamGb: 2,
  },
  {
    name: "mobile-lite",
    version: "2.0.0",
    description: "Ultra-light emergency fallback for very weak devices.",
    size: 130,
    modelId: "Xenova/LaMini-Flan-T5-77M",
    optional: true,
    minRamGb: 1,
  },
];

const isStandalonePWA = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

const toSafeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readProgressPercent = (progress: any) => {
  const loaded = toSafeNumber(progress?.loaded, 0);
  const total = toSafeNumber(progress?.total, 0);
  if (total > 0) {
    return Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
  }

  const reported = toSafeNumber(
    progress?.progress ?? progress?.percentage ?? 0,
    0,
  );
  const normalized = reported <= 1 ? reported * 100 : reported;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

/**
 * PWA Model Prefetcher Class
 */
export class PWAModelPrefetcher {
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private listeners: Set<(progress: DownloadProgress) => void> = new Set();

  /**
   * Auto-install essential models once app is installed as a PWA.
   */
  async autoInstallForInstalledPWA(force = false): Promise<void> {
    if (!isStandalonePWA()) {
      return;
    }

    if (!force && localStorage.getItem(MODEL_AUTO_INSTALL_KEY) === "1") {
      return;
    }

    try {
      const status = await this.getInstallationStatus();
      if (!status.isInstalled) {
        await this.downloadEssentialModels();
        this.downloadOptionalModels();
      }
      localStorage.setItem(MODEL_AUTO_INSTALL_KEY, "1");
    } catch (error) {
      console.error("[Model Prefetcher] Auto-install failed:", error);
    }
  }

  /**
   * Register progress listener
   */
  onProgressUpdate(callback: (progress: DownloadProgress) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyProgress(progress: DownloadProgress): void {
    this.listeners.forEach((listener) => listener(progress));
  }

  /**
   * Download and cache a model by warming the worker once.
   */
  async downloadModel(modelName: string): Promise<boolean> {
    const model = AVAILABLE_MODELS.find((m) => m.name === modelName);
    if (!model) {
      console.error(`[Model Prefetcher] Model not found: ${modelName}`);
      return false;
    }

    const progress: DownloadProgress = {
      modelName,
      loaded: 0,
      total: model.size,
      percentage: 0,
      status: "downloading",
    };

    this.downloadQueue.set(modelName, progress);
    this.notifyProgress(progress);

    const metadata = this.getModelMetadata();
    const existing = metadata.find((m) => m.name === modelName);
    if (existing) {
      progress.status = "completed";
      progress.loaded = model.size;
      progress.percentage = 100;
      this.notifyProgress(progress);
      return true;
    }

    try {
      const warmupResult = await this.prefetchWithWorker(model, (update) => {
        const nextLoaded = Math.max(progress.loaded, update.loaded);
        progress.loaded = nextLoaded;
        progress.total = model.size;
        progress.percentage = Math.max(progress.percentage, update.percentage);
        progress.status = "downloading";
        this.notifyProgress(progress);
      });

      if (!warmupResult.success) {
        progress.status = "failed";
        progress.error = warmupResult.error || "Worker prefetch failed";
        this.notifyProgress(progress);
        return false;
      }

      await this.saveModelMetadata({
        ...model,
        downloadedAt: new Date().toISOString(),
        source: "pwa-prefetch",
        actualModelId: warmupResult.actualModelId,
        actualModelLabel: warmupResult.actualModelLabel,
      });

      progress.status = "completed";
      progress.loaded = model.size;
      progress.percentage = 100;
      this.notifyProgress(progress);
      return true;
    } catch (error) {
      progress.status = "failed";
      progress.error = String(error);
      this.notifyProgress(progress);
      console.error(`[Model Prefetcher] Download error for ${modelName}:`, error);
      return false;
    }
  }

  private async prefetchWithWorker(
    model: ModelPackage,
    onProgress: (update: { loaded: number; percentage: number }) => void,
  ): Promise<{
    success: boolean;
    actualModelId?: string;
    actualModelLabel?: string;
    error?: string;
  }> {
    if (typeof Worker === "undefined") {
      return {
        success: false,
        error: "Web Worker is not supported in this browser",
      };
    }

    const worker = new Worker(
      new URL("../workers/offlineAIWorker.ts", import.meta.url),
      { type: "module" },
    );

    return new Promise((resolve) => {
      let settled = false;

      const finish = (result: {
        success: boolean;
        actualModelId?: string;
        actualModelLabel?: string;
        error?: string;
      }) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutHandle);
        worker.terminate();
        resolve(result);
      };

      const timeoutHandle = window.setTimeout(() => {
        finish({
          success: false,
          error: "Model warm-up timeout. Try Wi-Fi and keep app open.",
        });
      }, PREFETCH_TIMEOUT_MS);

      worker.onmessage = (event: MessageEvent) => {
        const msg = event.data || {};

        if (msg.type === "loading-progress") {
          const percentage = readProgressPercent(msg.progress);
          const approxLoaded = Math.max(
            1,
            Math.round((percentage / 100) * model.size),
          );
          onProgress({ loaded: approxLoaded, percentage });
          return;
        }

        if (msg.type === "ready") {
          finish({
            success: true,
            actualModelId: String(msg.modelId || ""),
            actualModelLabel: String(msg.modelLabel || ""),
          });
          return;
        }

        if (msg.type === "error") {
          finish({
            success: false,
            error: String(msg.message || "Model warm-up failed"),
          });
        }
      };

      worker.onerror = (event) => {
        finish({
          success: false,
          error: event.message || "Worker runtime error",
        });
      };

      worker.postMessage({
        type: "load",
        payload: {
          prefetchOnly: true,
          preferredModelId: model.modelId,
          deviceMemoryGb: toSafeNumber((navigator as any).deviceMemory, 3),
        },
      });
    });
  }

  /**
   * Download all essential models
   */
  async downloadEssentialModels(): Promise<{
    successful: string[];
    failed: string[];
  }> {
    const essential = AVAILABLE_MODELS.filter((m) => !m.optional);
    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    for (const model of essential) {
      const success = await this.downloadModel(model.name);
      if (success) {
        results.successful.push(model.name);
      } else {
        results.failed.push(model.name);
      }
    }

    return results;
  }

  /**
   * Download optional models in background.
   */
  async downloadOptionalModels(): Promise<void> {
    const optional = AVAILABLE_MODELS.filter((m) => m.optional);

    Promise.all(
      optional.map((model) =>
        this.downloadModel(model.name).catch((err) => {
          console.error(
            `[Model Prefetcher] Optional model failed: ${model.name}`,
            err,
          );
        }),
      ),
    ).finally(() => {
      console.log("[Model Prefetcher] Optional prefetch complete");
    });
  }

  getAvailableModels(): ModelPackage[] {
    return AVAILABLE_MODELS;
  }

  getModel(name: string): ModelPackage | undefined {
    return AVAILABLE_MODELS.find((m) => m.name === name);
  }

  private getModelMetadata(): StoredModelMetadata[] {
    try {
      const data = localStorage.getItem(MODEL_METADATA_KEY);
      return data ? (JSON.parse(data) as StoredModelMetadata[]) : [];
    } catch (error) {
      console.error("[Model Prefetcher] Metadata read error:", error);
      return [];
    }
  }

  private async saveModelMetadata(metadata: StoredModelMetadata): Promise<void> {
    try {
      const existing = this.getModelMetadata();
      const index = existing.findIndex((item) => item.name === metadata.name);
      if (index >= 0) {
        existing[index] = metadata;
      } else {
        existing.push(metadata);
      }
      localStorage.setItem(MODEL_METADATA_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error("[Model Prefetcher] Metadata save error:", error);
    }
  }

  async getDownloadedModels(): Promise<ModelPackage[]> {
    return this.getModelMetadata().map((m) => ({
      name: m.name,
      version: m.version,
      description: m.description,
      size: m.size,
      modelId: m.modelId,
      optional: m.optional,
      minRamGb: m.minRamGb,
    }));
  }

  async getCacheSize(): Promise<number> {
    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        return Number(estimate.usage || 0);
      }
      return 0;
    } catch (error) {
      console.error("[Model Prefetcher] Failed to read storage estimate:", error);
      return 0;
    }
  }

  async clearCache(): Promise<boolean> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) =>
            ["transformers", "sopna", "workbox", "onnx", "model"].some(
              (token) => name.toLowerCase().includes(token),
            ),
          )
          .map((name) => caches.delete(name)),
      );

      // Best-effort IndexedDB cleanup commonly used by local model runtimes.
      ["transformers-cache", "transformers-js", "onnxruntime-web"].forEach(
        (dbName) => {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch {
            // Ignore delete failures.
          }
        },
      );

      localStorage.removeItem(MODEL_METADATA_KEY);
      localStorage.removeItem(MODEL_AUTO_INSTALL_KEY);
      return true;
    } catch (error) {
      console.error("[Model Prefetcher] Error clearing cache:", error);
      return false;
    }
  }

  async getInstallationStatus(): Promise<{
    isInstalled: boolean;
    installedModels: string[];
    missingModels: string[];
    cacheSize: number;
    totalSize: number;
    requiresPwaInstall: boolean;
  }> {
    const metadata = this.getModelMetadata();
    const installedModels = metadata.map((m) => m.name);
    const essentialModelNames = AVAILABLE_MODELS.filter((m) => !m.optional).map(
      (m) => m.name,
    );

    const missingModels = essentialModelNames.filter(
      (name) => !installedModels.includes(name),
    );

    const cacheSize = await this.getCacheSize();
    const totalSize = AVAILABLE_MODELS.reduce((sum, model) => sum + model.size, 0);

    return {
      isInstalled: missingModels.length === 0,
      installedModels,
      missingModels,
      cacheSize: Math.round(cacheSize / (1024 * 1024)),
      totalSize,
      requiresPwaInstall: !isStandalonePWA(),
    };
  }
}

export const modelPrefetcher = new PWAModelPrefetcher();

export const downloadModel = (name: string) => modelPrefetcher.downloadModel(name);
export const downloadEssentialModels = () =>
  modelPrefetcher.downloadEssentialModels();
export const downloadOptionalModels = () => modelPrefetcher.downloadOptionalModels();
export const getAvailableModels = () => modelPrefetcher.getAvailableModels();
export const getInstallationStatus = () => modelPrefetcher.getInstallationStatus();
export const autoInstallForInstalledPWA = (force = false) =>
  modelPrefetcher.autoInstallForInstalledPWA(force);
export const isPwaInstalled = () => isStandalonePWA();
