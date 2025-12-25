#!/usr/bin/env python
"""
Quick script to diagnose and fix database connection issues
Run this when you encounter connection pool exhaustion errors
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.db import connection
from django.conf import settings
import psycopg2


def main():
    print("=" * 80)
    print("🔧 Database Connection Diagnostic Tool")
    print("=" * 80)
    
    db_config = settings.DATABASES['default']
    
    print(f"\n📋 Configuration:")
    print(f"  Database: {db_config['NAME']}")
    print(f"  Host: {db_config['HOST']}")
    print(f"  User: {db_config['USER']}")
    print(f"  CONN_MAX_AGE: {db_config.get('CONN_MAX_AGE', 'Not set')}")
    
    try:
        with connection.cursor() as cursor:
            # Get connection stats
            cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = %s;", [db_config['NAME']])
            total = cursor.fetchone()[0]
            
            cursor.execute("SHOW max_connections;")
            max_conn = int(cursor.fetchone()[0])
            
            cursor.execute("""
                SELECT count(*) FROM pg_stat_activity 
                WHERE datname = %s AND state = 'idle' 
                AND state_change < NOW() - INTERVAL '5 minutes';
            """, [db_config['NAME']])
            idle = cursor.fetchone()[0]
            
            usage = (total / max_conn) * 100
            
            print(f"\n📊 Status:")
            print(f"  Total connections: {total}/{max_conn}")
            print(f"  Usage: {usage:.1f}%")
            print(f"  Idle (>5 min): {idle}")
            
            # Determine action
            if usage > 80:
                print(f"\n⚠️  CRITICAL: Connection usage is {usage:.1f}%!")
                print("\n🔧 Recommended actions:")
                print("  1. Kill idle connections (run with --kill-idle)")
                print("  2. Restart backend server")
                print("  3. Check for multiple running processes")
                
                response = input("\n❓ Kill idle connections now? (yes/no): ")
                if response.lower() in ['yes', 'y']:
                    cursor.execute("""
                        SELECT pg_terminate_backend(pid)
                        FROM pg_stat_activity
                        WHERE datname = %s
                        AND state = 'idle'
                        AND state_change < NOW() - INTERVAL '5 minutes'
                        AND pid != pg_backend_pid();
                    """, [db_config['NAME']])
                    killed = cursor.rowcount
                    print(f"\n✅ Killed {killed} idle connections")
                    
                    # Check again
                    cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = %s;", [db_config['NAME']])
                    new_total = cursor.fetchone()[0]
                    new_usage = (new_total / max_conn) * 100
                    print(f"  New usage: {new_usage:.1f}% ({new_total}/{max_conn})")
                    
            elif usage > 50:
                print(f"\n⚠️  WARNING: Connection usage is {usage:.1f}%")
                print("  Monitor closely and consider restarting backend soon")
                
            else:
                print(f"\n✅ Connection usage is healthy ({usage:.1f}%)")
            
            # Show recent connections
            print(f"\n🔍 Recent connections:")
            cursor.execute("""
                SELECT pid, usename, state, NOW() - state_change as idle_time
                FROM pg_stat_activity 
                WHERE datname = %s
                ORDER BY state_change DESC
                LIMIT 5;
            """, [db_config['NAME']])
            
            print(f"  {'PID':<8} {'User':<15} {'State':<12} {'Idle Time'}")
            print("  " + "-" * 60)
            for row in cursor.fetchall():
                pid, user, state, idle_time = row
                idle_str = str(idle_time).split('.')[0] if idle_time else 'N/A'
                print(f"  {pid:<8} {user:<15} {state or 'N/A':<12} {idle_str}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("  1. Check if database is accessible")
        print("  2. Verify .env file has correct credentials")
        print("  3. Check AWS RDS security groups")
        print("  4. Try: python manage.py check_db_connections")
        return 1
    
    print("\n" + "=" * 80)
    print("For more details, run: python manage.py check_db_connections")
    print("=" * 80)
    return 0


if __name__ == '__main__':
    sys.exit(main())
