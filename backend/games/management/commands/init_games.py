from django.core.management.base import BaseCommand
from games.models import Game, Achievement


class Command(BaseCommand):
    help = 'Initialize games and achievements'

    def handle(self, *args, **kwargs):
        # Create games
        games_data = [
            {
                'game_type': 'memory_pattern',
                'name': 'Memory Pattern',
                'description': 'Remember and repeat the pattern of colors. Test your memory skills!',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 100
            },
            {
                'game_type': 'memory_matrix',
                'name': 'Memory Matrix',
                'description': 'Test your memory skills by remembering patterns in a grid',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 100
            },
            {
                'game_type': 'math_quiz',
                'name': 'Math Challenge',
                'description': 'Solve math problems as fast as you can. Sharpen your calculation skills!',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 150
            },
            {
                'game_type': 'equation_storm',
                'name': 'Equation Storm',
                'description': 'Solve math equations as fast as you can',
                'min_grade': 8,
                'max_grade': 12,
                'base_points': 150
            },
            {
                'game_type': 'word_puzzle',
                'name': 'Word Puzzle',
                'description': 'Find words in the puzzle grid. Expand your vocabulary!',
                'min_grade': 6,
                'max_grade': 10,
                'base_points': 120
            },
            {
                'game_type': 'pattern_matching',
                'name': 'Pattern Match',
                'description': 'Match the patterns quickly. Improve your pattern recognition!',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 100
            },
            {
                'game_type': 'pathfinder',
                'name': 'Pathfinder',
                'description': 'Find the optimal path through a maze',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 120
            },
            {
                'game_type': 'infinite_loop',
                'name': 'Infinite Loop',
                'description': 'A challenging puzzle game that\'s hard to beat',
                'min_grade': 9,
                'max_grade': 12,
                'base_points': 150
            }
        ]
        
        for game_data in games_data:
            game, created = Game.objects.get_or_create(
                game_type=game_data['game_type'],
                defaults=game_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created game: {game.name}'))
            else:
                self.stdout.write(f'Game already exists: {game.name}')
        
        # Create achievements
        achievements_data = [
            {'code': 'LEVEL_5', 'name': 'Level 5 Master', 'description': 'Reach level 5 in any game', 'icon': '🏆', 'points': 50, 'criteria': {'type': 'level', 'value': 5}},
            {'code': 'LEVEL_10', 'name': 'Level 10 Master', 'description': 'Reach level 10 in any game', 'icon': '🥇', 'points': 100, 'criteria': {'type': 'level', 'value': 10}},
            {'code': 'LEVEL_20', 'name': 'Level 20 Master', 'description': 'Reach level 20 in any game', 'icon': '👑', 'points': 200, 'criteria': {'type': 'level', 'value': 20}},
            {'code': 'STREAK_5', 'name': '5 Win Streak', 'description': 'Win 5 games in a row', 'icon': '🔥', 'points': 75, 'criteria': {'type': 'streak', 'value': 5}},
            {'code': 'STREAK_10', 'name': '10 Win Streak', 'description': 'Win 10 games in a row', 'icon': '⚡', 'points': 150, 'criteria': {'type': 'streak', 'value': 10}},
            {'code': 'PERFECT_ROUND', 'name': 'Perfect!', 'description': 'Complete a round with 100% accuracy', 'icon': '💯', 'points': 50, 'criteria': {'type': 'accuracy', 'value': 100}},
            {'code': 'FIRST_GAME', 'name': 'First Steps', 'description': 'Play your first game', 'icon': '🎮', 'points': 25, 'criteria': {'type': 'games_played', 'value': 1}},
            {'code': 'GAMES_10', 'name': 'Dedicated Player', 'description': 'Play 10 games', 'icon': '🎯', 'points': 100, 'criteria': {'type': 'games_played', 'value': 10}},
            {'code': 'GAMES_50', 'name': 'Game Master', 'description': 'Play 50 games', 'icon': '🌟', 'points': 250, 'criteria': {'type': 'games_played', 'value': 50}},
        ]
        
        for ach_data in achievements_data:
            achievement, created = Achievement.objects.get_or_create(
                code=ach_data['code'],
                defaults=ach_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created achievement: {achievement.name}'))
            else:
                self.stdout.write(f'Achievement already exists: {achievement.name}')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Successfully initialized games and achievements!'))
