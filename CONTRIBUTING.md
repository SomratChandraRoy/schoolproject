# Contributing to MedhaBangla

Thank you for your interest in contributing to MedhaBangla! We welcome contributions from the community to help improve this educational platform for Bangladeshi students.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive environment for all contributors.

## How to Contribute

There are many ways to contribute to MedhaBangla:

1. **Report Bugs**: Help us identify issues by submitting detailed bug reports
2. **Suggest Features**: Propose new features or improvements to existing functionality
3. **Write Code**: Contribute bug fixes, new features, or improvements
4. **Improve Documentation**: Help clarify and expand our documentation
5. **Translate Content**: Assist with localization efforts for Bangla and other languages
6. **Test Features**: Participate in beta testing and provide feedback
7. **Review Code**: Help review pull requests from other contributors

## Getting Started

### Prerequisites

Before you begin contributing, ensure you have:

1. **Git** installed on your system
2. **Docker** and **Docker Compose** for running the development environment
3. **Node.js** (v16 or higher) for frontend development
4. **Python** (3.11 or higher) for backend development
5. **Code Editor** of your choice (VS Code, PyCharm, etc.)

### Development Setup

1. **Fork the Repository**
   - Click the "Fork" button at the top right of the repository page
   - Clone your forked repository:
     ```bash
     git clone https://github.com/your-username/medhabangla.git
     cd medhabangla
     ```

2. **Set Up Backend Development Environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   ```

3. **Set Up Frontend Development Environment**
   ```bash
   cd frontend/medhabangla
   npm install
   ```

4. **Run Development Servers**
   ```bash
   # In backend directory
   python manage.py runserver
   
   # In frontend/medhabangla directory (new terminal)
   npm run dev
   ```

5. **Run with Docker (Alternative)**
   ```bash
   # From root directory
   docker-compose up --build
   ```

## Development Workflow

### Branching Strategy

We follow the GitFlow branching model:

1. **Main Branch**: Production-ready code
2. **Develop Branch**: Integration branch for features
3. **Feature Branches**: Individual feature development
4. **Hotfix Branches**: Urgent production fixes
5. **Release Branches**: Preparation for releases

### Creating a Feature Branch

```bash
# Ensure you're on the develop branch
git checkout develop
git pull origin develop

# Create a new feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Commit your changes
git add .
git commit -m "Add feature: brief description of changes"

# Push to your fork
git push origin feature/your-feature-name
```

### Pull Request Process

1. **Before Submitting**
   - Ensure your code follows our style guides
   - Write tests for new functionality
   - Update documentation as needed
   - Run the full test suite

2. **Submitting PR**
   - Create PR against the `develop` branch
   - Provide a clear title and description
   - Reference any related issues
   - Request review from maintainers

3. **PR Review Process**
   - Maintainers will review your code
   - Address any feedback or requested changes
   - Once approved, your PR will be merged

## Coding Standards

### Backend (Python/Django)

1. **PEP 8 Compliance**: Follow Python style guidelines
2. **Docstrings**: Document all public functions and classes
3. **Type Hints**: Use type annotations where possible
4. **Django Best Practices**:
   - Use Django's ORM instead of raw SQL
   - Follow Django's app structure
   - Use Django's built-in security features
   - Implement proper error handling

```python
# Good example
def calculate_accuracy(correct_answers: int, total_questions: int) -> float:
    """
    Calculate quiz accuracy percentage.
    
    Args:
        correct_answers (int): Number of correct answers
        total_questions (int): Total number of questions
        
    Returns:
        float: Accuracy percentage (0-100)
        
    Raises:
        ValueError: If total_questions is zero
    """
    if total_questions == 0:
        raise ValueError("Total questions cannot be zero")
    
    return (correct_answers / total_questions) * 100
