export type RawOptions = Record<string, unknown> | unknown[] | null | undefined;
export type OptionMap = Record<string, string>;

const optionPrefixPattern = /^\s*([A-Da-d])\s*[).:\-]\s*(.+)$/;

export const normalizeText = (value: string): string => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const extractOptionKey = (value: string): string => {
  const text = String(value || "").trim();

  if (/^[A-Da-d]$/.test(text)) {
    return text.toUpperCase();
  }

  const prefixed = text.match(/^([A-Da-d])\s*[).:\-]\s*/);
  return prefixed ? prefixed[1].toUpperCase() : "";
};

const stripOptionPrefix = (value: string): string => {
  const text = String(value || "").trim();
  const match = text.match(optionPrefixPattern);
  return match ? match[2].trim() : text;
};

export const normalizeOptions = (rawOptions: RawOptions): OptionMap => {
  const optionMap: OptionMap = {};

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((item, index) => {
      const itemText = String(item || "").trim();
      if (!itemText) {
        return;
      }

      const key = extractOptionKey(itemText) || String.fromCharCode(65 + index);
      optionMap[key] = stripOptionPrefix(itemText);
    });
    return optionMap;
  }

  if (rawOptions && typeof rawOptions === "object") {
    Object.entries(rawOptions).forEach(([rawKey, rawValue]) => {
      const key = extractOptionKey(rawKey) || rawKey.trim().toUpperCase();
      if (!key) {
        return;
      }
      optionMap[key] = String(rawValue || "").trim();
    });
  }

  return optionMap;
};

export const getOptionEntries = (
  rawOptions: RawOptions,
): Array<[string, string]> => {
  return Object.entries(normalizeOptions(rawOptions)).sort(([a], [b]) =>
    a.localeCompare(b),
  );
};

export const resolveAnswerKey = (
  rawOptions: RawOptions,
  answer: string,
): string => {
  const directKey = extractOptionKey(answer);
  if (directKey) {
    return directKey;
  }

  const normalizedAnswer = normalizeText(stripOptionPrefix(answer));
  if (!normalizedAnswer) {
    return "";
  }

  const optionMap = normalizeOptions(rawOptions);
  for (const [key, value] of Object.entries(optionMap)) {
    if (normalizeText(value) === normalizedAnswer) {
      return key;
    }
  }

  return "";
};

const evaluateTextAnswer = (
  userAnswer: string,
  correctAnswer: string,
  questionType: string,
): boolean => {
  const normalizedUser = normalizeText(userAnswer);
  const normalizedCorrect = normalizeText(correctAnswer);

  if (!normalizedUser || !normalizedCorrect) {
    return false;
  }

  if (normalizedUser === normalizedCorrect) {
    return true;
  }

  if (
    normalizedUser.length >= 6 &&
    (normalizedUser.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedUser))
  ) {
    return true;
  }

  const userWords = new Set(
    normalizedUser.split(" ").filter((word) => word.length > 2),
  );
  const correctWords = new Set(
    normalizedCorrect.split(" ").filter((word) => word.length > 2),
  );

  if (!userWords.size || !correctWords.size) {
    return false;
  }

  let overlap = 0;
  correctWords.forEach((word) => {
    if (userWords.has(word)) {
      overlap += 1;
    }
  });

  const overlapRatio = overlap / correctWords.size;

  if (questionType === "long") {
    return overlap >= 2 && overlapRatio >= 0.35;
  }

  return overlap >= 1 && overlapRatio >= 0.5;
};

export const evaluateQuizAnswer = (
  questionType: string,
  userAnswer: string,
  correctAnswer: string,
  rawOptions: RawOptions,
): boolean => {
  const normalizedQuestionType = String(questionType || "mcq").toLowerCase();

  if (!String(userAnswer || "").trim() || !String(correctAnswer || "").trim()) {
    return false;
  }

  if (normalizedQuestionType !== "mcq") {
    return evaluateTextAnswer(
      userAnswer,
      correctAnswer,
      normalizedQuestionType,
    );
  }

  const optionMap = normalizeOptions(rawOptions);
  const userKey = resolveAnswerKey(rawOptions, userAnswer);
  const correctKey = resolveAnswerKey(rawOptions, correctAnswer);

  if (userKey && correctKey) {
    return userKey === correctKey;
  }

  const normalizedUser = normalizeText(stripOptionPrefix(userAnswer));
  const normalizedCorrect = normalizeText(stripOptionPrefix(correctAnswer));

  if (
    normalizedUser &&
    normalizedCorrect &&
    normalizedUser === normalizedCorrect
  ) {
    return true;
  }

  if (correctKey && normalizedUser) {
    return normalizeText(optionMap[correctKey] || "") === normalizedUser;
  }

  if (userKey && normalizedCorrect) {
    return normalizeText(optionMap[userKey] || "") === normalizedCorrect;
  }

  return false;
};

export const formatAnswerForDisplay = (
  questionType: string,
  rawOptions: RawOptions,
  answer: string,
): string => {
  if (String(questionType || "mcq").toLowerCase() !== "mcq") {
    return String(answer || "");
  }

  const optionMap = normalizeOptions(rawOptions);
  const key = resolveAnswerKey(rawOptions, answer);

  if (key && optionMap[key]) {
    return `${key}) ${optionMap[key]}`;
  }

  return String(answer || "");
};
