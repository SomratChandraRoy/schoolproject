/**
 * PWA Model Prefetcher
 * Handles downloading and caching AI models during PWA installation
 * Automatically downloads models in background and stores in Cache API
 */

export interface ModelPackage {
  name: string;
  version: string;
  description: string;
  size: number; // in MB
  url: string;
  checksum: string; // for integrity verification
  optional: boolean;
}

const MODEL_CACHE_NAME = "medhabangla-ai-models-v1";
const MODEL_METADATA_KEY = "medhabangla-model-metadata";

// Available model packages
const AVAILABLE_MODELS: ModelPackage[] = [
  {
    name: "knowledge-base",
    version: "1.0.0",
    description: "Core knowledge base with Q&A pairs",
    size: 2, // 2 MB
    url: "/models/knowledge-base-v1.json",
    checksum: "sha256-abc123",
    optional: false,
  },
  {
    name: "study-tips",
    version: "1.0.0",
    description: "Study techniques and learning strategies",
    size: 1,
    url: "/models/study-tips-v1.json",
    checksum: "sha256-def456",
    optional: true,
  },
  {
    name: "subject-guide-math",
    version: "1.0.0",
    description: "Mathematics guide and solutions",
    size: 3,
    url: "/models/subject-guide-math-v1.json",
    checksum: "sha256-ghi789",
    optional: true,
  },
  {
    name: "subject-guide-science",
    version: "1.0.0",
    description: "Science guide (physics, chemistry, biology)",
    size: 4,
    url: "/models/subject-guide-science-v1.json",
    checksum: "sha256-jkl012",
    optional: true,
  },
];

interface DownloadProgress {
  modelName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
}

/**
 * PWA Model Prefetcher Class
 */
export class PWAModelPrefetcher {
  private cache: Cache | null = null;
  private downloadQueue: Map<string, DownloadProgress> = new Map();
  private listeners: Set<(progress: DownloadProgress) => void> = new Set();

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize cache
   */
  private async initializeCache(): Promise<void> {
    try {
      this.cache = await caches.open(MODEL_CACHE_NAME);
    } catch (error) {
      console.error("[Model Prefetcher] Cache initialization error:", error);
    }
  }

  /**
   * Check if cache is available
   */
  private async ensureCache(): Promise<Cache> {
    if (!this.cache) {
      await this.initializeCache();
    }
    return this.cache!;
  }

  /**
   * Register progress listener
   */
  onProgressUpdate(callback: (progress: DownloadProgress) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of progress
   */
  private notifyProgress(progress: DownloadProgress): void {
    this.listeners.forEach((listener) => listener(progress));
  }

  /**
   * Download and cache a model
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

    try {
      const cache = await this.ensureCache();
      const url = model.url;

      // Check if already cached
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        console.log(`[Model Prefetcher] Model already cached: ${modelName}`);
        progress.status = "completed";
        progress.percentage = 100;
        this.notifyProgress(progress);
        return true;
      }

      // Fetch the model
      console.log(`[Model Prefetcher] Downloading: ${modelName}`);
      const response = await this.fetchWithProgress(url, (loaded) => {
        progress.loaded = loaded;
        progress.percentage = Math.round((loaded / model.size) * 100);
        this.notifyProgress(progress);
      });

      // Cache the response
      const clonedResponse = response.clone();
      await cache.put(url, clonedResponse);

      // Update metadata
      await this.saveModelMetadata(model);

      progress.status = "completed";
      progress.percentage = 100;
      this.notifyProgress(progress);

      console.log(`[Model Prefetcher] ✅ Downloaded: ${modelName}`);
      return true;
    } catch (error) {
      console.error(
        `[Model Prefetcher] Download error for ${modelName}:`,
        error,
      );
      progress.status = "failed";
      progress.error = String(error);
      this.notifyProgress(progress);
      return false;
    }
  }

  /**
   * Fetch with progress tracking
   */
  private async fetchWithProgress(
    url: string,
    onProgress: (loaded: number) => void,
  ): Promise<Response> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }

    const contentLength = response.headers.get("content-length");
    if (!contentLength) {
      onProgress(0);
      return response;
    }

    const total = parseInt(contentLength, 10);
    let loaded = 0;

    const reader = response.body?.getReader();
    if (!reader) {
      return response;
    }

    const chunks: Uint8Array[] = [];

    const readChunk = async (): Promise<void> => {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      chunks.push(value);
      loaded += value.length;
      onProgress(loaded);

      await readChunk();
    };

    await readChunk();

