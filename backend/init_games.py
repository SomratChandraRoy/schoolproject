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

# Define the three games from the specifications
games_data = [
    {
        'game_type': 'memory_pattern',
        'name': 'Memory Pattern',
        'description': 'Watch and repeat the color pattern. Test your memory skills!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 100,
        'is_active': True
    },
    {
        'game_type': 'ship_find',
        'name': 'Ship Find',
        'description': 'Find all hidden ships on the grid. A memory-based battleship game!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 150,
        'is_active': True
    },
    {
        'game_type': 'number_hunt',
        'name': 'Number Hunt',
        'description': 'Click numbers in sequential order. Test your memory and speed!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 120,
        'is_active': True
    },
    {
        'game_type': 'image_dragger',
        'name': 'Image Dragger',
        'description': 'Drag puzzle pieces into the right place before the timer ends.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 180,
        'is_active': True
    },
]

print("🎮 Initializing games in database...")
print("=" * 50)

for game_data in games_data:
    game, created = Game.objects.get_or_create(
        game_type=game_data['game_type'],
        defaults=game_data
    )
    
    if created:
        print(f"✅ Created: {game.name} ({game.game_type})")
    else:
        print(f"ℹ️  Already exists: {game.name} ({game.game_type})")

print("=" * 50)
print(f"✅ Total games in database: {Game.objects.count()}")
print("\n🚀 Games initialization complete!")
print("\nNext steps:")
print("1. Start backend: python manage.py runserver")
print("2. Start frontend: cd ../frontend/medhabangla && npm run dev")
print("3. Visit: http://localhost:5173/games")
