# MedhaBangla Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for MedhaBangla, covering unit tests, integration tests, end-to-end tests, and performance testing. The goal is to ensure a robust, reliable, and high-quality educational platform for Bangladeshi students.

## Testing Philosophy

MedhaBangla follows a testing pyramid approach with emphasis on:

1. **Unit Tests** (70%) - Test individual components and functions
2. **Integration Tests** (20%) - Test interactions between components
3. **End-to-End Tests** (10%) - Test complete user workflows

## Testing Tools and Frameworks

### Backend (Django)
- **Unit Testing**: Django's built-in testing framework
- **API Testing**: Django REST Framework test client
- **Mocking**: unittest.mock for external service mocking
- **Coverage**: Coverage.py for test coverage analysis

### Frontend (React)
- **Unit Testing**: Jest with React Testing Library
- **Component Testing**: React Testing Library
- **Integration Testing**: Cypress for browser-based tests
- **End-to-End Testing**: Cypress for complete workflow testing

### Infrastructure
- **Container Testing**: Docker Compose for integration testing
- **Load Testing**: Apache Bench (ab) and Locust
- **Security Testing**: OWASP ZAP for vulnerability scanning

## Unit Testing

### Backend Unit Tests

#### Accounts App
```python
# Test user creation with valid data
def test_user_creation():
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        class_level=9
    )
    assert user.username == 'testuser'
    assert user.class_level == 9
    assert user.check_password('testpass123')

# Test user creation with invalid data
def test_user_creation_invalid():
    with pytest.raises(ValueError):
        User.objects.create_user(username='', email='test@example.com')

# Test custom user model fields
def test_user_model_fields():
    user = User(
        username='testuser',
        class_level=9,
        fav_subjects=['math', 'physics'],
        disliked_subjects=['english']
    )
    assert 'math' in user.fav_subjects
    assert 'english' in user.disliked_subjects
```

#### Quizzes App
```python
# Test quiz creation
def test_quiz_creation():
    quiz = Quiz.objects.create(
        subject='math',
        class_target=9,
        difficulty='medium',
        question_text='What is 2+2?',
        options={'A': '3', 'B': '4', 'C': '5', 'D': '6'},
        correct_answer='B'
    )
    assert quiz.subject == 'math'
    assert quiz.class_target == 9

# Test quiz attempt scoring
def test_quiz_attempt_scoring():
    quiz = Quiz.objects.create(
        subject='math',
        class_target=9,
        difficulty='medium',
        question_text='What is 2+2?',
        options={'A': '3', 'B': '4', 'C': '5', 'D': '6'},
        correct_answer='B'
    )
    
    attempt = QuizAttempt.objects.create(
        user=get_test_user(),
        quiz=quiz,
        selected_answer='B',
        is_correct=True
    )
    
    assert attempt.is_correct == True
```

#### AI App
```python
# Test AI chat session creation
def test_ai_chat_session_creation():
    session = AIChatSession.objects.create(
        user=get_test_user(),
        session_id='test-session-123'
    )
    assert session.session_id == 'test-session-123'

# Test offline note creation
def test_offline_note_creation():
    note = OfflineNote.objects.create(
        user=get_test_user(),
        title='Test Note',
        content='This is a test note content'
    )
    assert note.title == 'Test Note'
    assert note.content == 'This is a test note content'
```

### Frontend Unit Tests

#### React Component Tests
```javascript
// Test Navbar component
import { render, screen } from '@testing-library/react';
import Navbar from '../components/Navbar';

test('renders navigation links', () => {
  render(<Navbar />);
  
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Quizzes')).toBeInTheDocument();
  expect(screen.getByText('Books')).toBeInTheDocument();
  expect(screen.getByText('Games')).toBeInTheDocument();
});

// Test Quiz component
import { render, fireEvent } from '@testing-library/react';
import Quiz from '../pages/Quiz';

test('handles answer selection', () => {
  const { getByText } = render(<Quiz />);
  
  const optionButton = getByText('Option A');
  fireEvent.click(optionButton);
  
  // Assert that the answer is selected
  expect(optionButton).toHaveClass('selected');
});
```

#### Hook Tests
```javascript
// Test custom hook for dark mode
import { renderHook, act } from '@testing-library/react-hooks';
import useDarkMode from '../hooks/useDarkMode';

test('toggles dark mode state', () => {
  const { result } = renderHook(() => useDarkMode());
  
  expect(result.current.isDarkMode).toBe(false);
  
  act(() => {
    result.current.toggleDarkMode();
  });
  
  expect(result.current.isDarkMode).toBe(true);
});
```

## Integration Testing

### API Integration Tests

