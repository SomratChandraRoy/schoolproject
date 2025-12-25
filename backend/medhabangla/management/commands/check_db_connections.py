"""
Management command to check database connection status and diagnose issues
"""
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
import psycopg2


class Command(BaseCommand):
    help = 'Check database connection status and show active connections'

    def add_arguments(self, parser):
        parser.add_argument(
            '--kill-idle',
            action='store_true',
            help='Kill idle connections (use with caution)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Database Connection Status ===\n'))
        
        # Show current Django settings
        db_config = settings.DATABASES['default']
        self.stdout.write(f"Database: {db_config['NAME']}")
        self.stdout.write(f"Host: {db_config['HOST']}")
        self.stdout.write(f"User: {db_config['USER']}")
        self.stdout.write(f"CONN_MAX_AGE: {db_config.get('CONN_MAX_AGE', 'Not set')}")
        self.stdout.write(f"CONN_HEALTH_CHECKS: {db_config.get('CONN_HEALTH_CHECKS', 'Not set')}\n")
        
        try:
            # Query active connections
            with connection.cursor() as cursor:
                # Get total connections
                cursor.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = %s;
                """, [db_config['NAME']])
                total_connections = cursor.fetchone()[0]
                
                # Get max connections
                cursor.execute("SHOW max_connections;")
                max_connections = cursor.fetchone()[0]
                
                # Get connections by state
                cursor.execute("""
                    SELECT state, count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = %s 
                    GROUP BY state;
                """, [db_config['NAME']])
                connections_by_state = cursor.fetchall()
                
                # Get idle connections
                cursor.execute("""
                    SELECT count(*) 
                    FROM pg_stat_activity 
                    WHERE datname = %s 
                    AND state = 'idle' 
                    AND state_change < NOW() - INTERVAL '5 minutes';
                """, [db_config['NAME']])
                idle_connections = cursor.fetchone()[0]
                
                # Display results
                self.stdout.write(self.style.SUCCESS(f"\n📊 Connection Statistics:"))
                self.stdout.write(f"  Total connections: {total_connections}/{max_connections}")
                self.stdout.write(f"  Usage: {(total_connections/int(max_connections)*100):.1f}%")
                
                self.stdout.write(f"\n📈 Connections by state:")
                for state, count in connections_by_state:
                    state_display = state if state else 'NULL'
                    self.stdout.write(f"  {state_display}: {count}")
                
                self.stdout.write(f"\n⏰ Idle connections (>5 min): {idle_connections}")
                
                # Show detailed connection info
                cursor.execute("""
                    SELECT 
                        pid,
                        usename,
                        application_name,
                        client_addr,
                        state,
                        state_change,
                        query_start,
                        NOW() - state_change as idle_time
                    FROM pg_stat_activity 
                    WHERE datname = %s
                    ORDER BY state_change DESC
                    LIMIT 10;
                """, [db_config['NAME']])
                
                connections = cursor.fetchall()
                
                self.stdout.write(f"\n🔍 Recent connections (showing 10):")
                self.stdout.write("-" * 100)
                self.stdout.write(f"{'PID':<8} {'User':<15} {'App':<20} {'State':<12} {'Idle Time'}")
                self.stdout.write("-" * 100)
                
                for conn in connections:
                    pid, user, app, client, state, state_change, query_start, idle_time = conn
                    app_display = (app[:17] + '...') if app and len(app) > 20 else (app or 'N/A')
                    state_display = state if state else 'N/A'
                    idle_display = str(idle_time).split('.')[0] if idle_time else 'N/A'
                    
                    self.stdout.write(f"{pid:<8} {user:<15} {app_display:<20} {state_display:<12} {idle_display}")
                
                # Kill idle connections if requested
                if options['kill_idle']:
                    cursor.execute("""
                        SELECT pg_terminate_backend(pid)
                        FROM pg_stat_activity
                        WHERE datname = %s
                        AND state = 'idle'
                        AND state_change < NOW() - INTERVAL '5 minutes'
                        AND pid != pg_backend_pid();
                    """, [db_config['NAME']])
                    
                    killed = cursor.rowcount
                    self.stdout.write(self.style.WARNING(f"\n⚠️  Killed {killed} idle connections"))
                
                # Warnings
                usage_percent = (total_connections / int(max_connections)) * 100
                if usage_percent > 80:
                    self.stdout.write(self.style.ERROR(
                        f"\n⚠️  WARNING: Connection usage is at {usage_percent:.1f}%!"
                    ))
                    self.stdout.write(self.style.WARNING(
                        "Consider:\n"
                        "  1. Restarting the backend server\n"
                        "  2. Increasing max_connections in RDS\n"
                        "  3. Using connection pooling (PgBouncer)\n"
                        "  4. Reducing CONN_MAX_AGE value"
                    ))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Error: {str(e)}"))
            self.stdout.write(self.style.WARNING(
                "\nTroubleshooting:\n"
                "  1. Check if database is accessible\n"
                "  2. Verify credentials in .env file\n"
                "  3. Check AWS RDS security groups\n"
                "  4. Ensure psycopg2 is installed"
            ))
