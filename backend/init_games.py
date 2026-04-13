#!/usr/bin/env python
"""
Initialize games in the database
Run this after setting USE_SQLITE=True and running migrations
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from games.models import Game

# Define active games for the Games Hub
games_data = [
    {
        'game_type': 'image_dragger',
        'name': 'Image Dragger',
        'description': 'Drag puzzle pieces into the right place before the timer ends.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 180,
        'is_active': True
    },
    {
        'game_type': 'math_quiz',
        'name': 'MathRush',
        'description': 'Solve endless math challenges as fast as you can in a polished game UI.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 150,
        'is_active': True
    },
    {
        'game_type': 'molecular_memory_mechanics',
        'name': 'Molecular Memory & Mechanics',
        'description': 'Play the live molecular memory and mechanics challenge hosted on a dedicated subdomain.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 170,
        'is_active': True
    },
]

removed_games = ['memory_pattern', 'ship_find', 'number_hunt']

print("🎮 Initializing games in database...")
print("=" * 50)

for game_data in games_data:
    game, created = Game.objects.update_or_create(
        game_type=game_data['game_type'],
        defaults=game_data
    )

    if created:
        print(f"✅ Created: {game.name} ({game.game_type})")
    else:
        print(f"♻️ Updated: {game.name} ({game.game_type})")

deactivated = Game.objects.filter(game_type__in=removed_games, is_active=True).update(is_active=False)
if deactivated:
    print(f"🚫 Deactivated removed games: {deactivated}")

print("=" * 50)
print(f"✅ Total games in database: {Game.objects.count()}")
print("\n🚀 Games initialization complete!")
print("\nNext steps:")
print("1. Start backend: python manage.py runserver")
print("2. Start frontend: cd ../frontend/medhabangla && npm run dev")
print("3. Visit: http://localhost:5173/games")
