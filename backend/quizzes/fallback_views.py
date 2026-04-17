"""
Fallback Quiz Views
Handles cases where no questions are available in database
Automatically generates AI questions on-demand
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models import Quiz, AIGeneratedQuestion
from .serializers import QuizSerializer
from .leveling import get_level_info
from accounts.models import User


VALID_QUESTION_TYPES = {'mcq', 'short', 'long'}


def parse_question_types(raw_types, fallback='mcq'):
    if isinstance(raw_types, list):
        candidates = raw_types
    elif isinstance(raw_types, str):
        candidates = raw_types.split(',')
    elif raw_types is None:
        candidates = [fallback]
    else:
        candidates = [str(raw_types)]

    parsed = []
    seen = set()
    for raw_value in candidates:
        question_type = str(raw_value or '').strip().lower()
        if question_type in VALID_QUESTION_TYPES and question_type not in seen:
            parsed.append(question_type)
            seen.add(question_type)

    return parsed or [fallback]


class FallbackQuizView(APIView):
    """
    Fallback view that generates AI questions when database has no questions
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        subject = request.query_params.get('subject')
        class_level = request.query_params.get('class_level', user.class_level)
        question_types = request.query_params.get('question_types', 'mcq')
        
        if not subject or not class_level:
            return Response(
                {'error': 'Subject and class_level are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        level_info = get_level_info(
            user=user,
            subject=subject,
            class_level=class_level_int,
        )
        generation_difficulty = level_info['recommended_difficulty']
        
        print(f"[FallbackQuiz] Checking questions for {subject}, Class {class_level}, Types: {question_types}")
        
        # Parse question types
        types_list = parse_question_types(question_types)
        
        # Check if questions exist in database
        existing_questions = Quiz.objects.filter(
            subject=subject,
            class_target=class_level_int,
            question_type__in=types_list
        )
        
        # Additional validation: Check if MCQ questions have valid options
        if 'mcq' in types_list:
            valid_questions = []
            for q in existing_questions:
                if q.question_type == 'mcq':
                    # Check if options is a dict with keys
                    if isinstance(q.options, dict) and len(q.options) > 0:
                        valid_questions.append(q)
                else:
                    valid_questions.append(q)
            existing_questions = valid_questions
        
        question_count = len(existing_questions) if isinstance(existing_questions, list) else existing_questions.count()
        
        print(f"[FallbackQuiz] Found {question_count} valid questions in database")
        
        # If we have enough questions (at least 5), return them
        if question_count >= 5:
            print(f"[FallbackQuiz] Sufficient questions available, using database")
            serializer = QuizSerializer(existing_questions, many=True)
            return Response({
                'source': 'database',
                'count': question_count,
                'results': serializer.data,
                'level_info': level_info,
            })
        
        # Not enough questions - generate AI questions
        print(f"[FallbackQuiz] Insufficient questions, generating AI questions...")
        
        from ai.question_generator import get_question_generator
        
        generator = get_question_generator()
        
        # Generate a balanced batch for all selected question types.
        target_total = max(9, len(types_list) * 3)
        base_count = target_total // len(types_list)
        remainder = target_total % len(types_list)

        generated_questions = []
        generation_errors = []

        for index, selected_type in enumerate(types_list):
            batch_size = base_count + (1 if index < remainder else 0)
            if batch_size <= 0:
                continue

            success, questions, error = generator.generate_batch_questions(
                user=user,
                subject=subject,
                class_level=class_level_int,
                difficulty=generation_difficulty,
                question_type=selected_type,
                batch_size=batch_size
            )

            if not success:
                generation_errors.append(f"{selected_type}: {error}")
                continue

            generated_questions.extend(questions)

        if not generated_questions:
            print(f"[FallbackQuiz] Failed to generate questions: {generation_errors}")
            return Response(
                {'error': f'No questions available and AI generation failed: {" | ".join(generation_errors)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        print(f"[FallbackQuiz] Successfully generated {len(generated_questions)} AI questions")
        
        # Convert AIGeneratedQuestion to Quiz-like format
        quiz_data = []
        for q in generated_questions:
            quiz_data.append({
                'id': q.id,
                'subject': q.subject,
                'class_target': q.class_level,
                'difficulty': q.difficulty,
                'question_text': q.question_text,
                'question_type': q.question_type,
                'options': q.options,
                'correct_answer': q.correct_answer,
                'explanation': q.explanation
            })
        
        return Response({
            'source': 'ai_generated',
            'count': len(quiz_data),
            'results': quiz_data,
            'selected_question_types': types_list,
            'message': 'No questions found in database. AI generated questions for you!',
            'level_info': level_info,
        })


class ValidateQuizQuestionsView(APIView):
    """
    Validate and fix questions with invalid options
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only admins can run validation
        if not request.user.is_admin:
            return Response(
                {'error': 'Only admins can validate questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        print("[ValidateQuiz] Starting validation...")
        
        # Find MCQ questions with invalid options
        all_mcq = Quiz.objects.filter(question_type='mcq')
        
        invalid_count = 0
        fixed_count = 0
        
        for question in all_mcq:
            is_invalid = False
            
            # Check if options is empty or not a dict
            if not isinstance(question.options, dict):
                is_invalid = True
            elif len(question.options) == 0:
                is_invalid = True
            elif not all(key in ['A', 'B', 'C', 'D'] for key in question.options.keys()):
                is_invalid = True
            
            if is_invalid:
                invalid_count += 1
                print(f"[ValidateQuiz] Invalid question ID {question.id}: {question.question_text[:50]}...")
                
                # Try to fix by generating proper options
                # This is a simple fix - you might want to manually review these
                if question.correct_answer:
                    question.options = {
                        'A': question.correct_answer,
                        'B': 'Option B',
                        'C': 'Option C',
                        'D': 'Option D'
                    }
                    question.save()
                    fixed_count += 1
                    print(f"[ValidateQuiz] Fixed question ID {question.id}")
        
        return Response({
            'total_mcq': all_mcq.count(),
            'invalid_found': invalid_count,
            'fixed': fixed_count,
            'message': f'Validation complete. Found {invalid_count} invalid questions, fixed {fixed_count}.'
        })
