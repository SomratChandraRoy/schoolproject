// @ts-nocheck
import { env, pipeline } from "@xenova/transformers";

env.allowLocalModels = true;
env.useBrowserCache = true;

const MODEL_CANDIDATES = [
  {
    id: "Xenova/mt5-base",
    label: "mT5-Base (Large Multilingual)",
  },
  {
    id: "Xenova/mt5-small",
    label: "mT5-Small (Multilingual)",
  },
  {
    id: "Xenova/LaMini-Flan-T5-248M",
    label: "LaMini-Flan-T5-248M",
  },
  {
    id: "Xenova/LaMini-Flan-T5-77M",
    label: "LaMini-Flan-T5-77M",
  },
];
let generator = null;
let loadingPromise = null;
let activeModel = null;

function formatLoadError(error) {
  const raw = error?.message || String(error || "Unknown load error");
  if (raw.includes("Unexpected token '<'")) {
    return "মডেল ফাইলের জায়গায় HTML এসেছে, JSON আসেনি। ব্রাউজারের cache/service worker ক্লিয়ার করে আবার চেষ্টা করুন।";
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
  return /[\u0980-\u09FF]/.test(text || "");
}

function cleanupResponseText(text) {
  if (!text) return "";

  return String(text)
    .replace(/^\s*(answer|উত্তর)\s*[:：-]?\s*/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function forceBanglaResponse(answer, question) {
  const cleanedAnswer = cleanupResponseText(answer);
  if (!cleanedAnswer) {
    return "দুঃখিত, এই প্রশ্নের জন্য এখনই উত্তর তৈরি করা যায়নি।";
  }

  if (hasBangla(cleanedAnswer)) {
    return cleanedAnswer;
  }

  const banglaRetryPrompt = `শুধু বাংলা ভাষায় উত্তর দাও।\nপ্রশ্ন: ${question}\nউত্তর:`;
  const retryOutput = await generator(banglaRetryPrompt, {
    max_new_tokens: 280,
    temperature: 0.1,
    do_sample: false,
    num_beams: 5,
  });
  const retryText = cleanupResponseText(extractGeneratedText(retryOutput));

  if (retryText && hasBangla(retryText)) {
    return retryText;
  }

  const translatePrompt = `নিচের লেখাটি সহজ বাংলায় অনুবাদ করো। শুধুমাত্র অনুবাদ দাও:\n${cleanedAnswer}`;
  const translatedOutput = await generator(translatePrompt, {
    max_new_tokens: 320,
    temperature: 0.1,
    do_sample: false,
    num_beams: 5,
  });
  const translatedText = cleanupResponseText(
    extractGeneratedText(translatedOutput),
  );

  if (translatedText && hasBangla(translatedText)) {
    return translatedText;
  }

  return "দুঃখিত, মডেলটি এই উত্তরের বাংলা রূপ দিতে পারেনি। অনুগ্রহ করে প্রশ্নটি একটু ছোট করে আবার করুন।";
}

async function loadModel() {
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

  loadingPromise = (async () => {
    self.postMessage({ type: "loading-start" });

    const errors = [];

    for (const candidate of MODEL_CANDIDATES) {
      try {
        // Remote-first to fetch better model if internet is available.
        env.allowLocalModels = false;
        env.allowRemoteModels = true;
        generator = await pipeline("text2text-generation", candidate.id, {
          progress_callback: (progress) => {
            self.postMessage({
              type: "loading-progress",
              progress,
              mode: "download",
              modelId: candidate.id,
              modelLabel: candidate.label,
            });
          },
        });

        activeModel = candidate;
        self.postMessage({
          type: "ready",
          source: "download",
          modelId: candidate.id,
          modelLabel: candidate.label,
        });
        return;
      } catch (remoteError) {
        // Local-only fallback for the same candidate.
        try {
          env.allowLocalModels = true;
          env.allowRemoteModels = false;
          generator = await pipeline("text2text-generation", candidate.id, {
            progress_callback: (progress) => {
              self.postMessage({
                type: "loading-progress",
                progress,
                mode: "local-fallback",
                modelId: candidate.id,
                modelLabel: candidate.label,
              });
            },
          });

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

  const prompt = `তুমি একজন অভিজ্ঞ শিক্ষা সহায়ক AI টিউটর।\nতুমি শুধুমাত্র বাংলা ভাষায় উত্তর দেবে।\nপ্রথমে সরাসরি উত্তর দেবে, তারপর ২-৩ লাইনের সহজ ব্যাখ্যা দেবে।\nপ্রশ্ন: ${question}\nউত্তর:`;
  const output = await generator(prompt, {
    max_new_tokens: 320,
    temperature: 0.1,
    do_sample: false,
    num_beams: 5,
    repetition_penalty: 1.12,
  });

  const rawAnswer = extractGeneratedText(output);
  const banglaAnswer = await forceBanglaResponse(rawAnswer, question);

  return banglaAnswer || "দুঃখিত, কোনো উত্তর তৈরি করা যায়নি।";
}

self.onmessage = async (event) => {
  const { type, payload } = event.data || {};

  try {
    if (type === "load") {
      await loadModel();
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
