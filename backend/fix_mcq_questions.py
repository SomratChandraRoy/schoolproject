"""
Fix MCQ Questions Script
Validates and fixes MCQ questions with invalid or missing options
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from quizzes.models import Quiz


def fix_mcq_questions():
    print("=" * 60)
    print("FIX MCQ QUESTIONS SCRIPT")
    print("=" * 60)
    
    # Get all MCQ questions
    all_mcq = Quiz.objects.filter(question_type='mcq')
    total_mcq = all_mcq.count()
    
    print(f"\nTotal MCQ questions in database: {total_mcq}")
    
    if total_mcq == 0:
        print("No MCQ questions found.")
        return
    
    # Check for invalid questions
    invalid_questions = []
    
    for question in all_mcq:
        is_invalid = False
        reason = []
        
        # Check 1: options must be a dict
        if not isinstance(question.options, dict):
            is_invalid = True
            reason.append(f"options is {type(question.options).__name__}, not dict")
        
        # Check 2: options must not be empty
        elif len(question.options) == 0:
            is_invalid = True
            reason.append("options is empty dict")
        
        # Check 3: options should have at least 2 choices
        elif len(question.options) < 2:
            is_invalid = True
            reason.append(f"only {len(question.options)} option(s)")
        
        # Check 4: Check if keys are valid (A, B, C, D or similar)
        else:
            option_keys = list(question.options.keys())
            if not all(isinstance(k, str) for k in option_keys):
                is_invalid = True
                reason.append("invalid option keys")
        
        if is_invalid:
            invalid_questions.append({
                'id': question.id,
                'subject': question.subject,
                'class': question.class_target,
                'question': question.question_text[:80] + '...',
                'options': question.options,
                'reason': ', '.join(reason)
            })
    
    print(f"\n{'=' * 60}")
    print(f"VALIDATION RESULTS")
    print(f"{'=' * 60}")
    print(f"Total MCQ questions: {total_mcq}")
    print(f"Invalid questions: {len(invalid_questions)}")
    print(f"Valid questions: {total_mcq - len(invalid_questions)}")
    
    if len(invalid_questions) == 0:
        print("\n✅ All MCQ questions are valid!")
        return
    
    print(f"\n{'=' * 60}")
    print(f"INVALID QUESTIONS DETAILS")
    print(f"{'=' * 60}")
    
    for i, q in enumerate(invalid_questions[:10], 1):  # Show first 10
        print(f"\n{i}. Question ID: {q['id']}")
        print(f"   Subject: {q['subject']}, Class: {q['class']}")
        print(f"   Question: {q['question']}")
        print(f"   Options: {q['options']}")
        print(f"   Issue: {q['reason']}")
    
    if len(invalid_questions) > 10:
        print(f"\n... and {len(invalid_questions) - 10} more invalid questions")
    
    # Ask user if they want to fix
    print(f"\n{'=' * 60}")
    print("FIX OPTIONS")
    print(f"{'=' * 60}")
    
    response = input("\nDo you want to attempt automatic fixes? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("Skipping fixes. Run this script again to fix later.")
        return
    
    print("\nAttempting to fix invalid questions...")
    
    fixed_count = 0
    skipped_count = 0
    
    for q_info in invalid_questions:
        try:
            question = Quiz.objects.get(id=q_info['id'])
            
            # Attempt to fix based on the issue
            if not isinstance(question.options, dict):
                # Convert to dict if possible
                if isinstance(question.options, list) and len(question.options) >= 2:
                    # Convert list to dict
                    new_options = {}
                    labels = ['A', 'B', 'C', 'D', 'E', 'F']
                    for i, opt in enumerate(question.options[:6]):
                        new_options[labels[i]] = opt
                    question.options = new_options
                    question.save()
                    fixed_count += 1
                    print(f"✓ Fixed question {question.id}: Converted list to dict")
                else:
                    # Create default options with correct answer
                    question.options = {
                        'A': question.correct_answer,
                        'B': 'Option B',
                        'C': 'Option C',
                        'D': 'Option D'
                    }
                    question.save()
                    fixed_count += 1
                    print(f"✓ Fixed question {question.id}: Created default options")
            
            elif len(question.options) == 0:
                # Create default options
                question.options = {
                    'A': question.correct_answer,
                    'B': 'Option B',
                    'C': 'Option C',
                    'D': 'Option D'
                }
                question.save()
                fixed_count += 1
                print(f"✓ Fixed question {question.id}: Created default options")
            
            elif len(question.options) < 2:
                # Add more options
                existing_keys = list(question.options.keys())
                labels = ['A', 'B', 'C', 'D']
                for label in labels:
                    if label not in existing_keys:
                        question.options[label] = f'Option {label}'
                question.save()
                fixed_count += 1
                print(f"✓ Fixed question {question.id}: Added missing options")
            
            else:
                skipped_count += 1
                print(f"⚠ Skipped question {question.id}: Complex issue, needs manual review")
        
        except Exception as e:
            skipped_count += 1
            print(f"✗ Error fixing question {q_info['id']}: {str(e)}")
    
    print(f"\n{'=' * 60}")
    print(f"FIX SUMMARY")
    print(f"{'=' * 60}")
    print(f"Total invalid: {len(invalid_questions)}")
    print(f"Fixed: {fixed_count}")
    print(f"Skipped: {skipped_count}")
    
    if fixed_count > 0:
        print(f"\n✅ Successfully fixed {fixed_count} questions!")
        print("⚠️  Note: Fixed questions use default options. Please review and update manually.")
    
    if skipped_count > 0:
        print(f"\n⚠️  {skipped_count} questions need manual review.")
        print("These questions have complex issues that require manual fixing.")


if __name__ == '__main__':
    fix_mcq_questions()
