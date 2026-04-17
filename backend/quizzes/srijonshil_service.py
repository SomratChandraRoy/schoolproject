"""Services for generating and evaluating Bangla board-style Srijonshil question sets."""

import json
import re
from typing import Dict, List, Tuple


class SrijonshilGenerator:
    """Generate and evaluate Srijonshil question sets using configured AI providers."""

    PART_LABELS = ['ক', 'খ', 'গ', 'ঘ']
    PART_MARKS = [1.0, 2.0, 3.0, 4.0]

    def __init__(self):
        from ai.ai_service import get_ai_service

        self.ai_service = get_ai_service()

    @staticmethod
    def _clean_json_response(raw_text: str) -> str:
        text = str(raw_text or '').strip()
        if not text:
            return ''

        if text.startswith('```'):
            text = re.sub(r'^```(?:json)?\s*', '', text)
            text = re.sub(r'\s*```$', '', text)

        return text.strip()

    @staticmethod
    def _clamp_score(value: float, upper_bound: float) -> float:
        bounded = min(max(float(value), 0.0), float(upper_bound))
        return round(bounded, 2)

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r'[A-Za-z\u0980-\u09FF]+', str(text or '').lower())

    def _generation_fallback(self, subject: str, chapter: str, class_level: int) -> Dict:
        uddipok = (
            f"{subject} বিষয়ের {chapter} অধ্যায়ভিত্তিক একটি পরিস্থিতি কল্পনা করো। "
            f"শ্রেণি {class_level} এর একজন শিক্ষার্থী বাস্তব জীবনের উদাহরণ দিয়ে এই অধ্যায় বুঝতে চায়।"
        )

        questions = [
            {
                'question': 'উদ্দীপক থেকে অধ্যায়ের মূল ধারণাটি শনাক্ত করে সংক্ষেপে লেখ।',
                'model_answer': 'উদ্দীপকের তথ্য থেকে অধ্যায়ের মূল ধারণাটি পরিষ্কারভাবে উল্লেখ করতে হবে।',
            },
            {
                'question': 'উদ্দীপকের আলোকে বিষয়টির কারণ-ফল সম্পর্ক ব্যাখ্যা কর।',
                'model_answer': 'প্রাসঙ্গিক কারণগুলো ও তার ফলাফল ধারাবাহিকভাবে ব্যাখ্যা করতে হবে।',
            },
            {
                'question': 'উদ্দীপকের সাথে অধ্যায়ের একটি গুরুত্বপূর্ণ নীতি বা সূত্র বিশ্লেষণ কর।',
                'model_answer': 'নীতির সংজ্ঞা, উদ্দীপকের সাথে সম্পর্ক এবং বিশ্লেষণধর্মী ব্যাখ্যা দিতে হবে।',
            },
            {
                'question': 'উদ্দীপককে ভিত্তি করে বাস্তব জীবনে বিষয়টির প্রয়োগ ও মূল্যায়ন কর।',
                'model_answer': 'বাস্তব উদাহরণ, যৌক্তিক বিশ্লেষণ এবং নিজের মূল্যায়ন উপস্থাপন করতে হবে।',
            },
        ]

        return {
            'uddipok': uddipok,
            'questions': questions,
            'provider_used': 'rule_based',
        }

    def _parse_generation_response(self, response_text: str) -> Dict | None:
        cleaned = self._clean_json_response(response_text)
        if not cleaned:
            return None

        parsed = None
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except json.JSONDecodeError:
                    return None

        if not isinstance(parsed, dict):
            return None

        uddipok = str(parsed.get('uddipok') or parsed.get('stimulus') or '').strip()
        if not uddipok:
            return None

        raw_questions = parsed.get('questions')
        normalized_parts = []

        if isinstance(raw_questions, dict):
            ordered_candidates = [
                raw_questions.get('1') or raw_questions.get('q1') or raw_questions.get('ক'),
                raw_questions.get('2') or raw_questions.get('q2') or raw_questions.get('খ'),
                raw_questions.get('3') or raw_questions.get('q3') or raw_questions.get('গ'),
                raw_questions.get('4') or raw_questions.get('q4') or raw_questions.get('ঘ'),
            ]
        elif isinstance(raw_questions, list):
            ordered_candidates = raw_questions[:4]
        else:
            ordered_candidates = []

        for index in range(4):
            candidate = ordered_candidates[index] if index < len(ordered_candidates) else None
            question_text = ''
            model_answer = ''

            if isinstance(candidate, dict):
                question_text = str(
                    candidate.get('question')
                    or candidate.get('question_text')
                    or candidate.get('prompt')
                    or ''
                ).strip()
                model_answer = str(
                    candidate.get('model_answer')
                    or candidate.get('answer')
                    or candidate.get('sample_answer')
                    or ''
                ).strip()
            elif isinstance(candidate, str):
                question_text = candidate.strip()

            if not question_text:
                return None

            normalized_parts.append(
                {
                    'question': question_text,
                    'model_answer': model_answer,
                }
            )

        if len(normalized_parts) != 4:
            return None

        return {
            'uddipok': uddipok,
            'questions': normalized_parts,
        }

    def _build_generation_prompt(
        self,
        subject: str,
        chapter: str,
        class_level: int,
        difficulty: str,
    ) -> str:
        return f"""
তুমি বাংলাদেশ জাতীয় শিক্ষাক্রম (NCTB) অনুসারে প্রশ্নপ্রণয়ন বিশেষজ্ঞ।

তুমি একটি সৃজনশীল প্রশ্ন তৈরি করবে।
বিষয়: {subject}
অধ্যায়: {chapter}
শ্রেণি: {class_level}
কঠিনতার স্তর: {difficulty}

শর্ত:
1) প্রশ্ন অবশ্যই বাংলায় হবে।
2) প্রথমে একটি বাস্তবধর্মী "উদ্দীপক" থাকবে।
3) উদ্দীপকের ভিত্তিতে ৪টি অংশ থাকবে: ক, খ, গ, ঘ (বাংলাদেশ বোর্ড স্টাইলে)।
4) প্রতিটি অংশ বিশ্লেষণাত্মক ও অধ্যায়ভিত্তিক হতে হবে।
5) প্রতিটি অংশের জন্য একটি সংক্ষিপ্ত "model_answer" দাও।
6) অপ্রাসঙ্গিক বা পুনরাবৃত্ত প্রশ্ন দেবে না।

শুধু JSON দাও, markdown/code block দেবে না। এই schema মেনে:
{{
  "uddipok": "...",
  "questions": [
    {{"label": "ক", "question": "...", "model_answer": "..."}},
    {{"label": "খ", "question": "...", "model_answer": "..."}},
    {{"label": "গ", "question": "...", "model_answer": "..."}},
    {{"label": "ঘ", "question": "...", "model_answer": "..."}}
  ]
}}
""".strip()

    def generate_question_payload(
        self,
        subject: str,
        chapter: str,
        class_level: int,
        difficulty: str = 'medium',
    ) -> Tuple[bool, Dict, str, str]:
        prompt = self._build_generation_prompt(
            subject=subject,
            chapter=chapter,
            class_level=class_level,
            difficulty=difficulty,
        )

        success, response_text, error, provider = self.ai_service.generate(
            prompt=prompt,
            timeout=90,
            feature_type='srijonshil_provider',
        )

        if success:
            parsed = self._parse_generation_response(response_text)
            if parsed:
                parsed['provider_used'] = provider or 'auto'
                return True, parsed, '', provider or 'auto'

        fallback = self._generation_fallback(subject, chapter, class_level)
        return False, fallback, error or 'Failed to parse AI response', 'rule_based'

    def _build_evaluation_prompt(self, question_payload: Dict, answers: List[str]) -> str:
        part_lines = []
        for idx, label in enumerate(self.PART_LABELS):
            question = question_payload['questions'][idx]['question']
            model_answer = question_payload['questions'][idx].get('model_answer', '')
            student_answer = answers[idx]
            max_marks = int(self.PART_MARKS[idx])
            part_lines.append(
                f"{label}) প্রশ্ন: {question}\n"
                f"মডেল উত্তর: {model_answer}\n"
                f"শিক্ষার্থীর উত্তর: {student_answer}\n"
                f"সর্বোচ্চ নম্বর: {max_marks}"
            )

        parts_text = '\n\n'.join(part_lines)

        return f"""
তুমি একজন বাংলাদেশ বোর্ড পরীক্ষার পরীক্ষক।
নিচের উদ্দীপকভিত্তিক সৃজনশীল প্রশ্নের উত্তর মূল্যায়ন কর।

উদ্দীপক:
{question_payload['uddipok']}

{parts_text}

মূল্যায়ন নীতি:
1) প্রতিটি অংশে নির্ধারিত সর্বোচ্চ নম্বরের মধ্যে নম্বর দাও (ক=1, খ=2, গ=3, ঘ=4)।
2) ফিডব্যাক বাংলায়, সংক্ষিপ্ত ও কার্যকর হবে।
3) মোট নম্বর ১০ এর মধ্যে হবে।
4) আংশিক সঠিক হলে আংশিক নম্বর দাও।

শুধু JSON দাও, markdown দেবে না।
{{
  "parts": [
    {{"label": "ক", "marks": 0.8, "feedback": "..."}},
    {{"label": "খ", "marks": 1.2, "feedback": "..."}},
    {{"label": "গ", "marks": 2.0, "feedback": "..."}},
    {{"label": "ঘ", "marks": 2.5, "feedback": "..."}}
  ],
  "total_marks": 6.5,
  "overall_feedback": "..."
}}
""".strip()

    def _parse_evaluation_response(self, response_text: str) -> Dict | None:
        cleaned = self._clean_json_response(response_text)
        if not cleaned:
            return None

        parsed = None
        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except json.JSONDecodeError:
                    return None

        if not isinstance(parsed, dict):
            return None

        raw_parts = parsed.get('parts')
        if not isinstance(raw_parts, list) or len(raw_parts) < 4:
            return None

        normalized_parts = []
        for index, upper in enumerate(self.PART_MARKS):
            row = raw_parts[index] if index < len(raw_parts) else {}
            if not isinstance(row, dict):
                row = {}

            marks = self._clamp_score(row.get('marks', 0.0), upper)
            feedback = str(row.get('feedback') or '').strip()
            if not feedback:
                feedback = 'উত্তরটি আরও গুছিয়ে লিখলে নম্বর বাড়বে।'

            normalized_parts.append(
                {
                    'label': self.PART_LABELS[index],
                    'marks': marks,
                    'feedback': feedback,
                    'max_marks': upper,
                }
            )

        total_marks = self._clamp_score(
            parsed.get('total_marks', sum(item['marks'] for item in normalized_parts)),
            10.0,
        )
        overall_feedback = str(parsed.get('overall_feedback') or '').strip()
        if not overall_feedback:
            overall_feedback = 'ভালো চেষ্টা। কাঠামোবদ্ধ বিশ্লেষণ ও উদাহরণ যুক্ত করলে ফল আরও ভালো হবে।'

        return {
            'parts': normalized_parts,
            'total_marks': total_marks,
            'overall_feedback': overall_feedback,
        }

    def _heuristic_evaluation(self, question_payload: Dict, answers: List[str]) -> Dict:
        parts = []

        for index, upper in enumerate(self.PART_MARKS):
            answer = str(answers[index] or '').strip()
            model_answer = str(question_payload['questions'][index].get('model_answer') or '').strip()

            if not answer:
                marks = 0.0
                feedback = 'এই অংশে উত্তর দেওয়া হয়নি। মূল ধারণা উল্লেখ করে আবার চেষ্টা করো।'
            else:
                answer_tokens = set(self._tokenize(answer))
                model_tokens = set(self._tokenize(model_answer))
                overlap_ratio = 0.0
                if model_tokens:
                    overlap_ratio = len(answer_tokens & model_tokens) / len(model_tokens)

                word_count = len(answer_tokens)
                if word_count < 8:
                    depth_factor = 0.25
                elif word_count < 18:
                    depth_factor = 0.55
                else:
                    depth_factor = 0.8

                score_ratio = min(1.0, (overlap_ratio * 0.55) + (depth_factor * 0.45))
                marks = self._clamp_score(upper * score_ratio, upper)

                if marks >= upper * 0.8:
                    feedback = 'খুব ভালো হয়েছে। যুক্তি ও উদাহরণ স্পষ্ট আছে।'
                elif marks >= upper * 0.5:
                    feedback = 'ভালো চেষ্টা। আরও নির্দিষ্ট উদাহরণ ও বিশ্লেষণ যোগ করো।'
                else:
                    feedback = 'মূল পয়েন্টগুলো আরও পরিষ্কার করে, ধাপে ধাপে লিখতে হবে।'

            parts.append(
                {
                    'label': self.PART_LABELS[index],
                    'marks': marks,
                    'feedback': feedback,
                    'max_marks': upper,
                }
            )

        total_marks = self._clamp_score(sum(part['marks'] for part in parts), 10.0)

        return {
            'parts': parts,
            'total_marks': total_marks,
            'overall_feedback': 'স্বয়ংক্রিয় মূল্যায়ন সম্পন্ন হয়েছে। বিস্তারিত ও উদাহরণভিত্তিক উত্তর দিলে নম্বর আরও বাড়বে।',
        }

    def evaluate_answers(
        self,
        question_payload: Dict,
        answers: List[str],
    ) -> Tuple[Dict, str]:
        prompt = self._build_evaluation_prompt(question_payload, answers)
        success, response_text, _, provider = self.ai_service.generate(
            prompt=prompt,
            timeout=90,
            feature_type='srijonshil_provider',
        )

        if success:
            parsed = self._parse_evaluation_response(response_text)
            if parsed:
                return parsed, provider or 'auto'

        return self._heuristic_evaluation(question_payload, answers), 'rule_based'


_srijonshil_generator = None


def get_srijonshil_generator() -> SrijonshilGenerator:
    global _srijonshil_generator
    if _srijonshil_generator is None:
        _srijonshil_generator = SrijonshilGenerator()
    return _srijonshil_generator
