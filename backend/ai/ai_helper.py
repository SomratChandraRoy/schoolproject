"""
AI Helper Module for MedhaBangla
Provides AI-powered features across all sections of the application
"""
import warnings

# Suppress the deprecation warning before importing
warnings.filterwarnings('ignore', message='.*google.generativeai.*', category=FutureWarning)

import google.generativeai as genai
from django.conf import settings
from typing import Dict, List, Optional
import json


class AIHelper:
    """
    Centralized AI helper class using Google Gemini API
    """
    
    def __init__(self):
        """Initialize Gemini AI"""
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_remedial_explanation(
        self, 
        question: str, 
        user_answer: str, 
        correct_answer: str, 
        class_level: int,
        subject: str
    ) -> str:
        """
        Generate remedial explanation for wrong answers in Bangla
        """
        prompt = f"""আপনি একজন বিশেষজ্ঞ শিক্ষক যিনি বাংলাদেশের ক্লাস {class_level} এর {subject} বিষয়ের শিক্ষার্থীদের পড়ান।

একজন শিক্ষার্থী নিচের প্রশ্নের ভুল উত্তর দিয়েছে:

প্রশ্ন: {question}
শিক্ষার্থীর উত্তর: {user_answer}
সঠিক উত্তর: {correct_answer}

অনুগ্রহ করে বাংলায় একটি বিস্তারিত ব্যাখ্যা প্রদান করুন যাতে থাকবে:

১. **ভুল ধারণা চিহ্নিতকরণ**: শিক্ষার্থী কোথায় ভুল করেছে
২. **সঠিক ধারণার ব্যাখ্যা**: সঠিক উত্তরের পেছনের যুক্তি
৩. **উদাহরণ**: একটি সহজ উদাহরণ দিয়ে ব্যাখ্যা
৪. **মনে রাখার কৌশল**: এই ধারণা মনে রাখার জন্য টিপস
৫. **অনুশীলনের পরামর্শ**: আরও ভালো করার জন্য পরামর্শ

ব্যাখ্যাটি সহজ, উৎসাহব্যঞ্জক এবং শিক্ষামূলক হতে হবে।"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"দুঃখিত, AI ব্যাখ্যা তৈরি করতে সমস্যা হয়েছে: {str(e)}"
    
    def generate_quiz_question(
        self,
        subject: str,
        class_level: int,
        difficulty: str,
        question_type: str = 'mcq',
        topic: Optional[str] = None
    ) -> Dict:
        """
        Generate a quiz question using AI
        """
        topic_text = f" on the topic of {topic}" if topic else ""
        
        prompt = f"""You are an expert educational content creator for Bangladesh's national curriculum (NCTB).

Generate a {difficulty} level {question_type} question for Class {class_level} students in {subject}{topic_text}.

Requirements:
1. The question MUST be curriculum-appropriate for Bangladesh's NCTB syllabus
2. For MCQ questions, provide exactly 4 options (A, B, C, D) with one correct answer
3. For short answer questions, provide a brief model answer (2-3 sentences)
4. For long answer questions, provide a detailed answer outline (5-7 points)
5. Include a clear explanation of the concept being tested
6. Use Bangla for subjects where it's more appropriate (Bangla literature, Bangladesh studies)
7. Ensure the question tests understanding, not just memorization

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{{
    "question_text": "The question text here",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "The correct answer",
    "explanation": "Detailed explanation of the concept and why this is the correct answer"
}}

For non-MCQ questions, set "options" to an empty object {{}}."""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            import re
            if response_text.startswith('```'):
                response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                response_text = re.sub(r'\n?```$', '', response_text)
            
            # Parse JSON
            question_data = json.loads(response_text)
            return question_data
        except json.JSONDecodeError as e:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise ValueError(f"Could not parse AI response as JSON: {str(e)}")
        except Exception as e:
            raise Exception(f"Error generating question: {str(e)}")
    
    def generate_study_notes(
        self,
        content: str,
        class_level: int,
        subject: str,
        note_type: str = 'summary'
    ) -> str:
        """
        Generate AI-powered study notes from content
        """
        if note_type == 'summary':
            prompt = f"""আপনি একজন AI নোট-টেকিং সহায়ক যিনি ক্লাস {class_level} এর {subject} বিষয়ের শিক্ষার্থীদের জন্য নোট তৈরি করেন।