```

### Frontend (TypeScript/React)

1. **TypeScript**: Use strong typing wherever possible
2. **React Best Practices**:
   - Use functional components with hooks
   - Implement proper state management
   - Follow component composition patterns
   - Use React's built-in optimization techniques

```typescript
// Good example
interface QuizProps {
  quizData: QuizData;
  onComplete: (score: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ quizData, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  
  // Component implementation
  // ...
  
  return (
    <div className="quiz-container">
      {/* JSX implementation */}
    </div>
  );
};
```

### Styling (Tailwind CSS)

1. **Utility-First Approach**: Use Tailwind classes directly
2. **Consistent Spacing**: Follow established spacing system
3. **Responsive Design**: Implement mobile-first responsive design
4. **Dark Mode**: Support both light and dark themes

```jsx
// Good example
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
    {title}
  </h3>
  <p className="text-gray-600 dark:text-gray-300">
    {description}
  </p>
</div>
```

## Testing Guidelines

### Backend Testing

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints and database interactions
3. **Coverage Goal**: Maintain >80% test coverage

```python
# Example test
def test_quiz_creation():
    """Test quiz creation with valid data."""
    quiz_data = {
        'subject': 'math',
        'class_target': 9,
        'difficulty': 'medium',
        'question_text': 'What is 2+2?',
        'options': {'A': '3', 'B': '4', 'C': '5', 'D': '6'},
        'correct_answer': 'B'
    }
    
    quiz = Quiz.objects.create(**quiz_data)
    
    assert quiz.subject == 'math'
    assert quiz.class_target == 9
    assert quiz.correct_answer == 'B'
```

### Frontend Testing

1. **Component Tests**: Test individual React components
2. **Integration Tests**: Test component interactions
3. **End-to-End Tests**: Test complete user workflows

```javascript
// Example test
import { render, screen, fireEvent } from '@testing-library/react';
import Quiz from './Quiz';

test('allows user to select answer', () => {
  render(<Quiz />);
  
  const optionButton = screen.getByText('Option A');
  fireEvent.click(optionButton);
  
  expect(optionButton).toHaveClass('selected');
});
```

## Documentation Standards

### Code Documentation

1. **Docstrings**: Document all public functions, classes, and modules
2. **Inline Comments**: Explain complex logic or non-obvious code
3. **Type Annotations**: Use type hints for clarity

### User Documentation

1. **README Updates**: Keep README current with setup instructions
2. **API Documentation**: Document all public API endpoints
3. **User Guides**: Create guides for new features

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear Title**: Brief description of the issue
2. **Description**: Detailed explanation of the problem
3. **Steps to Reproduce**: Exact steps to recreate the issue
4. **Expected Behavior**: What you expected to happen
5. **Actual Behavior**: What actually happened
6. **Environment**: Operating system, browser, version info
7. **Screenshots**: Visual evidence if applicable

### Feature Requests

When requesting features, please include:

1. **Clear Title**: Brief description of the feature
2. **Problem Statement**: What problem does this solve?
3. **Proposed Solution**: How should it work?
4. **Alternatives Considered**: Other approaches evaluated
5. **Use Cases**: Who would benefit and why?

## Pull Request Guidelines

### Before Submitting

1. **Code Quality**: Ensure code follows our standards
2. **Tests**: Include tests for new functionality
3. **Documentation**: Update relevant documentation
4. **Commit Messages**: Use clear, descriptive commit messages
5. **Branch Naming**: Use descriptive branch names (feature/, fix/, etc.)

### Commit Message Format

Follow conventional commits format:

```
type(scope): brief description

Detailed description of changes

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/updates
- `chore`: Maintenance tasks

### Example Commits

```
feat(quizzes): add dynamic difficulty leveling

Implement Elo-style difficulty adjustment based on user performance.
Questions increase in difficulty after 80% accuracy on current level.

Fixes #45
```

```
fix(auth): resolve login redirect issue

Fix infinite redirect loop when logging in from protected routes.
Update authentication flow to properly handle redirect URLs.

Closes #78
```

## Community Participation

### Communication Channels

1. **GitHub Issues**: For bug reports and feature requests
2. **GitHub Discussions**: For general discussions and questions
3. **Slack/Discord**: For real-time communication (if available)
4. **Email**: For sensitive or private communications

### Recognition

Contributors are recognized in:

1. **Contributors List**: In README and documentation
2. **Release Notes**: Mention in release announcements
3. **Social Media**: Highlights on official channels
4. **Community Events**: Invitations to contributor events

## License

By contributing to MedhaBangla, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you have any questions about contributing, please:

1. Check existing documentation
2. Open a GitHub issue
3. Contact the maintainers directly

Thank you for helping make MedhaBangla better for Bangladeshi students!