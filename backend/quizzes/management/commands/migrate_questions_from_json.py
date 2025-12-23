"""
Django management command to migrate questions from JSON files to AWS RDS PostgreSQL
Usage: python manage.py migrate_questions_from_json [--clear] [--class 6]
"""

import json
import os
from django.core.management.base import BaseCommand
from quizzes.models import Quiz


class Command(BaseCommand):
    help = 'Migrate questions from JSON files (A.C.Q folder) to AWS RDS PostgreSQL database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing questions before migration',
        )
        parser.add_argument(
            '--class',
            type=int,
            dest='class_level',
            help='Migrate only specific class (6-12)',
        )
        parser.add_argument(
            '--subject',
            type=str,
            dest='subject_filter',
            help='Migrate only specific subject',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Starting question migration from JSON to AWS RDS PostgreSQL...'))
        
        # Clear existing questions if requested
        if options['clear']:
            confirm = input('⚠️  This will delete ALL existing questions. Are you sure? (yes/no): ')
            if confirm.lower() == 'yes':
                count = Quiz.objects.all().count()
                Quiz.objects.all().delete()
                self.stdout.write(self.style.WARNING(f'Deleted {count} existing questions'))
            else:
                self.stdout.write('Migration cancelled')
                return
        
        # Get the A.C.Q folder path (go up from backend/quizzes/management/commands to project root)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        acq_folder = os.path.join(base_dir, 'A.C.Q')
        
        if not os.path.exists(acq_folder):
            self.stdout.write(self.style.ERROR(f'❌ A.C.Q folder not found at: {acq_folder}'))
            return
        
        # JSON files to process
        json_files = {
            6: '6.json',
            7: '7.json',
            8: '8.json',
            9: '9.json',
            10: '10.json',
            11: '11-12.json',
            12: '11-12.json',
        }
        
        total_created = 0
        total_skipped = 0
        total_errors = 0
        
        # Filter by class if specified
        if options['class_level']:
            class_level = options['class_level']
            if class_level not in json_files:
                self.stdout.write(self.style.ERROR(f'❌ Invalid class level: {class_level}. Must be 6-12'))
                return
            json_files = {class_level: json_files[class_level]}
        
        # Process each JSON file
        for class_level, filename in json_files.items():
            file_path = os.path.join(acq_folder, filename)
            
            if not os.path.exists(file_path):
                self.stdout.write(self.style.WARNING(f'⚠️  File not found: {filename}'))
                continue
            
            self.stdout.write(f'\n📖 Processing Class {class_level} from {filename}...')
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Process the JSON structure
                created, skipped, errors = self.process_json_data(
                    data, 
                    class_level, 
                    options.get('subject_filter')
                )
                
                total_created += created
                total_skipped += skipped
                total_errors += errors
                
                self.stdout.write(self.style.SUCCESS(
                    f'  ✅ Class {class_level}: {created} created, {skipped} skipped, {errors} errors'
                ))
                
            except json.JSONDecodeError as e:
                self.stdout.write(self.style.ERROR(f'  ❌ JSON decode error in {filename}: {e}'))
                total_errors += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  ❌ Error processing {filename}: {e}'))
                total_errors += 1
        
        # Summary
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('📊 Migration Summary:'))
        self.stdout.write(self.style.SUCCESS(f'  ✅ Total questions created: {total_created}'))
        self.stdout.write(self.style.WARNING(f'  ⏭️  Total questions skipped: {total_skipped}'))
        if total_errors > 0:
            self.stdout.write(self.style.ERROR(f'  ❌ Total errors: {total_errors}'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        if total_created > 0:
            self.stdout.write(self.style.SUCCESS('\n🎉 Migration completed successfully!'))
            self.stdout.write('\n💡 Next steps:')
            self.stdout.write('  1. Verify questions: python manage.py shell')
            self.stdout.write('     >>> from quizzes.models import Quiz')
            self.stdout.write('     >>> Quiz.objects.count()')
            self.stdout.write('  2. Check in Django admin: http://localhost:8000/admin/')
            self.stdout.write('  3. Test quiz functionality in the app')
    
    def process_json_data(self, data, class_level, subject_filter=None):
        """Process JSON data and create questions"""
        created = 0
        skipped = 0
        errors = 0
        
        # Handle list structure (array of objects)
        if isinstance(data, list):
            for item in data:
                # Structure 1: New format with subject_info and assessment_modules (Classes 11-12)
                if 'subject_info' in item and 'assessment_modules' in item:
                    subject_name = item['subject_info'].get('subject_name', 'general_science')
                    
                    # Filter by subject if specified
                    if subject_filter and subject_name.lower() != subject_filter.lower():
                        continue
                    
                    # Process each module
                    for module in item['assessment_modules']:
                        if 'questions' in module:
                            for q in module['questions']:
                                c, s, e = self.create_question_new_format(
                                    q, class_level, subject_name
                                )
                                created += c
                                skipped += s
                                errors += e
                
                # Structure 2: Class 8 format with subject_name and content
                elif 'subject_name' in item and 'content' in item:
                    subject_name = item.get('subject_name', 'general_science')
                    
                    # Clean subject name (remove Bengali text in parentheses)
                    if '(' in subject_name:
                        subject_name = subject_name.split('(')[0].strip()
                    
                    # Filter by subject if specified
                    if subject_filter and subject_name.lower() != subject_filter.lower():
                        continue
                    
                    # Map subject name to code
                    subject_mapping = {
                        'bangla': 'bangla_1st',
                        'english': 'english_1st',
                        'mathematics': 'math',
                        'math': 'math',
                        'science': 'science',
                        'physics': 'physics',
                        'chemistry': 'chemistry',
                        'biology': 'biology',
                        'ict': 'ict',
                    }
                    subject_code = subject_mapping.get(subject_name.lower(), 'general_science')
                    
                    # Process content sections
                    for content_section in item['content']:
                        section_type = content_section.get('type', 'MCQ').lower()
                        questions_list = content_section.get('questions', [])
                        
                        # Determine question type
                        if 'mcq' in section_type or 'multiple' in section_type:
                            q_type = 'mcq'
                        elif 'short' in section_type:
                            q_type = 'short'
                        elif 'broad' in section_type or 'long' in section_type:
                            q_type = 'long'
                        else:
                            q_type = 'mcq'
                        
                        for q in questions_list:
                            c, s, e = self.create_question(q, class_level, subject_code, q_type)
                            created += c
                            skipped += s
                            errors += e
                
                # Structure 3: Class 9 format - direct question objects
                elif 'subject' in item and 'question' in item:
                    subject_name = item.get('subject', 'general_science')
                    
                    # Filter by subject if specified
                    if subject_filter and subject_name.lower() != subject_filter.lower():
                        continue
                    
                    # Map subject name to code
                    subject_mapping = {
                        'bangla': 'bangla_1st',
                        'english': 'english_1st',
                        'mathematics': 'math',
                        'math': 'math',
                        'science': 'science',
                        'physics': 'physics',
                        'chemistry': 'chemistry',
                        'biology': 'biology',
                        'ict': 'ict',
                    }
                    subject_code = subject_mapping.get(subject_name.lower(), 'general_science')
                    
                    # Determine question type
                    q_type = item.get('question_type', 'MCQ').lower()
                    if 'mcq' in q_type or 'multiple' in q_type:
                        q_type = 'mcq'
                    elif 'short' in q_type:
                        q_type = 'short'
                    else:
                        q_type = 'mcq'
                    
                    c, s, e = self.create_question(item, class_level, subject_code, q_type)
                    created += c
                    skipped += s
                    errors += e
                
                # Structure 4: Class 10 format with subjects array
                elif 'subjects' in item:
                    for subject_obj in item['subjects']:
                        subject_name = subject_obj.get('subject_name', 'general_science')
                        
                        # Filter by subject if specified
                        if subject_filter and subject_name.lower() != subject_filter.lower():
                            continue
                        
                        # Map subject name to code
                        subject_mapping = {
                            'bangla 1st paper': 'bangla_1st',
                            'bangla 2nd paper': 'bangla_2nd',
                            'english 1st paper': 'english_1st',
                            'english 2nd paper': 'english_2nd',
                            'mathematics': 'math',
                            'math': 'math',
                            'science': 'science',
                            'physics': 'physics',
                            'chemistry': 'chemistry',
                            'biology': 'biology',
                            'ict': 'ict',
                        }
                        subject_code = subject_mapping.get(subject_name.lower(), 'general_science')
                        
                        # Process questions
                        for q in subject_obj.get('questions', []):
                            q_type = q.get('type', 'MCQ').lower()
                            if 'mcq' in q_type:
                                q_type = 'mcq'
                            elif 'short' in q_type:
                                q_type = 'short'
                            elif 'creative' in q_type or 'broad' in q_type:
                                q_type = 'long'
                            else:
                                q_type = 'mcq'
                            
                            c, s, e = self.create_question(q, class_level, subject_code, q_type)
                            created += c
                            skipped += s
                            errors += e
                
                # Structure 5: Old format with meta and data (Classes 6-7)
                elif 'data' in item:
                    for subject_data in item['data']:
                        c, s, e = self.process_subject_data(
                            subject_data, 
                            class_level, 
                            subject_filter
                        )
                        created += c
                        skipped += s
                        errors += e
        
        # Handle dict structure
        elif isinstance(data, dict):
            if 'data' in data:
                for subject_data in data['data']:
                    c, s, e = self.process_subject_data(
                        subject_data, 
                        class_level, 
                        subject_filter
                    )
                    created += c
                    skipped += s
                    errors += e
        
        return created, skipped, errors
    
    def process_subject_data(self, subject_data, class_level, subject_filter=None):
        """Process questions for a specific subject"""
        created = 0
        skipped = 0
        errors = 0
        
        subject_name = subject_data.get('subject', 'general_science')
        
        # Clean subject name (remove Bengali text in parentheses)
        if '(' in subject_name:
            subject_name = subject_name.split('(')[0].strip()
        
        # Filter by subject if specified
        if subject_filter and subject_name.lower() != subject_filter.lower():
            return 0, 0, 0
        
        # Map subject names to database choices
        subject_mapping = {
            'bangla': 'bangla_1st',
            'english': 'english_1st',
            'mathematics': 'math',
            'math': 'math',
            'science': 'science',
            'physics': 'physics',
            'chemistry': 'chemistry',
            'biology': 'biology',
            'ict': 'ict',
            'bangladesh & global studies': 'bangladesh_global',
            'history': 'history',
            'geography': 'geography',
            'civics': 'civics',
            'accounting': 'accounting',
            'finance': 'finance',
            'business': 'business',
            'economics': 'economics',
            'higher mathematics': 'higher_math',
        }
        
        subject_code = subject_mapping.get(subject_name.lower(), 'general_science')
        
        # Check if this subject has "sections" structure (Classes 7-10)
        if 'sections' in subject_data:
            for section in subject_data['sections']:
                section_type = section.get('type', 'MCQ').lower()
                questions_list = section.get('questions', [])
                
                for q in questions_list:
                    try:
                        # Determine question type
                        if 'mcq' in section_type or 'multiple' in section_type:
                            q_type = 'mcq'
                        elif 'short' in section_type:
                            q_type = 'short'
                        elif 'long' in section_type or 'creative' in section_type:
                            q_type = 'long'
                        else:
                            q_type = 'mcq'  # Default
                        
                        c, s, e = self.create_question(q, class_level, subject_code, q_type)
                        created += c
                        skipped += s
                        errors += e
                    except Exception as ex:
                        self.stdout.write(self.style.ERROR(f'    Error processing question: {ex}'))
                        errors += 1
        
        # Original structure: questions dict with mcq/short/long keys
        else:
            questions_data = subject_data.get('questions', {})
            
            # Process MCQ questions
            if 'mcq' in questions_data:
                for q in questions_data['mcq']:
                    try:
                        c, s, e = self.create_question(q, class_level, subject_code, 'mcq')
                        created += c
                        skipped += s
                        errors += e
                    except Exception as ex:
                        self.stdout.write(self.style.ERROR(f'    Error processing MCQ: {ex}'))
                        errors += 1
            
            # Process short questions
            if 'short' in questions_data:
                for q in questions_data['short']:
                    try:
                        c, s, e = self.create_question(q, class_level, subject_code, 'short')
                        created += c
                        skipped += s
                        errors += e
                    except Exception as ex:
                        self.stdout.write(self.style.ERROR(f'    Error processing short question: {ex}'))
                        errors += 1
            
            # Process long questions
            if 'long' in questions_data:
                for q in questions_data['long']:
                    try:
                        c, s, e = self.create_question(q, class_level, subject_code, 'long')
                        created += c
                        skipped += s
                        errors += e
                    except Exception as ex:
                        self.stdout.write(self.style.ERROR(f'    Error processing long question: {ex}'))
                        errors += 1
        
        return created, skipped, errors
    
    def create_question(self, q_data, class_level, subject_code, question_type):
        """Create a single question in the database"""
        try:
            question_text = q_data.get('question', '')
            if not question_text:
                return 0, 1, 0  # Skip if no question text
            
            # Check if question already exists
            if Quiz.objects.filter(
                question_text=question_text,
                class_target=class_level,
                subject=subject_code
            ).exists():
                return 0, 1, 0  # Skip duplicate
            
            # Prepare options based on question type
            options = {}
            correct_answer = ''
            
            if question_type == 'mcq':
                # Extract options
                options_list = q_data.get('options', [])
                if options_list:
                    options = {
                        'A': options_list[0] if len(options_list) > 0 else '',
                        'B': options_list[1] if len(options_list) > 1 else '',
                        'C': options_list[2] if len(options_list) > 2 else '',
                        'D': options_list[3] if len(options_list) > 3 else '',
                    }
                
                # Extract correct answer
                answer_key = q_data.get('answer', '')
                
                # Check if answer is the full text (Classes 7-10 format)
                if answer_key in options_list:
                    # Find which option letter it corresponds to
                    correct_answer = chr(65 + options_list.index(answer_key))  # A, B, C, D
                else:
                    # Map Bengali letters to English or use as-is
                    answer_mapping = {
                        'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D',
                        'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
                    }
                    correct_answer = answer_mapping.get(answer_key, answer_key.upper())
            
            elif question_type in ['short', 'long']:
                # For short/long questions, store the answer as text
                correct_answer = q_data.get('answer', '')
                options = {}  # No options for short/long questions
            
            if not correct_answer:
                return 0, 1, 0  # Skip if no answer
            
            # Determine difficulty (default to medium)
            difficulty = q_data.get('difficulty', 'medium').lower()
            if difficulty not in ['easy', 'medium', 'hard']:
                difficulty = 'medium'
            
            # Extract explanation
            explanation = q_data.get('explanation', '') or q_data.get('hint', '')
            
            # Create the question
            Quiz.objects.create(
                subject=subject_code,
                class_target=class_level,
                difficulty=difficulty,
                question_text=question_text,
                question_type=question_type,
                options=options,
                correct_answer=correct_answer,
                explanation=explanation
            )
            
            return 1, 0, 0  # Created successfully
            
        except Exception as e:
            return 0, 0, 1  # Error occurred
    
    def create_question_new_format(self, q_data, class_level, subject_name):
        """Create a question from new JSON format (Classes 11-12)"""
        try:
            question_text = q_data.get('question', '')
            if not question_text:
                return 0, 1, 0  # Skip if no question text
            
            # Map subject names to database choices
            subject_mapping = {
                'bangla 1st paper': 'bangla_1st',
                'bangla 2nd paper': 'bangla_2nd',
                'english 1st paper': 'english_1st',
                'english 2nd paper': 'english_2nd',
                'mathematics': 'math',
                'higher mathematics': 'higher_math',
                'physics': 'physics',
                'chemistry': 'chemistry',
                'biology': 'biology',
                'ict': 'ict',
                'accounting': 'accounting',
                'finance': 'finance',
                'business': 'business',
                'economics': 'economics',
            }
            
            subject_code = subject_mapping.get(subject_name.lower(), 'general_science')
            
            # Check if question already exists
            if Quiz.objects.filter(
                question_text=question_text,
                class_target=class_level,
                subject=subject_code
            ).exists():
                return 0, 1, 0  # Skip duplicate
            
            # Determine question type
            q_type = q_data.get('type', 'MCQ').lower()
            if 'mcq' in q_type:
                question_type = 'mcq'
            elif 'short' in q_type:
                question_type = 'short'
            elif 'creative' in q_type or 'cq' in q_type:
                question_type = 'long'
            else:
                question_type = 'mcq'
            
            # Prepare options and answer
            options = {}
            correct_answer = ''
            
            if question_type == 'mcq':
                options_list = q_data.get('options', [])
                if options_list:
                    options = {
                        'A': options_list[0] if len(options_list) > 0 else '',
                        'B': options_list[1] if len(options_list) > 1 else '',
                        'C': options_list[2] if len(options_list) > 2 else '',
                        'D': options_list[3] if len(options_list) > 3 else '',
                    }
                
                # Get correct answer
                correct_ans = q_data.get('correct_answer', '')
                # If answer is the full text, find which option it matches
                if correct_ans in options_list:
                    correct_answer = chr(65 + options_list.index(correct_ans))  # A, B, C, D
                else:
                    correct_answer = 'A'  # Default
            else:
                # For short/long questions
                correct_answer = q_data.get('answer', '')
                if not correct_answer:
                    correct_answer = q_data.get('ai_insight', '')
            
            if not correct_answer:
                return 0, 1, 0  # Skip if no answer
            
            # Extract explanation
            explanation = q_data.get('ai_insight', '') or q_data.get('explanation', '')
            
            # Determine difficulty (default to medium)
            difficulty = 'medium'
            
            # Create the question
            Quiz.objects.create(
                subject=subject_code,
                class_target=class_level,
                difficulty=difficulty,
                question_text=question_text,
                question_type=question_type,
                options=options,
                correct_answer=correct_answer,
                explanation=explanation
            )
            
            return 1, 0, 0  # Created successfully
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'    Error creating question: {e}'))
            return 0, 0, 1  # Error occurred
