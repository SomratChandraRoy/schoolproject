"""
Enhanced Voice Conversation Service
Provides intelligent conversation management with context awareness,
doubt resolution, exam/quiz proctoring, and automatic summarization
"""

import json
import logging
from typing import Dict, List, Tuple, Optional
from django.db.models import QuerySet
from django.utils import timezone

from .models import (
    VoiceConversationSession,
    VoiceConversationMessage,
    VoiceQuizSession,
    ConversationSummary
)

logger = logging.getLogger(__name__)


class VoiceConversationContextManager:
    """
    Manages conversation context including:
    - Past conversation history
    - Student's learning profile
    - Topic expertise tracking
    - Weakness identification
    """

    @staticmethod
    def get_student_context(user, subject: str = "", topic: str = "") -> Dict:
        """
        Build comprehensive student context from past conversations
        """
        try:
            # Get recent conversation summaries
            recent_summaries = ConversationSummary.objects.filter(
                user=user
            ).order_by('-created_at')[:5]

            # Build context from past conversations
            past_topics = []
            past_weak_areas = []
            past_strong_areas = []
            past_recommendations = []

            for summary in recent_summaries:
                past_topics.extend(summary.next_topics_to_study)
                past_weak_areas.extend(summary.weak_concepts)
                past_strong_areas.extend(summary.strong_concepts)
                if summary.study_recommendations:
                    past_recommendations.append(summary.study_recommendations)

            # Subject-specific context
            subject_sessions = VoiceConversationSession.objects.filter(
                user=user,
                subject=subject,
                is_active=False
            ).order_by('-ended_at')[:3] if subject else []

            context = {
                'student_class': user.class_level or 9,
                'student_name': user.first_name or 'Student',
                'has_prior_context': len(recent_summaries) > 0,
                'recent_topics': list(set(past_topics))[:5],
                'weak_areas': list(set(past_weak_areas))[:5],
                'strong_areas': list(set(past_strong_areas))[:5],
                'past_recommendations': past_recommendations[:3],
                'subject_specific_history': len(subject_sessions),
                'total_conversations': VoiceConversationSession.objects.filter(
                    user=user,
                    is_active=False
                ).count()
            }

            return context

        except Exception as e:
            logger.error(f"Error building student context: {e}")
            return {
                'student_class': user.class_level or 9,
                'student_name': user.first_name or 'Student',
                'has_prior_context': False
            }

    @staticmethod
    def get_previous_session_summary(user, subject: str) -> Optional[str]:
        """
        Get summary from most recent session with this subject
        """
        try:
            latest_summary = ConversationSummary.objects.filter(
                user=user,
                voice_session__subject=subject
            ).order_by('-created_at').first()

            if latest_summary:
                return f"""
Previous Session Summary:
- Topics Covered: {', '.join(latest_summary.key_concepts[:3])}
- Weak Areas: {', '.join(latest_summary.weak_concepts[:2]) if latest_summary.weak_concepts else 'None identified'}
- Recommendations: {latest_summary.study_recommendations[:200] if latest_summary.study_recommendations else 'Continue with current topics'}
"""
            return None

        except Exception as e:
            logger.error(f"Error getting previous session summary: {e}")
            return None


