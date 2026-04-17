// @ts-nocheck
import { env, pipeline } from "@xenova/transformers";

env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useBrowserCache = true;

type ModelCandidate = {
  id: string;
  label: string;
  approxSizeMb: number;
  minRamGb: number;
};

const MODEL_CANDIDATES: ModelCandidate[] = [
  {
    id: "Xenova/LaMini-Flan-T5-248M",
    label: "LaMini Flan-T5 248M (3GB Mobile Optimized)",
    approxSizeMb: 620,
    minRamGb: 3,
  },
  {
    id: "Xenova/flan-t5-small",
    label: "Flan-T5 Small (Balanced Fallback)",
    approxSizeMb: 300,
    minRamGb: 2,
  },
  {
    id: "Xenova/mt5-small",
    label: "mT5 Small (Multilingual Fallback)",
    approxSizeMb: 420,
    minRamGb: 2,
  },
  {
    id: "Xenova/LaMini-Flan-T5-77M",
    label: "LaMini Flan-T5 77M (Emergency Lite)",
    approxSizeMb: 130,
    minRamGb: 1,
  },
];

let generator = null;
let loadingPromise = null;
let activeModel: ModelCandidate | null = null;

function formatLoadError(error) {
  const raw = error?.message || String(error || "Unknown load error");
  if (raw.includes("Unexpected token '<'")) {
    return "মডেল ফাইলের জায়গায় HTML এসেছে। ক্যাশ/সার্ভিস ওয়ার্কার ক্লিয়ার করে আবার চেষ্টা করুন।";
  }
  return raw;
}

function extractGeneratedText(output) {
  if (Array.isArray(output) && output[0]?.generated_text) {
    return String(output[0].generated_text);
  }
  return String(output?.generated_text || "");
}

function hasBangla(text) {
  return /[\u0980-\u09FF]/.test(String(text || ""));
}

