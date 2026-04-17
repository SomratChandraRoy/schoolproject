from __future__ import annotations

from typing import Any, Dict, Optional

from django.db.models import Sum

from .models import QuizAttempt, UserQuizProgress


LEVEL_XP_STEP = 120
MAX_LEVEL = 50


def _safe_ratio(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return float(numerator) / float(denominator)


def map_level_to_difficulty(level: int) -> str:
    """Map the computed user level to quiz generation difficulty."""
    if level <= 3:
        return "easy"
    if level <= 7:
        return "medium"
    return "hard"


def _level_title(level: int) -> str:
    if level <= 2:
        return "Rising Starter"
    if level <= 5:
        return "Curious Explorer"
    if level <= 9:
        return "Focused Strategist"
    if level <= 14:
        return "Deep Achiever"
    return "Master Scholar"


def get_level_info(
    user,
    subject: Optional[str] = None,
    class_level: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Compute user level from attempts, correctness, and completion progress.

    Level is intentionally stateless so it can evolve with data quality and does
    not require schema migrations.
    """
    attempts_qs = QuizAttempt.objects.filter(user=user)

    if subject:
        attempts_qs = attempts_qs.filter(quiz__subject=subject)
    if class_level is not None:
        attempts_qs = attempts_qs.filter(quiz__class_target=class_level)

    total_attempts = attempts_qs.count()
    correct_attempts = attempts_qs.filter(is_correct=True).count()
    accuracy = _safe_ratio(correct_attempts, total_attempts) * 100.0

    progress_qs = UserQuizProgress.objects.filter(user=user)
    if subject:
        progress_qs = progress_qs.filter(subject=subject)
    if class_level is not None:
        progress_qs = progress_qs.filter(class_level=class_level)

    if subject:
        progress = progress_qs.order_by("-last_activity").first()
        static_completed = int(progress.static_questions_completed) if progress else 0
        total_static = int(progress.total_static_questions) if progress else 0
        completion_percentage = float(progress.static_completion_percentage) if progress else 0.0
        ai_answered = int(progress.ai_questions_answered) if progress else 0
        ai_correct = int(progress.ai_questions_correct) if progress else 0
    else:
        aggregate = progress_qs.aggregate(
            static_completed=Sum("static_questions_completed"),
            total_static=Sum("total_static_questions"),
            ai_answered=Sum("ai_questions_answered"),
            ai_correct=Sum("ai_questions_correct"),
        )
        static_completed = int(aggregate.get("static_completed") or 0)
        total_static = int(aggregate.get("total_static") or 0)
        ai_answered = int(aggregate.get("ai_answered") or 0)
        ai_correct = int(aggregate.get("ai_correct") or 0)
        completion_percentage = _safe_ratio(static_completed, total_static) * 100.0

    # XP model favors consistency (attempts), quality (accuracy), and completion.
    attempts_xp = total_attempts * 7
    correct_xp = correct_attempts * 12
    completion_xp = int(completion_percentage * 1.4)
    accuracy_xp = int(accuracy * 0.8)
    ai_xp = (ai_correct * 15) + max(0, (ai_answered - ai_correct) * 4)

    xp = attempts_xp + correct_xp + completion_xp + accuracy_xp + ai_xp
    level = max(1, min(MAX_LEVEL, 1 + (xp // LEVEL_XP_STEP)))

    level_floor = (level - 1) * LEVEL_XP_STEP
    next_level_xp = level * LEVEL_XP_STEP
    level_progress_percent = _safe_ratio(xp - level_floor, LEVEL_XP_STEP) * 100.0

    return {
        "level": level,
        "title": _level_title(level),
        "xp": xp,
        "next_level_xp": next_level_xp,
        "level_progress_percent": round(level_progress_percent, 1),
        "accuracy": round(accuracy, 1),
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "completion_percentage": round(completion_percentage, 1),
        "static_completed": static_completed,
        "total_static": total_static,
        "ai_questions_answered": ai_answered,
        "ai_questions_correct": ai_correct,
        "recommended_difficulty": map_level_to_difficulty(level),
    }