#### Authentication Flow
```python
def test_user_registration_and_login():
    # Test registration
    response = client.post('/api/accounts/register/', {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123',
        'class_level': 9
    })
    assert response.status_code == 201
    
    # Test login
    response = client.post('/api/accounts/login/', {
        'username': 'testuser',
        'password': 'testpass123'
    })
    assert response.status_code == 200
    assert 'token' in response.data
```

#### Quiz Workflow
```python
def test_complete_quiz_workflow():
    # Create user and authenticate
    user = create_test_user()
    token = get_auth_token(user)
    
    # Create quiz
    quiz_data = {
        'subject': 'math',
        'class_target': 9,
        'difficulty': 'medium',
        'question_text': 'What is 2+2?',
        'options': {'A': '3', 'B': '4', 'C': '5', 'D': '6'},
        'correct_answer': 'B'
    }
    
    response = client.post(
        '/api/quizzes/quizzes/',
        quiz_data,
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    assert response.status_code == 201
    
    # Attempt quiz
    attempt_data = {
        'quiz_id': response.data['id'],
        'selected_answer': 'B'
    }
    
    response = client.post(
        '/api/quizzes/attempts/',
        attempt_data,
        HTTP_AUTHORIZATION=f'Token {token}'
    )
    assert response.status_code == 201
    assert response.data['is_correct'] == True
```

### Database Integration Tests

#### Model Relationships
```python
def test_user_quiz_relationship():
    user = create_test_user()
    quiz = create_test_quiz()
    
    attempt = QuizAttempt.objects.create(
        user=user,
        quiz=quiz,
        selected_answer='B',
        is_correct=True
    )
    
    # Test reverse relationship
    assert attempt in user.quizattempt_set.all()
    assert attempt in quiz.quizattempt_set.all()
```

## End-to-End Testing

### Cypress Test Suite

#### User Authentication Flow
```javascript
describe('User Authentication', () => {
  it('should allow user to register and login', () => {
    cy.visit('/register');
    
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('testpass123');
    cy.get('[data-testid="confirm-password-input"]').type('testpass123');
    cy.get('[data-testid="class-level-select"]').select('9');
    cy.get('[data-testid="terms-checkbox"]').check();
    
    cy.get('[data-testid="register-button"]').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Logout and login again
    cy.get('[data-testid="logout-button"]').click();
    cy.visit('/login');
    
    cy.get('[data-testid="username-input"]').type('testuser');
    cy.get('[data-testid="password-input"]').type('testpass123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.url().should('include', '/dashboard');
  });
});
```

#### Quiz Taking Flow
```javascript
describe('Quiz Taking', () => {
  beforeEach(() => {
    // Login before each test
    cy.login('testuser', 'testpass123');
  });

  it('should allow user to take a quiz', () => {
    cy.visit('/quiz');
    
    // Select a quiz
    cy.get('[data-testid="quiz-card"]').first().click();
    
    // Answer questions
    cy.get('[data-testid="option-A"]').click();
    cy.get('[data-testid="next-button"]').click();
    
    cy.get('[data-testid="option-B"]').click();
    cy.get('[data-testid="submit-button"]').click();
    
    // Check results
    cy.get('[data-testid="results-score"]').should('be.visible');
    cy.get('[data-testid="correct-answers"]').should('be.visible');
  });
});
```

#### AI Chat Interaction
```javascript
describe('AI Chat', () => {
  beforeEach(() => {
    cy.login('testuser', 'testpass123');
  });

  it('should allow user to chat with AI', () => {
    cy.visit('/dashboard');
    
    // Open AI chat
    cy.get('[data-testid="ai-chat-button"]').click();
    
    // Send message
    cy.get('[data-testid="chat-input"]').type('What is photosynthesis?');
    cy.get('[data-testid="send-button"]').click();
    
    // Wait for response
    cy.get('[data-testid="ai-response"]', { timeout: 10000 }).should('be.visible');
  });
});
```

## Performance Testing

### Load Testing with Locust

```python
from locust import HttpUser, task, between

class MedhaBanglaUser(HttpUser):
    wait_time = between(1, 5)
    
    def on_start(self):
        # Login user
        response = self.client.post("/api/accounts/login/", {
            "username": "testuser",
            "password": "testpass123"
        })
        self.token = response.json()["token"]
    
    @task(3)
    def view_dashboard(self):
        self.client.get("/api/dashboard/", 
                       headers={"Authorization": f"Token {self.token}"})
    
    @task(2)
    def take_quiz(self):
        # Get quizzes
        self.client.get("/api/quizzes/quizzes/",
                       headers={"Authorization": f"Token {self.token}"})
        
        # Submit quiz attempt
        self.client.post("/api/quizzes/attempts/",
                        {"quiz_id": 1, "selected_answer": "A"},
                        headers={"Authorization": f"Token {self.token}"})
    
    @task(1)
    def chat_with_ai(self):
        # Start chat session
        response = self.client.post("/api/ai/chat/start/",
                                  headers={"Authorization": f"Token {self.token}"})
        
        session_id = response.json()["session_id"]
        
        # Send message
        self.client.post("/api/ai/chat/message/",
                        {"session_id": session_id, "message": "Hello"},
                        headers={"Authorization": f"Token {self.token}"})
```

