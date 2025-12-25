"""
Automated CRUD Operations Test Script
Tests all CRUD operations for Quiz Management

Run with: python test_crud_operations.py
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

# Test data
CLASSES = [6, 7, 8, 9, 10, 11, 12]
SUBJECTS = [
    'math', 'higher_math', 'physics', 'chemistry', 'biology',
    'science', 'bangla_1st', 'bangla_2nd', 'english_1st', 'english_2nd',
    'ict', 'bangladesh_global', 'history', 'geography', 'civics',
    'accounting', 'finance', 'business', 'economics', 'general_science'
]
DIFFICULTIES = ['easy', 'medium', 'hard']
QUESTION_TYPES = ['mcq', 'short', 'long']

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

# Test results
results = {
    'passed': 0,
    'failed': 0,
    'errors': []
}

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✓ {text}{RESET}")
    results['passed'] += 1

def print_error(text):
    print(f"{RED}✗ {text}{RESET}")
    results['failed'] += 1
    results['errors'].append(text)

def print_info(text):
    print(f"{YELLOW}ℹ {text}{RESET}")

def get_auth_token():
    """Get authentication token - you need to provide valid credentials"""
    print_info("Please enter your credentials:")
    username = input("Username: ")
    password = input("Password: ")
    
    try:
        response = requests.post(
            f"{API_URL}/accounts/login/",
            json={'username': username, 'password': password}
        )
        if response.status_code == 200:
            token = response.json().get('token')
            print_success(f"Authenticated as {username}")
            return token
        else:
            print_error(f"Authentication failed: {response.text}")
            return None
    except Exception as e:
        print_error(f"Authentication error: {str(e)}")
        return None

def test_create_operations(token):
    """Test CREATE operations"""
    print_header("Testing CREATE Operations")
    
    headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}
    created_ids = []
    
    # Test 1: Create MCQ for each class
    print_info("Test 1: Creating MCQ questions for each class...")
    for class_num in CLASSES:
        data = {
            'subject': 'math',
            'class_target': class_num,
            'difficulty': 'medium',
            'question_text': f'Test MCQ question for Class {class_num}',
            'question_type': 'mcq',
            'options': {
                'A': 'Option A',
                'B': 'Option B',
                'C': 'Option C',
                'D': 'Option D'
            },
            'correct_answer': 'A) Option A',
            'explanation': 'Test explanation'
        }
        
        try:
            response = requests.post(f"{API_URL}/quizzes/", json=data, headers=headers)
            if response.status_code == 201:
                created_id = response.json().get('id')
                created_ids.append(created_id)
                print_success(f"Created MCQ for Class {class_num} (ID: {created_id})")
            else:
                print_error(f"Failed to create MCQ for Class {class_num}: {response.text}")
        except Exception as e:
            print_error(f"Error creating MCQ for Class {class_num}: {str(e)}")
    
    # Test 2: Create Short Answer question
    print_info("\nTest 2: Creating Short Answer question...")
    data = {
        'subject': 'physics',
        'class_target': 9,
        'difficulty': 'medium',
        'question_text': 'Test Short Answer question',
        'question_type': 'short',
        'options': {},
        'correct_answer': 'Test short answer',
        'explanation': 'Test explanation'
    }
    
    try:
        response = requests.post(f"{API_URL}/quizzes/", json=data, headers=headers)
        if response.status_code == 201:
            created_id = response.json().get('id')
            created_ids.append(created_id)
            print_success(f"Created Short Answer question (ID: {created_id})")
        else:
            print_error(f"Failed to create Short Answer: {response.text}")
    except Exception as e:
        print_error(f"Error creating Short Answer: {str(e)}")
    
    # Test 3: Create Long Answer question
    print_info("\nTest 3: Creating Long Answer question...")
    data = {
        'subject': 'chemistry',
        'class_target': 10,
        'difficulty': 'hard',
        'question_text': 'Test Long Answer question',
        'question_type': 'long',
        'options': {},
        'correct_answer': 'Test long answer with detailed explanation',
        'explanation': 'Test explanation'
    }
    
    try:
        response = requests.post(f"{API_URL}/quizzes/", json=data, headers=headers)
        if response.status_code == 201:
            created_id = response.json().get('id')
            created_ids.append(created_id)
            print_success(f"Created Long Answer question (ID: {created_id})")
        else:
            print_error(f"Failed to create Long Answer: {response.text}")
    except Exception as e:
        print_error(f"Error creating Long Answer: {str(e)}")
    
    return created_ids

def test_read_operations(token):
    """Test READ operations"""
    print_header("Testing READ Operations")
    
    headers = {'Authorization': f'Token {token}'}
    
    # Test 1: Fetch all questions
    print_info("Test 1: Fetching all questions...")
    try:
        response = requests.get(f"{API_URL}/quizzes/", headers=headers)
        if response.status_code == 200:
            data = response.json()
            questions = data.get('results', data)
            count = len(questions) if isinstance(questions, list) else 0
            print_success(f"Fetched {count} questions")
            
            # Check if we have questions from different classes
            if isinstance(questions, list) and len(questions) > 0:
                classes_found = set(q.get('class_target') for q in questions)
                print_info(f"Found questions for classes: {sorted(classes_found)}")
                
                if len(classes_found) >= 3:
                    print_success("Questions from multiple classes found")
                else:
                    print_error("Not enough class diversity in questions")
        else:
            print_error(f"Failed to fetch questions: {response.text}")
    except Exception as e:
        print_error(f"Error fetching questions: {str(e)}")

def test_update_operations(token, question_ids):
    """Test UPDATE operations"""
    print_header("Testing UPDATE Operations")
    
    if not question_ids:
        print_error("No questions to update (create test may have failed)")
        return
    
    headers = {'Authorization': f'Token {token}', 'Content-Type': 'application/json'}
    
    # Test 1: Update class
    print_info("Test 1: Updating question class...")
    question_id = question_ids[0]
    data = {
        'subject': 'math',
        'class_target': 11,  # Change to different class
        'difficulty': 'hard',  # Change difficulty too
        'question_text': 'Updated test question',
        'question_type': 'mcq',
        'options': {
            'A': 'Updated Option A',
            'B': 'Updated Option B',
            'C': 'Updated Option C',
            'D': 'Updated Option D'
        },
        'correct_answer': 'B) Updated Option B',
        'explanation': 'Updated explanation'
    }
    
    try:
        response = requests.put(f"{API_URL}/quizzes/{question_id}/", json=data, headers=headers)
        if response.status_code == 200:
            updated = response.json()
            if updated.get('class_target') == 11 and updated.get('difficulty') == 'hard':
                print_success(f"Updated question {question_id} successfully")
            else:
                print_error(f"Question updated but values don't match")
        else:
            print_error(f"Failed to update question: {response.text}")
    except Exception as e:
        print_error(f"Error updating question: {str(e)}")
    
    # Test 2: Change question type from MCQ to Short
    if len(question_ids) > 1:
        print_info("\nTest 2: Changing question type from MCQ to Short...")
        question_id = question_ids[1]
        data = {
            'subject': 'physics',
            'class_target': 9,
            'difficulty': 'medium',
            'question_text': 'Changed to short answer',
            'question_type': 'short',
            'options': {},
            'correct_answer': 'Short answer text',
            'explanation': 'Explanation'
        }
        
        try:
            response = requests.put(f"{API_URL}/quizzes/{question_id}/", json=data, headers=headers)
            if response.status_code == 200:
                updated = response.json()
                if updated.get('question_type') == 'short':
                    print_success(f"Changed question {question_id} to short answer")
                else:
                    print_error(f"Question type didn't change")
            else:
                print_error(f"Failed to change question type: {response.text}")
        except Exception as e:
            print_error(f"Error changing question type: {str(e)}")

def test_delete_operations(token, question_ids):
    """Test DELETE operations"""
    print_header("Testing DELETE Operations")
    
    if not question_ids:
        print_error("No questions to delete (create test may have failed)")
        return
    
    headers = {'Authorization': f'Token {token}'}
    
    # Delete all created test questions
    print_info(f"Deleting {len(question_ids)} test questions...")
    for question_id in question_ids:
        try:
            response = requests.delete(f"{API_URL}/quizzes/{question_id}/", headers=headers)
            if response.status_code == 204:
                print_success(f"Deleted question {question_id}")
            else:
                print_error(f"Failed to delete question {question_id}: {response.text}")
        except Exception as e:
            print_error(f"Error deleting question {question_id}: {str(e)}")

def print_summary():
    """Print test summary"""
    print_header("Test Summary")
    
    total = results['passed'] + results['failed']
    pass_rate = (results['passed'] / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"{GREEN}Passed: {results['passed']}{RESET}")
    print(f"{RED}Failed: {results['failed']}{RESET}")
    print(f"Pass Rate: {pass_rate:.1f}%\n")
    
    if results['errors']:
        print(f"{RED}Errors:{RESET}")
        for error in results['errors']:
            print(f"  - {error}")
    
    if results['failed'] == 0:
        print(f"\n{GREEN}{'='*60}")
        print(f"{'ALL TESTS PASSED! ✓'.center(60)}")
        print(f"{'='*60}{RESET}\n")
    else:
        print(f"\n{RED}{'='*60}")
        print(f"{'SOME TESTS FAILED ✗'.center(60)}")
        print(f"{'='*60}{RESET}\n")

def main():
    """Main test runner"""
    print_header("Quiz Management CRUD Operations Test")
    print_info("This script will test all CRUD operations")
    print_info("Make sure the backend server is running on localhost:8000\n")
    
    # Get authentication token
    token = get_auth_token()
    if not token:
        print_error("Cannot proceed without authentication")
        sys.exit(1)
    
    # Run tests
    created_ids = test_create_operations(token)
    test_read_operations(token)
    test_update_operations(token, created_ids)
    test_delete_operations(token, created_ids)
    
    # Print summary
    print_summary()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test interrupted by user{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Unexpected error: {str(e)}{RESET}")
        sys.exit(1)