function cleanupResponseText(text) {
  if (!text) return "";

  return String(text)
    .replace(/^\s*(answer|উত্তর)\s*[:：-]?\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function uniqueCandidatesById(candidates: ModelCandidate[]) {
  const seen = new Set<string>();
  const ordered: ModelCandidate[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    ordered.push(candidate);
  }
  return ordered;
}

function resolveModelOrder(payload) {
  const preferredModelId = String(payload?.preferredModelId || "").trim();
  const deviceMemoryGb = Number(payload?.deviceMemoryGb || 3);

  const viableByRam = MODEL_CANDIDATES.filter(
    (candidate) => candidate.minRamGb <= Math.max(1, deviceMemoryGb),
  );

  const baseOrder = viableByRam.length > 0 ? viableByRam : MODEL_CANDIDATES;

  const prioritized = [...baseOrder];
  const preferred = MODEL_CANDIDATES.find(
    (candidate) => candidate.id === preferredModelId,
  );
  if (preferred) {
    prioritized.unshift(preferred);
  }

  if (deviceMemoryGb <= 3.2) {
    prioritized.sort((a, b) => a.approxSizeMb - b.approxSizeMb);
    const mobilePriority = MODEL_CANDIDATES.find(
      (candidate) => candidate.id === "Xenova/LaMini-Flan-T5-248M",
    );
    if (mobilePriority) prioritized.unshift(mobilePriority);
  }

  return uniqueCandidatesById(prioritized);
}

async function forceBanglaResponse(answer, question) {
  const cleanedAnswer = cleanupResponseText(answer);
  if (!cleanedAnswer) {
    return "দুঃখিত, এই প্রশ্নের জন্য এখনই উত্তর তৈরি করা যায়নি।";
  }

  if (hasBangla(cleanedAnswer)) {
    return cleanedAnswer;
  }

  const banglaRetryPrompt = `শুধু প্রাকৃতিক বাংলা ভাষায় উত্তর দাও।\nপ্রশ্ন: ${question}\nউত্তর:`;
  const retryOutput = await generator(banglaRetryPrompt, {
    max_new_tokens: 220,
    temperature: 0.2,
    do_sample: false,
  });
  const retryText = cleanupResponseText(extractGeneratedText(retryOutput));

  if (retryText && hasBangla(retryText)) {
    return retryText;
  }

  const translatePrompt = `নিচের লেখাটি সহজ বাংলায় অনুবাদ করো। শুধুমাত্র অনুবাদ দাও:\n${cleanedAnswer}`;
  const translatedOutput = await generator(translatePrompt, {
    max_new_tokens: 260,
    temperature: 0.2,
    do_sample: false,
  });
  const translatedText = cleanupResponseText(
    extractGeneratedText(translatedOutput),
  );

  if (translatedText && hasBangla(translatedText)) {
    return translatedText;
  }

  return "দুঃখিত, মডেলটি এই উত্তরের বাংলা রূপ দিতে পারেনি। অনুগ্রহ করে প্রশ্নটি একটু ছোট করে আবার করুন।";
}

async function tryLoadCandidate(candidate, mode) {
  if (mode === "remote") {
    env.allowLocalModels = true;
    env.allowRemoteModels = true;
  } else {
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
  }

  const loadedPipeline = await pipeline("text2text-generation", candidate.id, {
    progress_callback: (progress) => {
      self.postMessage({
        type: "loading-progress",
        progress,
        mode,
        modelId: candidate.id,
        modelLabel: candidate.label,
      });
    },
  });

  return loadedPipeline;
}

async function loadModel(payload = {}) {
  if (generator) {
    self.postMessage({
      type: "ready",
      source: "cache",
      modelId: activeModel?.id,
      modelLabel: activeModel?.label,
    });
    return;
  }

  if (loadingPromise) {
    await loadingPromise;
    return;
  }

  const candidates = resolveModelOrder(payload);

  loadingPromise = (async () => {
    self.postMessage({ type: "loading-start" });

    const errors = [];

    for (const candidate of candidates) {
      try {
        const remotePipeline = await tryLoadCandidate(candidate, "download");
        generator = remotePipeline;
        activeModel = candidate;
        self.postMessage({
          type: "ready",
          source: "download",
          modelId: candidate.id,
          modelLabel: candidate.label,
        });
        return;
      } catch (remoteError) {
        try {
          const localPipeline = await tryLoadCandidate(candidate, "local-fallback");
          generator = localPipeline;
          activeModel = candidate;
          self.postMessage({
            type: "ready",
            source: "cache",
            modelId: candidate.id,
            modelLabel: candidate.label,
          });
          return;
        } catch (localError) {
          errors.push(
            `${candidate.id}: ${formatLoadError(localError || remoteError)}`,
          );
        }
      }
    }

    const message =
      errors.length > 0
        ? `অফলাইন মডেল লোড করা যায়নি। ${errors.join(" | ")}`
        : "অফলাইন মডেল লোড করা যায়নি।";

    self.postMessage({
      type: "error",
      stage: "load",
      message,
    });
    throw new Error(message);
  })();

  try {
    await loadingPromise;
  } finally {
    loadingPromise = null;
  }
}

async function generateAnswer(question) {
  if (!generator) {
    throw new Error("মডেল এখনো লোড হয়নি");
  }

  const banglaQuestion = hasBangla(question);

  const prompt = banglaQuestion
    ? `তুমি একজন প্রিমিয়াম অফলাইন AI টিউটর। শুধুমাত্র বাংলা ভাষায় উত্তর দাও।\nসংক্ষিপ্ত এবং নির্ভুল উত্তর দাও, তারপর ছোট ব্যাখ্যা দাও।\nপ্রশ্ন: ${question}\nউত্তর:`
    : `You are a reliable offline AI tutor. Answer clearly and concisely in natural English.\nQuestion: ${question}\nAnswer:`;

  const output = await generator(prompt, {
    max_new_tokens: 240,
    temperature: 0.3,
    do_sample: true,
    top_p: 0.92,
    repetition_penalty: 1.15,
  });

  const rawAnswer = cleanupResponseText(extractGeneratedText(output));
  if (!rawAnswer) {
    return banglaQuestion
      ? "দুঃখিত, কোনো উত্তর তৈরি করা যায়নি।"
      : "Sorry, I could not generate an answer right now.";
  }

  if (banglaQuestion) {
    return await forceBanglaResponse(rawAnswer, question);
  }

  return rawAnswer;
}

self.onmessage = async (event) => {
  const { type, payload } = event.data || {};

  try {
    if (type === "load") {
      await loadModel(payload || {});
      return;
    }

    if (type === "generate") {
      self.postMessage({ type: "generating" });
      const question = String(payload?.question || "").trim();

      if (!question) {
        throw new Error("প্রশ্ন খালি রাখা যাবে না");
      }

      const answer = await generateAnswer(question);
      self.postMessage({ type: "result", answer });
      return;
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      stage: type || "unknown",
      message: error?.message || "ওয়ার্কার ত্রুটি হয়েছে",
    });
  }
};
