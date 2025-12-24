"""
AI Question Generator Service
Generates adaptive quiz questions based on user progress and difficulty
"""
import json
import re
from typing import List, Dict, Tuple
from django.utils import timezone
from quizzes.models import Quiz, AIGeneratedQuestion, UserQuizProgress
from accounts.models import User


class QuestionGenerator:
    """Service for generating AI questions with adaptive difficulty"""
    
    def __init__(self):
        from .api_key_manager import get_key_manager
        try:
            self.key_manager = get_key_manager()
        except RuntimeError:
            print("[QuestionGenerator] WARNING: API key manager not initialized")
            self.key_manager = None
    
    def generate_batch_questions(
        self,
        user: User,
        subject: str,
        class_level: int,
        difficulty: str,
        question_type: str,
        batch_size: int = 6
    ) -> Tuple[bool, List[AIGeneratedQuestion], str]:
        """
        Generate a batch of AI questions for a user
        
        Returns:
            (success, questions_list, error_message)
        """
        if not self.key_manager:
            return False, [], "API key manager not initialized"
        
        print(f"[QuestionGenerator] Generating {batch_size} questions for {user.username}")
        print(f"[QuestionGenerator] Subject: {subject}, Class: {class_level}, Difficulty: {difficulty}, Type: {question_type}")
        
        # Create prompt for batch generation
        prompt = self._create_batch_prompt(
            subject=subject,
            class_level=class_level,
            difficulty=difficulty,
            question_type=question_type,
            count=batch_size
        )
        
        # Generate questions using Gemini
        success, response_text, error = self.key_manager.generate_content(
            prompt=prompt,
            model_name='gemini-2.5-flash'
        )
        
        if not success:
            print(f"[QuestionGenerator] ERROR: {error}")
            return False, [], error
        
        # Parse the response
        questions_data = self._parse_batch_response(response_text)
        
        if not questions_data:
            return False, [], "Failed to parse AI response"
        
        # Get current batch number
        last_question = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level
        ).order_by('-generation_batch').first()
        
        batch_number = (last_question.generation_batch + 1) if last_question else 1
        
        # Create AIGeneratedQuestion objects
        generated_questions = []
        for q_data in questions_data:
            question = AIGeneratedQuestion.objects.create(
                user=user,
                subject=subject,
                class_level=class_level,
                difficulty=difficulty,
                question_text=q_data['question_text'],
                question_type=question_type,
                options=q_data.get('options', {}),
                correct_answer=q_data['correct_answer'],
                explanation=q_data.get('explanation', ''),
                generation_batch=batch_number
            )
            generated_questions.append(question)
        
        print(f"[QuestionGenerator] Successfully generated {len(generated_questions)} questions (Batch #{batch_number})")
        return True, generated_questions, ""
    
    def _create_batch_prompt(
        self,
        subject: str,
        class_level: int,
        difficulty: str,
        question_type: str,
        count: int
    ) -> str:
        """Create prompt for batch question generation"""
        
        difficulty_desc = {
            'easy': 'basic understanding and recall',
            'medium': 'application and analysis',
            'hard': 'synthesis, evaluation, and complex problem-solving'
        }
        
        type_instructions = {
            'mcq': 'Provide exactly 4 options (A, B, C, D) with one correct answer',
            'short': 'Provide a brief model answer (2-3 sentences)',
            'long': 'Provide a detailed answer outline with key points'
        }
        
        prompt = f"""You are an expert educational content creator for the Bangladeshi education system (NCTB curriculum).

Generate {count} UNIQUE {difficulty} level {question_type} questions for Class {class_level} students in {subject}.

Requirements:
1. Each question must test {difficulty_desc.get(difficulty, 'understanding')}
2. Questions must be curriculum-appropriate for Bangladesh's national curriculum
3. {type_instructions.get(question_type, '')}
4. Include clear explanations for each question
5. Use Bangla for subjects where it's more appropriate
6. Make questions progressively challenging within the batch
7. Cover different topics/concepts within the subject

Respond ONLY with valid JSON array (no markdown, no code blocks):
[
  {{
    "question_text": "Question 1 text here",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "The correct answer",
    "explanation": "Detailed explanation"
  }},
  {{
    "question_text": "Question 2 text here",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "The correct answer",
    "explanation": "Detailed explanation"
  }}
]

For non-MCQ questions, set "options" to an empty object {{}}.
Generate exactly {count} questions."""
        
        return prompt
    
    def _parse_batch_response(self, response_text: str) -> List[Dict]:
        """Parse AI response into list of question dictionaries"""
        try:
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                response_text = re.sub(r'\n?```$', '', response_text)
            
            # Try to parse as JSON
            questions_data = json.loads(response_text)
            
            # Validate structure
            if not isinstance(questions_data, list):
                print("[QuestionGenerator] ERROR: Response is not a list")
                return []
            
            # Validate each question
            valid_questions = []
            for q in questions_data:
                if not isinstance(q, dict):
                    continue
                if not q.get('question_text') or not q.get('correct_answer'):
                    continue
                valid_questions.append(q)
            
            print(f"[QuestionGenerator] Parsed {len(valid_questions)} valid questions")
            return valid_questions
            
        except json.JSONDecodeError as e:
            print(f"[QuestionGenerator] JSON decode error: {str(e)}")
            # Try to extract JSON array from response
            json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if json_match:
                try:
                    questions_data = json.loads(json_match.group())
                    print(f"[QuestionGenerator] Extracted JSON from response")
                    return questions_data if isinstance(questions_data, list) else []
                except:
                    pass
            return []
        except Exception as e:
            print(f"[QuestionGenerator] Parse error: {str(e)}")
            return []
    
    def check_and_generate_questions(
        self,
        user: User,
        subject: str,
        class_level: int,
        difficulty: str,
        question_type: str = 'mcq'
    ) -> Tuple[bool, int, str]:
        """
        Check if questions need to be generated and generate if needed
        
        Returns:
            (success, questions_generated_count, error_message)
        """
        # Get or create progress tracker
        progress, created = UserQuizProgress.objects.get_or_create(
            user=user,
            subject=subject,
            class_level=class_level,
            defaults={'current_difficulty': difficulty}
        )
        
        # Check if AI generation should be active
        if not progress.should_generate_ai_questions():
            return True, 0, "AI generation not yet active"
        
        # Count unanswered AI questions
        unanswered_count = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level,
            is_answered=False
        ).count()
        
        print(f"[QuestionGenerator] Unanswered questions: {unanswered_count}")
        
        # Generate more questions if less than 6 unanswered
        if unanswered_count < 6:
            questions_needed = 6 - unanswered_count
            success, questions, error = self.generate_batch_questions(
                user=user,
                subject=subject,
                class_level=class_level,
                difficulty=progress.current_difficulty,
                question_type=question_type,
                batch_size=questions_needed
            )
            
            if success:
                return True, len(questions), ""
            else:
                return False, 0, error
        
        return True, 0, "Sufficient questions available"
    
    def get_next_question(
        self,
        user: User,
        subject: str,
        class_level: int
    ) -> Tuple[bool, AIGeneratedQuestion, str]:
        """
        Get the next unanswered AI question for the user
        
        Returns:
            (success, question, error_message)
        """
        question = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level,
            is_answered=False
        ).order_by('generated_at').first()
        
        if question:
            return True, question, ""
        else:
            return False, None, "No unanswered questions available"
    
    def update_difficulty_based_on_performance(
        self,
        user: User,
        subject: str,
        class_level: int
    ):
        """Update difficulty level based on recent performance"""
        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level
        ).first()
        
        if not progress:
            return
        
        # Calculate accuracy from recent AI questions
        recent_questions = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level,
            is_answered=True
        ).order_by('-answered_at')[:10]
        
        if recent_questions.count() < 5:
            return  # Not enough data
        
        correct_count = sum(1 for q in recent_questions if q.is_correct)
        accuracy = (correct_count / recent_questions.count()) * 100
        
        print(f"[QuestionGenerator] Recent accuracy: {accuracy:.1f}%")
        
        # Adjust difficulty based on accuracy
        if accuracy >= 80 and progress.current_difficulty != 'hard':
            if progress.current_difficulty == 'easy':
                progress.current_difficulty = 'medium'
                print(f"[QuestionGenerator] Difficulty increased to MEDIUM")
            elif progress.current_difficulty == 'medium':
                progress.current_difficulty = 'hard'
                print(f"[QuestionGenerator] Difficulty increased to HARD")
            progress.save()
        elif accuracy < 50 and progress.current_difficulty != 'easy':
            if progress.current_difficulty == 'hard':
                progress.current_difficulty = 'medium'
                print(f"[QuestionGenerator] Difficulty decreased to MEDIUM")
            elif progress.current_difficulty == 'medium':
                progress.current_difficulty = 'easy'
                print(f"[QuestionGenerator] Difficulty decreased to EASY")
            progress.save()


# Global instance
_question_generator = None

def get_question_generator() -> QuestionGenerator:
    """Get or create the global question generator instance"""
    global _question_generator
    if _question_generator is None:
        _question_generator = QuestionGenerator()
    return _question_generator
