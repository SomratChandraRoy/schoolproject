import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from accounts.models import User
from quizzes.models import Quiz
from books.models import Book
from games.models import Game

def create_sample_users():
    # Create sample users
    users_data = [
        {
            'username': 'student1',
            'email': 'student1@example.com',
            'password': 'studentpass123',
            'class_level': 9,
            'fav_subjects': ['math', 'physics'],
            'disliked_subjects': ['english'],
            'is_teacher': False,
            'is_admin': False
        },
        {
            'username': 'student2',
            'email': 'student2@example.com',
            'password': 'studentpass123',
            'class_level': 10,
            'fav_subjects': ['biology', 'chemistry'],
            'disliked_subjects': ['math'],
            'is_teacher': False,
            'is_admin': False
        },
        {
            'username': 'teacher1',
            'email': 'teacher1@example.com',
            'password': 'teacherpass123',
            'class_level': None,
            'fav_subjects': [],
            'disliked_subjects': [],
            'is_teacher': True,
            'is_admin': False
        },
        {
            'username': 'admin1',
            'email': 'admin1@example.com',
            'password': 'adminpass123',
            'class_level': None,
            'fav_subjects': [],
            'disliked_subjects': [],
            'is_teacher': False,
            'is_admin': True
        }
    ]
    
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults=user_data
        )
        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"Created user: {user.username}")
        else:
            print(f"User already exists: {user.username}")


def create_sample_quizzes():
    # Create sample quizzes for different classes and subjects
    quizzes_data = [
        # Class 9 Math quizzes
        {
            'subject': 'math',
            'class_target': 9,
            'difficulty': 'medium',
            'question_text': 'What is the value of π (pi) approximately?',
            'options': {'A': '3.14', 'B': '2.71', 'C': '1.41', 'D': '1.73'},
            'correct_answer': 'A',
            'explanation': 'Pi (π) is a mathematical constant approximately equal to 3.14159.'
        },
        {
            'subject': 'math',
            'class_target': 9,
            'difficulty': 'medium',
            'question_text': 'What is the formula for the area of a circle?',
            'options': {'A': '2πr', 'B': 'πr²', 'C': 'πd', 'D': '2πr²'},
            'correct_answer': 'B',
            'explanation': 'The area of a circle is given by the formula A = πr², where r is the radius.'
        },
        # Class 10 Physics quizzes
        {
            'subject': 'physics',
            'class_target': 10,
            'difficulty': 'medium',
            'question_text': 'What is the SI unit of electric current?',
            'options': {'A': 'Volt', 'B': 'Watt', 'C': 'Ampere', 'D': 'Ohm'},
            'correct_answer': 'C',
            'explanation': 'The SI unit of electric current is Ampere (A).'
        },
        {
            'subject': 'physics',
            'class_target': 10,
            'difficulty': 'hard',
            'question_text': 'What is the speed of light in vacuum?',
            'options': {'A': '3 × 10⁸ m/s', 'B': '3 × 10⁶ m/s', 'C': '3 × 10¹⁰ m/s', 'D': '3 × 10⁵ m/s'},
            'correct_answer': 'A',
            'explanation': 'The speed of light in vacuum is approximately 3 × 10⁸ meters per second.'
        }
    ]
    
    for quiz_data in quizzes_data:
        quiz, created = Quiz.objects.get_or_create(
            question_text=quiz_data['question_text'],
            defaults=quiz_data
        )
        if created:
            print(f"Created quiz: {quiz.question_text}")
        else:
            print(f"Quiz already exists: {quiz.question_text}")


def create_sample_books():
    # Create sample books
    books_data = [
        {
            'title': 'Mathematics Class 9',
            'author': 'Dr. Md. Abu Yusuf',
            'class_level': 9,
            'category': 'textbook',
            'language': 'en',
            'description': 'NCTB Mathematics textbook for Class 9'
        },
        {
            'title': 'গণিত বই - নবম শ্রেণি',
            'author': 'ড. এম এ হালিম',
            'class_level': 9,
            'category': 'textbook',
            'language': 'bn',
            'description': 'জাতীয় পাঠ্যপুস্তক বোর্ড গণিত বই - নবম শ্রেণি'
        },
        {
            'title': 'Physics Class 10',
            'author': 'Prof. Md. Shah Alam',
            'class_level': 10,
            'category': 'textbook',
            'language': 'en',
            'description': 'NCTB Physics textbook for Class 10'
        }
    ]
    
    for book_data in books_data:
        book, created = Book.objects.get_or_create(
            title=book_data['title'],
            defaults=book_data
        )
        if created:
            print(f"Created book: {book.title}")
        else:
            print(f"Book already exists: {book.title}")


def create_sample_games():
    # Create sample games
    games_data = [
        {
            'name': 'Memory Matrix',
            'game_type': 'memory_matrix',
            'description': 'Test your memory skills by remembering patterns',
            'min_class_level': 6,
            'max_class_level': 12
        },
        {
            'name': 'Equation Storm',
            'game_type': 'equation_storm',
            'description': 'Solve math equations as fast as you can',
            'min_class_level': 8,
            'max_class_level': 12
        },
        {
            'name': 'Pathfinder',
            'game_type': 'pathfinder',
            'description': 'Find the optimal path through a maze',
            'min_class_level': 6,
            'max_class_level': 12
        },
        {
            'name': 'Infinite Loop',
            'game_type': 'infinite_loop',
            'description': 'A challenging puzzle game that\'s hard to beat',
            'min_class_level': 9,
            'max_class_level': 12
        }
    ]
    
    for game_data in games_data:
        game, created = Game.objects.get_or_create(
            name=game_data['name'],
            defaults=game_data
        )
        if created:
            print(f"Created game: {game.name}")
        else:
            print(f"Game already exists: {game.name}")


if __name__ == '__main__':
    print("Populating sample data...")
    create_sample_users()
    create_sample_quizzes()
    create_sample_books()
    create_sample_games()
    print("Sample data population completed!")