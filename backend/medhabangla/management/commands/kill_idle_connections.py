"""
Management command to kill idle database connections
Usage: python manage.py kill_idle_connections
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Kill idle database connections to free up connection slots'

    def add_arguments(self, parser):
        parser.add_argument(
            '--idle-time',
            type=int,
            default=300,
            help='Kill connections idle for more than this many seconds (default: 300)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be killed without actually killing'
        )

    def handle(self, *args, **options):
        idle_time = options['idle_time']
        dry_run = options['dry_run']

        with connection.cursor() as cursor:
            # Get idle connections
            cursor.execute("""
                SELECT 
                    pid,
                    usename,
                    application_name,
                    client_addr,
                    state,
                    state_change,
                    NOW() - state_change AS idle_duration
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND state = 'idle'
                  AND pid <> pg_backend_pid()
                  AND NOW() - state_change > interval '%s seconds'
                ORDER BY state_change;
            """, [idle_time])

            idle_connections = cursor.fetchall()

            if not idle_connections:
                self.stdout.write(self.style.SUCCESS(
                    f'No idle connections found (idle > {idle_time}s)'
                ))
                return

            self.stdout.write(self.style.WARNING(
                f'Found {len(idle_connections)} idle connections:'
            ))

            for conn in idle_connections:
                pid, user, app, addr, state, state_change, duration = conn
                self.stdout.write(
                    f'  PID {pid}: {user}@{addr} ({app}) - idle for {duration}'
                )

            if dry_run:
                self.stdout.write(self.style.WARNING(
                    '\nDry run mode - no connections killed'
                ))
                return

            # Kill idle connections
            killed = 0
            for conn in idle_connections:
                pid = conn[0]
                try:
                    cursor.execute('SELECT pg_terminate_backend(%s)', [pid])
                    killed += 1
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f'Failed to kill PID {pid}: {e}'
                    ))

            self.stdout.write(self.style.SUCCESS(
                f'\nKilled {killed} idle connections'
            ))
