from django.utils import timezone
from datetime import timedelta
import json
import os
from django.db.models import Count
from django.db.models.functions import TruncDay

def environment_callback(request):
    """
    Callback to show environment status on the top right
    """
    is_docker = os.getenv("DOCKER_ENV", "False") == "True"
    
    if os.getenv("DB_HOST"):
        return ["Production", "success"] # success = green
    elif is_docker:
        return ["Docker Local", "warning"] # warning = orange
    else:
        return ["Development", "info"] # info = blue

# Core Apps
from accounts.models import User
from quizzes.models import QuizAttempt
from ai.models import AIChatSession
from games.models import GameSession
from books.models import Book
from chat.models import Message

def dashboard_callback(request, context):
    now = timezone.now()
    week_ago = now - timedelta(days=7)

    # Collect KPIs
    kpis = [
        {
            "title": "Total Users",
            "metric": User.objects.count(),
            "footer": f"{User.objects.filter(date_joined__gte=week_ago).count()} added this week"
        },
        {
            "title": "Total Quizzes",
            "metric": QuizAttempt.objects.count(),
            "footer": f"{QuizAttempt.objects.filter(attempted_at__gte=week_ago).count()} this week"
        },
        {
            "title": "AI Sessions Active",
            "metric": AIChatSession.objects.count(),
            "footer": f"{AIChatSession.objects.filter(created_at__gte=week_ago).count()} this week"
        },
        {
            "title": "Total Games Played",
            "metric": GameSession.objects.count(),
            "footer": f"{GameSession.objects.filter(started_at__gte=week_ago).count()} this week"
        },
        {
            "title": "Chat Messages Sent",
            "metric": Message.objects.count(),
            "footer": f"{Message.objects.filter(created_at__gte=week_ago).count()} this week"
        },
        {
            "title": "Library Books Available",
            "metric": Book.objects.count(),
            "footer": f"From {Book.objects.values('class_level').distinct().count()} Classes"
        }
    ]

    # Chart data logic - Last 7 Days dates
    days = [(week_ago + timedelta(days=i)).strftime('%m/%d') for i in range(8)] 

    # Users Chart Data
    user_data = User.objects.filter(date_joined__gte=week_ago)\
        .annotate(day=TruncDay('date_joined'))\
        .values('day')\
        .annotate(count=Count('id'))\
        .order_by('day')
    counts_dict = {d['day'].strftime('%m/%d'): d['count'] for d in user_data if d['day']}
    users_chart = {
        "labels": days,
        "datasets": [{
            "label": "New Users",
            "data": [counts_dict.get(d, 0) for d in days],
            "backgroundColor": "#3b82f6",
            "borderColor": "#3b82f6",
        }]
    }

    # Quizzes Chart Data
    quiz_data = QuizAttempt.objects.filter(attempted_at__gte=week_ago)\
        .annotate(day=TruncDay('attempted_at'))\
        .values('day')\
        .annotate(count=Count('id'))\
        .order_by('day')
    quiz_counts_dict = {d['day'].strftime('%m/%d'): d['count'] for d in quiz_data if d['day']}
    quiz_chart = {
        "labels": days,
        "datasets": [{
            "label": "Quiz Attempts",
            "data": [quiz_counts_dict.get(d, 0) for d in days],
            "backgroundColor": "#10b981",
            "borderColor": "#10b981",
        }]
    }

    # AI Sessions Chart
    ai_data = AIChatSession.objects.filter(created_at__gte=week_ago)\
        .annotate(day=TruncDay('created_at')).values('day').annotate(count=Count('id')).order_by('day')
    ai_counts_dict = {d['day'].strftime('%m/%d'): d['count'] for d in ai_data if d['day']}
    ai_chart = {
        "labels": days,
        "datasets": [{
            "label": "AI Chat Sessions",
            "data": [ai_counts_dict.get(d, 0) for d in days],
            "backgroundColor": "#8b5cf6",
            "borderColor": "#8b5cf6",
        }]
    }

    # Games Chart
    games_data = GameSession.objects.filter(started_at__gte=week_ago)\
        .annotate(day=TruncDay('started_at')).values('day').annotate(count=Count('id')).order_by('day')
    games_counts_dict = {d['day'].strftime('%m/%d'): d['count'] for d in games_data if d['day']}
    games_chart = {
        "labels": days,
        "datasets": [{
            "label": "Games Played",
            "data": [games_counts_dict.get(d, 0) for d in days],
            "backgroundColor": "#f59e0b",
            "borderColor": "#f59e0b",
        }]
    }

    context.update({
        "kpi": kpis,
        "users_chart": json.dumps(users_chart),
        "quiz_chart": json.dumps(quiz_chart),
        "ai_chart": json.dumps(ai_chart),
        "games_chart": json.dumps(games_chart),
    })

    return context