নিচের বিষয়বস্তু থেকে একটি সংক্ষিপ্ত, সুসংগঠিত নোট তৈরি করুন:

{content}

নোটে অন্তর্ভুক্ত করুন:
১. **মূল বিষয়**: প্রধান ধারণাগুলি বুলেট পয়েন্টে
২. **গুরুত্বপূর্ণ সংজ্ঞা**: মূল শব্দ এবং তাদের অর্থ
৩. **উদাহরণ**: যদি প্রযোজ্য হয়
৪. **মনে রাখার কৌশল**: গুরুত্বপূর্ণ পয়েন্ট মনে রাখার টিপস

নোটটি পড়া এবং পুনর্বিবেচনা করা সহজ হতে হবে।"""
        
        elif note_type == 'flashcard':
            prompt = f"""Create flashcard-style notes for Class {class_level} {subject} students from this content:

{content}

Format as Q&A pairs:
Q: [Question]
A: [Answer]

Create 5-10 flashcards covering the key concepts."""
        
        else:  # detailed
            prompt = f"""Create detailed study notes for Class {class_level} {subject} students from this content:

{content}

Include:
1. **Introduction**: Brief overview
2. **Main Concepts**: Detailed explanation with examples
3. **Key Points**: Bullet points of important facts
4. **Practice Questions**: 3-5 questions to test understanding
5. **Summary**: Quick recap