    const body = new Blob(chunks);
    return new Response(body, response);
  }

  /**
   * Download all essential models
   */
  async downloadEssentialModels(): Promise<{
    successful: string[];
    failed: string[];
  }> {
    console.log("[Model Prefetcher] Starting essential model downloads...");

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

    console.log("[Model Prefetcher] Download summary:", results);
    return results;
  }

  /**
   * Download all optional models (in background)
   */
  async downloadOptionalModels(): Promise<void> {
    console.log("[Model Prefetcher] Starting optional model downloads...");

    const optional = AVAILABLE_MODELS.filter((m) => m.optional);

    // Download in background without blocking
    Promise.all(
      optional.map((model) =>
        this.downloadModel(model.name).catch((err) =>
          console.error(
            `[Model Prefetcher] Failed to download optional ${model.name}:`,
            err,
          ),
        ),
      ),
    ).finally(() => {
      console.log("[Model Prefetcher] Optional model downloads complete");
    });
  }

  /**
   * Get list of available models
   */
  getAvailableModels(): ModelPackage[] {
    return AVAILABLE_MODELS;
  }

  /**
   * Get model by name
   */
  getModel(name: string): ModelPackage | undefined {
    return AVAILABLE_MODELS.find((m) => m.name === name);
  }

  /**
   * Save model metadata to localStorage
   */
  private async saveModelMetadata(model: ModelPackage): Promise<void> {
    try {
      const metadata = this.getModelMetadata();
      const existing = metadata.find((m) => m.name === model.name);

      if (existing) {
        existing.downloadedAt = new Date().toISOString();
      } else {
        metadata.push({
          ...model,
          downloadedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem(MODEL_METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error("[Model Prefetcher] Error saving metadata:", error);
    }
  }

  /**
   * Get model metadata from localStorage
   */
  private getModelMetadata(): (ModelPackage & { downloadedAt: string })[] {
    try {
      const data = localStorage.getItem(MODEL_METADATA_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("[Model Prefetcher] Error loading metadata:", error);
      return [];
    }
  }

  /**
   * Get downloaded models
   */
  async getDownloadedModels(): Promise<ModelPackage[]> {
    const metadata = this.getModelMetadata();
    return metadata.map((m) => ({
      name: m.name,
      version: m.version,
      description: m.description,
      size: m.size,
      url: m.url,
      checksum: m.checksum,
      optional: m.optional,
    }));
  }

  /**
   * Get total cache size
   */
  async getCacheSize(): Promise<number> {
    try {
      const cache = await this.ensureCache();
      const keys = await cache.keys();
      let totalSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response && response.headers.has("content-length")) {
          totalSize += parseInt(
            response.headers.get("content-length") || "0",
            10,
          );
        }
      }

      return totalSize;
    } catch (error) {
      console.error("[Model Prefetcher] Error calculating cache size:", error);
      return 0;
    }
  }

  /**
   * Clear all cached models
   */
  async clearCache(): Promise<boolean> {
    try {
      const result = await caches.delete(MODEL_CACHE_NAME);
      localStorage.removeItem(MODEL_METADATA_KEY);
      this.cache = null;
      console.log("[Model Prefetcher] ✅ Cache cleared");
      return result;
    } catch (error) {
      console.error("[Model Prefetcher] Error clearing cache:", error);
      return false;
    }
  }

  /**
   * Get installation status
   */
  async getInstallationStatus(): Promise<{
    isInstalled: boolean;
    installedModels: string[];
    missingModels: string[];
    cacheSize: number;
    totalSize: number;
  }> {
    const downloaded = await this.getDownloadedModels();
    const downloadedNames = downloaded.map((m) => m.name);
    const essential = AVAILABLE_MODELS.filter((m) => !m.optional).map(
      (m) => m.name,
    );
    const missing = essential.filter((m) => !downloadedNames.includes(m));

    const cacheSize = await this.getCacheSize();
    const totalSize = AVAILABLE_MODELS.reduce((sum, m) => sum + m.size, 0);

    return {
      isInstalled: missing.length === 0,
      installedModels: downloadedNames,
      missingModels: missing,
      cacheSize: Math.round(cacheSize / (1024 * 1024)),
      totalSize,
    };
  }
}

// Export singleton instance
export const modelPrefetcher = new PWAModelPrefetcher();

// Export convenience functions
export const downloadModel = (name: string) =>
  modelPrefetcher.downloadModel(name);
export const downloadEssentialModels = () =>
  modelPrefetcher.downloadEssentialModels();
export const downloadOptionalModels = () =>
  modelPrefetcher.downloadOptionalModels();
export const getAvailableModels = () => modelPrefetcher.getAvailableModels();
export const getInstallationStatus = () =>
  modelPrefetcher.getInstallationStatus();