class DoubtSolvingAIPromptBuilder:
    """
    Creates optimized prompts for doubt-solving mode
    """

    @staticmethod
    def build_tutor_prompt(
        message: str,
        context: Dict,
        subject: str,
        topic: str,
        previous_context: Optional[str] = None
    ) -> str:
        """
        Build prompt for AI tutor mode
        """
        student_class = context.get('student_class', 9)
        student_name = context.get('student_name', 'Student')
        weak_areas = context.get('weak_areas', [])
        strong_areas = context.get('strong_areas', [])

        prompt = f"""You are an experienced, empathetic AI teacher for Class {student_class} students in India.

STUDENT PROFILE:
- Name: {student_name}
- Subject: {subject}
- Current Topic: {topic}
- Previous Strong Areas: {', '.join(strong_areas[:3]) if strong_areas else 'Not yet identified'}
- Areas to Focus On: {', '.join(weak_areas[:3]) if weak_areas else 'All areas equally'}
- Previous Conversations: {context.get('total_conversations', 0)}

{f'PREVIOUS SESSION CONTEXT:' + previous_context if previous_context else ''}

STUDENT'S DOUBT/QUESTION:
{message}

YOUR RESPONSE SHOULD:
1. **Greet warmly** - Use the student's name and acknowledge their question
2. **Assess understanding** - Ask what they already know about the topic
3. **Break it down** - Explain step-by-step in simple terms suitable for Class {student_class}
4. **Provide examples** - Use relatable examples from Indian context when possible
5. **Connect to strength** - Reference their strong areas to build confidence
6. **Address weakness** - Gently address known weak areas if relevant
7. **Check understanding** - Ask them to summarize or apply the concept
8. **Next step** - Suggest what they should study next
9. **Encouragement** - End with positive, motivating message

IMPORTANT:
- Use NCERT curriculum standards for Class {student_class}
- Use Bangla or Hindi terms with English translations for clarity
- Keep explanations age-appropriate and engaging
- Encourage questions and critical thinking
- If student seems confused, offer to re-explain differently

Now, provide your response as a supportive teacher would:"""

        return prompt

    @staticmethod
    def build_exam_prompt(
        message: str,
        context: Dict,
        subject: str,
        question_number: int = 1,
        total_questions: int = None
    ) -> str:
        """
        Build prompt for AI exam proctoring mode
        """
        student_class = context.get('student_class', 9)

        prompt = f"""You are an AI exam proctor and teacher evaluating a Class {student_class} student's exam response.

EXAM CONTEXT:
- Subject: {subject}
- Question #{question_number}{f' of {total_questions}' if total_questions else ''}
- Student Class: {student_class}

STUDENT'S RESPONSE TO QUESTION:
{message}

YOUR ROLE:
1. Evaluate the answer for accuracy and completeness
2. Provide constructive feedback
3. Help teach the correct concept if needed
4. Maintain exam integrity while being supportive

RESPOND WITH JSON FORMAT:
{{
  "is_correct": true/false,
  "accuracy_percentage": 0-100,
  "score": 0-10,
  "concept_understood": "full" | "partial" | "minimal" | "incorrect",
  "evaluation": "Detailed evaluation of the answer",
  "correct_answer": "What the correct answer should be if needed",
  "explanation": "Why is this correct/incorrect?",
  "common_mistake": "Common mistake students make with this concept",
  "tip_for_success": "Helpful tip for approaching similar problems",
  "conceptual_gap": "If incorrect, what concept needs clarification?",
  "encouragement": "Positive feedback even if answer is wrong",
  "next_question_readiness": "Is student ready for next question? Suggest review if needed"
}}

Be fair, educational, and encouraging in your evaluation."""

        return prompt

    @staticmethod
    def build_quiz_prompt(
        message: str,
        correct_answer: str,
        explanation: str,
        context: Dict
    ) -> str:
        """
        Build prompt for quiz mode feedback
        """
        student_class = context.get('student_class', 9)

        prompt = f"""You are a friendly AI quiz coach giving feedback to a Class {student_class} student.

QUESTION DETAILS:
- Correct Answer: {correct_answer}
- Concept Explanation: {explanation}

STUDENT'S ANSWER:
{message}

YOUR FEEDBACK SHOULD:
1. Tell them if they're correct or not (be positive either way)
2. Explain the correct answer clearly
3. Provide a learning tip
4. Suggest a practice strategy
5. Encourage them to continue

Make it engaging and motivating! Format your response as JSON:
{{
  "is_correct": true/false,
  "feedback": "Your engaging feedback",
  "explanation": "Clear explanation of correct answer",
  "tip": "Learning tip to remember this concept",
  "similar_problem": "An example of a similar problem they should try",
  "encouragement": "Motivational message"
}}"""

        return prompt