Make it comprehensive yet easy to understand."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating notes: {str(e)}"
    
    def generate_book_summary(
        self,
        book_title: str,
        chapter: str,
        class_level: int
    ) -> str:
        """
        Generate AI summary of a book chapter
        """
        prompt = f"""আপনি একজন বিশেষজ্ঞ শিক্ষক যিনি ক্লাস {class_level} এর শিক্ষার্থীদের পড়ান।

বই: {book_title}
অধ্যায়: {chapter}

এই অধ্যায়ের একটি সংক্ষিপ্ত সারাংশ প্রদান করুন যাতে থাকবে:

১. **অধ্যায়ের মূল বিষয়**: কী নিয়ে আলোচনা করা হয়েছে
২. **গুরুত্বপূর্ণ পয়েন্ট**: মূল শিক্ষা এবং ধারণা
৩. **চরিত্র/ঘটনা**: যদি প্রযোজ্য হয় (সাহিত্যের জন্য)
৪. **শিক্ষা**: এই অধ্যায় থেকে কী শিখতে পারি

সারাংশটি বাংলায় এবং সহজবোধ্য হতে হবে।"""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    def generate_game_hint(
        self,
        game_type: str,
        difficulty: str,
        current_state: str
    ) -> str:
        """
        Generate hints for educational games
        """
        prompt = f"""You are an AI game assistant helping students with the {game_type} game.

Current game state: {current_state}
Difficulty: {difficulty}

Provide a helpful hint that:
1. Guides the student without giving away the answer
2. Encourages critical thinking
3. Is appropriate for the difficulty level
4. Is encouraging and positive

Keep the hint brief (1-2 sentences)."""
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return "Keep trying! Think about the pattern and try different approaches."
    
    def analyze_study_pattern(
        self,
        study_sessions: List[Dict],
        quiz_attempts: List[Dict],
        class_level: int
    ) -> Dict:
        """
        Analyze student's study pattern and provide personalized recommendations
        """
        # Prepare data summary
        total_study_time = sum(session.get('duration', 0) for session in study_sessions)
        subjects_studied = list(set(session.get('subject') for session in study_sessions))
        quiz_accuracy = sum(1 for attempt in quiz_attempts if attempt.get('is_correct', False)) / len(quiz_attempts) if quiz_attempts else 0
        
        prompt = f"""You are an AI educational advisor analyzing a Class {class_level} student's study pattern.

Study Data:
- Total study time: {total_study_time} minutes
- Subjects studied: {', '.join(subjects_studied)}
- Quiz accuracy: {quiz_accuracy * 100:.1f}%
- Number of quiz attempts: {len(quiz_attempts)}

Provide personalized recommendations in JSON format:
{{
    "strengths": ["List of 2-3 strengths"],
    "areas_for_improvement": ["List of 2-3 areas to improve"],
    "study_tips": ["List of 3-5 specific study tips"],
    "recommended_subjects": ["Subjects to focus on"],
    "motivational_message": "An encouraging message in Bangla"
}}"""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Remove markdown if present
            import re
            if response_text.startswith('```'):
                response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                response_text = re.sub(r'\n?```$', '', response_text)
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "strengths": ["Regular study habits"],
                "areas_for_improvement": ["Quiz accuracy"],
                "study_tips": ["Practice more questions", "Review mistakes", "Study consistently"],
                "recommended_subjects": subjects_studied[:2] if subjects_studied else ["Math", "Science"],
                "motivational_message": "তুমি ভালো করছো! চালিয়ে যাও!"
            }
    
    def chat_with_ai(
        self,
        message: str,
        class_level: int,
        chat_history: Optional[List[Dict]] = None,
        context_type: str = 'general'
    ) -> str:
        """
        General AI chat for students
        """
        # Build context from chat history
        history_text = ""
        if chat_history:
            for msg in chat_history[-5:]:  # Last 5 messages for context
                role = "Student" if msg.get('is_user_message') else "AI"
                history_text += f"{role}: {msg.get('message')}\n"
        
        if context_type == 'homework_help':
            system_prompt = f"""আপনি একজন সহায়ক AI শিক্ষক যিনি ক্লাস {class_level} এর শিক্ষার্থীদের হোমওয়ার্কে সাহায্য করেন।

নিয়ম:
- সরাসরি উত্তর দেবেন না, বরং শিক্ষার্থীকে চিন্তা করতে সাহায্য করুন
- ধাপে ধাপে গাইড করুন
- উৎসাহব্যঞ্জক এবং ধৈর্যশীল হন
- বাংলা এবং ইংরেজি উভয় ভাষায় সাহায্য করুন"""
        
        elif context_type == 'exam_prep':
            system_prompt = f"""You are an AI exam preparation tutor for Class {class_level} students.

Focus on:
- Key concepts and topics
- Common exam patterns
- Time management tips
- Practice strategies
- Stress management"""
        
        else:  # general
            system_prompt = f"""আপনি MedhaBangla এর AI সহায়ক, যিনি ক্লাস {class_level} এর শিক্ষার্থীদের সাহায্য করেন।

আপনি সাহায্য করতে পারেন:
- পড়াশোনার প্রশ্নে
- হোমওয়ার্কে
- পরীক্ষার প্রস্তুতিতে
- বই এবং অধ্যায় বুঝতে
- পড়ার পরিকল্পনা তৈরিতে

সবসময় উৎসাহব্যঞ্জক, সহায়ক এবং শিক্ষামূলক হন।"""
        
        full_prompt = f"""{system_prompt}

{history_text}

Student: {message}

AI:"""
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            return f"দুঃখিত, আমি এখন সাহায্য করতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন। Error: {str(e)}"
    
    def generate_syllabus_breakdown(
        self,
        subject: str,
        class_level: int,
        chapter: str
    ) -> Dict:
        """
        Generate detailed breakdown of a syllabus chapter
        """
        prompt = f"""You are an educational content expert for Bangladesh's NCTB curriculum.

Subject: {subject}
Class: {class_level}
Chapter: {chapter}

Provide a detailed breakdown in JSON format:
{{
    "chapter_title": "Chapter name",
    "learning_objectives": ["List of 3-5 learning objectives"],
    "key_topics": [
        {{
            "topic": "Topic name",
            "description": "Brief description",
            "difficulty": "easy/medium/hard"
        }}
    ],
    "estimated_study_time": "X hours",
    "prerequisites": ["List of prerequisite topics"],
    "practice_suggestions": ["List of practice activities"]
}}"""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Remove markdown if present
            import re
            if response_text.startswith('```'):
                response_text = re.sub(r'^```(?:json)?\n?', '', response_text)
                response_text = re.sub(r'\n?```$', '', response_text)
            
            return json.loads(response_text)
        except Exception as e:
            return {
                "chapter_title": chapter,
                "learning_objectives": ["Understand key concepts", "Apply knowledge", "Solve problems"],
                "key_topics": [],
                "estimated_study_time": "2-3 hours",
                "prerequisites": [],
                "practice_suggestions": ["Read textbook", "Solve exercises", "Take quizzes"]
            }


# Singleton instance
ai_helper = AIHelper()
