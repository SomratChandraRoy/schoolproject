import re
from typing import Any, Dict


OPTION_PREFIX_PATTERN = re.compile(r"^\s*([A-Da-d])\s*[\)\.\:\-]\s*(.+)\s*$")


def normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^\w\s\u0980-\u09FF]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_option_key(value: Any) -> str:
    text = str(value or "").strip()
    if re.fullmatch(r"[A-Da-d]", text):
        return text.upper()

    match = re.match(r"^([A-Da-d])\s*[\)\.\:\-]\s*", text)
    if match:
        return match.group(1).upper()

    return ""


def strip_option_prefix(value: Any) -> str:
    text = str(value or "").strip()
    match = OPTION_PREFIX_PATTERN.match(text)
    if match:
        return match.group(2).strip()
    return text


def normalize_options(raw_options: Any) -> Dict[str, str]:
    option_map: Dict[str, str] = {}

    if isinstance(raw_options, dict):
        for raw_key, raw_value in raw_options.items():
            key = extract_option_key(raw_key) or str(raw_key).strip().upper()
            if not key:
                continue
            option_map[key] = str(raw_value or "").strip()
        return option_map

    if isinstance(raw_options, list):
        for idx, item in enumerate(raw_options):
            item_text = str(item or "").strip()
            if not item_text:
                continue
            key = extract_option_key(item_text)
            if not key:
                key = chr(ord("A") + idx)
            option_map[key] = strip_option_prefix(item_text)

    return option_map


def find_option_key_by_text(option_map: Dict[str, str], answer: Any) -> str:
    normalized_answer = normalize_text(strip_option_prefix(answer))
    if not normalized_answer:
        return ""

    for key, value in option_map.items():
        if normalize_text(value) == normalized_answer:
            return key

    return ""


def evaluate_mcq_answer(selected_answer: Any, correct_answer: Any, raw_options: Any) -> bool:
    option_map = normalize_options(raw_options)

    selected_key = extract_option_key(selected_answer)
    correct_key = extract_option_key(correct_answer)

    if not selected_key:
        selected_key = find_option_key_by_text(option_map, selected_answer)

    if not correct_key:
        correct_key = find_option_key_by_text(option_map, correct_answer)

    if selected_key and correct_key:
        return selected_key == correct_key

    normalized_selected = normalize_text(strip_option_prefix(selected_answer))
    normalized_correct = normalize_text(strip_option_prefix(correct_answer))

    if normalized_selected and normalized_correct and normalized_selected == normalized_correct:
        return True

    if correct_key and normalized_selected:
        return normalize_text(option_map.get(correct_key, "")) == normalized_selected

    if selected_key and normalized_correct:
        return normalize_text(option_map.get(selected_key, "")) == normalized_correct

    return False


def evaluate_text_answer(selected_answer: Any, correct_answer: Any, question_type: str) -> bool:
    normalized_selected = normalize_text(selected_answer)
    normalized_correct = normalize_text(correct_answer)

    if not normalized_selected or not normalized_correct:
        return False

    if normalized_selected == normalized_correct:
        return True

    if len(normalized_selected) >= 6 and (
        normalized_selected in normalized_correct or normalized_correct in normalized_selected
    ):
        return True

    selected_words = {word for word in normalized_selected.split() if len(word) > 2}
    correct_words = {word for word in normalized_correct.split() if len(word) > 2}

    if not selected_words or not correct_words:
        return False

    overlap = len(selected_words.intersection(correct_words))
    overlap_ratio = overlap / max(len(correct_words), 1)

    if question_type == "long":
        return overlap >= 2 and overlap_ratio >= 0.35

    return overlap >= 1 and overlap_ratio >= 0.5


def evaluate_quiz_answer(
    question_type: str,
    selected_answer: Any,
    correct_answer: Any,
    raw_options: Any = None,
) -> bool:
    if not str(selected_answer or "").strip() or not str(correct_answer or "").strip():
        return False

    normalized_question_type = (question_type or "mcq").lower()

    if normalized_question_type == "mcq":
        return evaluate_mcq_answer(selected_answer, correct_answer, raw_options)

    return evaluate_text_answer(selected_answer, correct_answer, normalized_question_type)


def format_answer_for_display(question_type: str, answer: Any, raw_options: Any = None) -> str:
    normalized_question_type = (question_type or "mcq").lower()

    if normalized_question_type != "mcq":
        return str(answer or "")

    option_map = normalize_options(raw_options)
    key = extract_option_key(answer)

    if not key:
        key = find_option_key_by_text(option_map, answer)

    if key and key in option_map:
        return f"{key}) {option_map[key]}"

    return str(answer or "")