### Database Performance Tests

```python
def test_quiz_query_performance():
    # Create test data
    create_test_quizzes(1000)
    
    # Measure query time
    import time
    start_time = time.time()
    
    quizzes = Quiz.objects.filter(class_target=9)[:50]
    
    end_time = time.time()
    query_time = end_time - start_time
    
    # Assert performance (should be under 100ms)
    assert query_time < 0.1
```

## Security Testing

### OWASP Testing

#### Authentication Security
```python
def test_brute_force_protection():
    # Attempt multiple failed logins
    for i in range(10):
        response = client.post('/api/accounts/login/', {
            'username': 'testuser',
            'password': f'wrongpass{i}'
        })
    
    # Should be rate limited
    assert response.status_code == 429  # Too Many Requests
```

#### Input Validation
```python
def test_sql_injection_prevention():
    malicious_input = "'; DROP TABLE quizzes; --"
    
    response = client.post('/api/quizzes/quizzes/', {
        'question_text': malicious_input,
        'subject': 'math'
    })
    
    # Should reject malicious input
    assert response.status_code == 400
```

## Test Automation

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.11
    
    - name: Install dependencies
      run: |
        pip install -r backend/requirements.txt
        pip install pytest pytest-django coverage
    
    - name: Run backend tests
      run: |
        cd backend
        coverage run -m pytest
        coverage report
    
    - name: Run frontend tests
      run: |
        cd frontend/medhabangla
        npm install
        npm test -- --watchAll=false
    
    - name: Run security tests
      run: |
        # Run OWASP ZAP scan
        docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:8000
```

## Test Data Management

### Factory Functions

```python
# factories.py
import factory
from accounts.models import User
from quizzes.models import Quiz, QuizAttempt

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    class_level = factory.Iterator([6, 7, 8, 9, 10, 11, 12])

class QuizFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Quiz
    
    subject = factory.Iterator(['math', 'physics', 'chemistry', 'biology'])
    class_target = factory.Iterator([6, 7, 8, 9, 10, 11, 12])
    difficulty = factory.Iterator(['easy', 'medium', 'hard'])
    question_text = factory.Faker('sentence')
    options = {'A': 'Option A', 'B': 'Option B', 'C': 'Option C', 'D': 'Option D'}
    correct_answer = 'A'

class QuizAttemptFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = QuizAttempt
    
    user = factory.SubFactory(UserFactory)
    quiz = factory.SubFactory(QuizFactory)
    selected_answer = factory.Iterator(['A', 'B', 'C', 'D'])
    is_correct = factory.Iterator([True, False])
```

## Test Coverage Goals

### Minimum Coverage Requirements
- **Backend**: 80% code coverage
- **Frontend**: 70% code coverage
- **Critical Paths**: 100% coverage

### Coverage Measurement

```bash
# Backend coverage
cd backend
coverage run -m pytest
coverage report
coverage html  # Generate HTML report

# Frontend coverage
cd frontend/medhabangla
npm test -- --coverage
```

## Continuous Testing

### Pre-commit Hooks

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: backend-tests
        name: Run backend tests
        entry: bash -c 'cd backend && python -m pytest'
        language: system
        types: [python]
      
      - id: frontend-tests
        name: Run frontend tests
        entry: bash -c 'cd frontend/medhabangla && npm test -- --watchAll=false'
        language: system
        types: [javascript, jsx, ts, tsx]
```

### Monitoring Test Results

```python
# test_monitoring.py
import logging
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

def monitor_test_results(test_results):
    """Monitor test results and alert on failures"""
    if test_results.failures > 0:
        logger.error(f"Test suite failed with {test_results.failures} failures")
        send_alert_email(test_results)
    else:
        logger.info("All tests passed successfully")

def send_alert_email(test_results):
    """Send alert email on test failures"""
    subject = "MedhaBangla Test Suite Failure"
    message = f"""
    Test suite failed with the following issues:
    - Failures: {test_results.failures}
    - Errors: {test_results.errors}
    - Duration: {test_results.duration}
    
    Please check the CI/CD pipeline for details.
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email='alerts@medhabangla.edu.bd',
        recipient_list=['dev-team@medhabangla.edu.bd']
    )
```

## Conclusion

The testing strategy for MedhaBangla ensures comprehensive coverage of all application layers, from individual components to complete user workflows. By following this approach, we can maintain high quality and reliability while continuously delivering new features to Bangladeshi students.

Regular review and updates to the test suite will ensure it continues to meet the evolving needs of the platform and its users.