class ConversationSummaryGenerator:
    """
    Generates comprehensive summaries of conversations using AI
    """

    @staticmethod
    def prepare_messages_for_summary(
        messages: QuerySet,
        max_messages: int = 30
    ) -> str:
        """
        Prepare conversation messages for summary generation
        """
        recent_messages = messages.order_by('-timestamp')[:max_messages]
        formatted_messages = []

        for msg in reversed(recent_messages):
            sender = "Student" if msg.is_user_message else "AI Teacher"
            formatted_messages.append(
                f"{sender}: {msg.message_text[:300]}"
            )

        return "\n".join(formatted_messages)

    @staticmethod
    def build_summary_prompt(
        session,
        messages_text: str,
        context: Dict
    ) -> str:
        """
        Build prompt for generating conversation summary
        """
        student_class = context.get('student_class', 9)
        session_mode = session.get_mode_display()
        duration = "not tracked"

        if session.started_at and session.ended_at:
            try:
                started_at = session.started_at
                ended_at = session.ended_at

                # Normalize legacy rows that might contain naive datetimes.
                if timezone.is_naive(started_at):
                    started_at = timezone.make_aware(
                        started_at,
                        timezone.get_current_timezone(),
                    )
                if timezone.is_naive(ended_at):
                    ended_at = timezone.make_aware(
                        ended_at,
                        timezone.get_current_timezone(),
                    )

                duration_minutes = max(
                    0,
                    int((ended_at - started_at).total_seconds() // 60),
                )
                duration = f"{duration_minutes} minutes"
            except Exception:
                duration = "not tracked"

        prompt = f"""Analyze this educational conversation and generate a comprehensive summary for the student's learning record.

SESSION DETAILS:
- Mode: {session_mode}
- Subject: {session.subject or 'General'}
- Topic: {session.topic or 'Various'}
- Student Class: {student_class}
- Duration: {duration}
- Total Exchanges: {session.messages.filter(is_user_message=True).count()}

CONVERSATION:
{messages_text}

GENERATE A DETAILED JSON SUMMARY:
{{
  "summary": "Brief 2-3 sentence overall summary",
  "key_concepts": ["Most important concept 1", "Important concept 2", "Important concept 3"],
  "doubts_cleared": ["Doubt 1 that was solved", "Doubt 2 that was solved"],
  "weak_areas": ["Topic student struggled with", "Concept needing more practice"],
  "strong_areas": ["Topic student understood well", "Concept mastered"],
  "next_topics_recommended": ["Recommended next topic 1", "Recommended next topic 2"],
  "learning_insights": "Personalized insight about this student's learning style and progress",
  "study_recommendations": "Specific recommendations for improvement and practice",
  "time_investment_feedback": "Feedback on whether time was used effectively",
  "progress_tracking": {{
    "confidence_level": "low" | "medium" | "high",
    "concept_mastery": 0-100,
    "engagement_level": "low" | "medium" | "high",
    "readiness_for_next_topic": true/false
  }},
  "practice_suggestions": ["Specific practice exercise 1", "Specific practice exercise 2"]
}}

Make the summary:
- Specific and actionable
- Encouraging and supportive
- Focused on learning growth
- Useful for future teachers/tutors
- Realistic about progress"""

        return prompt

    @staticmethod
    def generate_session_summary(
        session: VoiceConversationSession,
        context: Dict,
        ai_service
    ) -> Optional[Dict]:
        """
        Generate and store comprehensive session summary
        """
        try:
            # Prepare conversation text
            messages_text = ConversationSummaryGenerator.prepare_messages_for_summary(
                session.messages.all()
            )

            # Build summary prompt
            summary_prompt = ConversationSummaryGenerator.build_summary_prompt(
                session,
                messages_text,
                context
            )

            # Generate summary
            success, summary_response, error, _ = ai_service.generate(
                prompt=summary_prompt,
                timeout=60,
                feature_type="voice_ai_provider"
            )

            if not success:
                logger.warning(f"Failed to generate summary: {error}")
                return None

            # Parse summary
            try:
                summary_data = json.loads(summary_response)
                return summary_data
            except json.JSONDecodeError:
                logger.warning("Could not parse summary as JSON")
                return {
                    "summary": summary_response[:500],
                    "key_concepts": [],
                    "doubts_cleared": [],
                    "weak_areas": [],
                    "strong_areas": [],
                    "next_topics_recommended": [],
                    "learning_insights": "",
                    "study_recommendations": ""
                }

        except Exception as e:
            logger.error(f"Error generating session summary: {e}")
            return None


class VoiceQuizEvaluator:
    """
    Evaluates quiz/exam responses with detailed feedback
    """

    @staticmethod
    def parse_evaluation(response: str) -> Dict:
        """
        Parse AI evaluation response
        """
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "is_correct": False,
                "score": 0,
                "evaluation": response,
                "feedback": response
            }

    @staticmethod
    def calculate_performance_metrics(quiz_session: VoiceQuizSession) -> Dict:
        """
        Calculate detailed performance metrics for quiz/exam
        """
        try:
            from .models import VoiceQuizAnswer

            all_answers = VoiceQuizQuestion.objects.filter(
                quiz_session=quiz_session
            ).count()

            correct = VoiceQuizQuestion.objects.filter(
                quiz_session=quiz_session,
                answers__is_correct=True
            ).count()

            accuracy = (correct / all_answers * 100) if all_answers > 0 else 0

            return {
                "total_questions": all_answers,
                "correct_answers": correct,
                "incorrect_answers": all_answers - correct,
                "accuracy_percentage": round(accuracy, 2),
                "score": round(correct / all_answers * 100, 2) if all_answers > 0 else 0
            }

        except Exception as e:
            logger.error(f"Error calculating metrics: {e}")
            return {
                "total_questions": 0,
                "correct_answers": 0,
                "accuracy_percentage": 0
            }
