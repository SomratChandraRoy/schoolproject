#!/usr/bin/env python
"""
Quick script to check if database is working
Run: python check_database.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.db import connection
from django.core.exceptions import ImproperlyConfigured
from accounts.models import User
from chat.models import ChatRoom, Message

def check_database():
    """Check if database connection is working"""
    print("=" * 60)
    print("DATABASE CONNECTION CHECK")
    print("=" * 60)
    
    # Check connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result[0] == 1:
                print("✅ Database connection: SUCCESS")
            else:
                print("❌ Database connection: FAILED")
                return False
    except Exception as e:
        print(f"❌ Database connection: FAILED")
        print(f"   Error: {e}")
        return False
    
    # Check database type
    db_engine = connection.settings_dict['ENGINE']
    if 'sqlite' in db_engine:
        print(f"📊 Database type: SQLite")
        print(f"   Location: {connection.settings_dict['NAME']}")
    elif 'postgresql' in db_engine:
        print(f"📊 Database type: PostgreSQL")
        print(f"   Host: {connection.settings_dict['HOST']}")
        print(f"   Database: {connection.settings_dict['NAME']}")
    else:
        print(f"📊 Database type: {db_engine}")
    
    print()
    
    # Check tables exist
    print("=" * 60)
    print("TABLE CHECK")
    print("=" * 60)
    
    tables_to_check = [
        ('accounts_user', 'Users'),
        ('chat_chatroom', 'Chat Rooms'),
        ('chat_message', 'Messages'),
    ]
    
    with connection.cursor() as cursor:
        for table_name, display_name in tables_to_check:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"✅ {display_name}: {count} records")
            except Exception as e:
                print(f"❌ {display_name}: Table not found or error")
                print(f"   Error: {e}")
    
    print()
    
    # Check users
    print("=" * 60)
    print("USER CHECK")
    print("=" * 60)
    
    try:
        total_users = User.objects.count()
        member_users = User.objects.filter(is_member=True).count()
        print(f"✅ Total users: {total_users}")
        print(f"✅ Member users: {member_users}")
        
        if member_users > 0:
            print("\n   Member users:")
            for user in User.objects.filter(is_member=True)[:5]:
                print(f"   - {user.username} ({user.first_name} {user.last_name})")
        else:
            print("⚠️  No member users found!")
            print("   Go to Admin Dashboard → Member Management to enable members")
    except Exception as e:
        print(f"❌ Error checking users: {e}")
    
    print()
    
    # Check chat rooms
    print("=" * 60)
    print("CHAT ROOM CHECK")
    print("=" * 60)
    
    try:
        total_rooms = ChatRoom.objects.count()
        print(f"✅ Total chat rooms: {total_rooms}")
        
        if total_rooms > 0:
            print("\n   Recent chat rooms:")
            for room in ChatRoom.objects.all()[:5]:
                print(f"   - Room {room.id}: {room.participant1.username} ↔ {room.participant2.username}")
        else:
            print("ℹ️  No chat rooms yet (will be created when users start chatting)")
    except Exception as e:
        print(f"❌ Error checking chat rooms: {e}")
    
    print()
    
    # Check messages
    print("=" * 60)
    print("MESSAGE CHECK")
    print("=" * 60)
    
    try:
        total_messages = Message.objects.count()
        print(f"✅ Total messages: {total_messages}")
        
        if total_messages > 0:
            print("\n   Recent messages:")
            for msg in Message.objects.all().order_by('-created_at')[:5]:
                content_preview = msg.content[:50] if msg.content else '[File]'
                print(f"   - {msg.sender.username}: {content_preview}")
        else:
            print("ℹ️  No messages yet")
    except Exception as e:
        print(f"❌ Error checking messages: {e}")
    
    print()
    
    # Check connection pool
    print("=" * 60)
    print("CONNECTION POOL CHECK")
    print("=" * 60)
    
    if 'postgresql' in db_engine:
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        count(*) as total_connections,
                        count(*) FILTER (WHERE state = 'active') as active,
                        count(*) FILTER (WHERE state = 'idle') as idle
                    FROM pg_stat_activity
                    WHERE datname = current_database()
                """)
                result = cursor.fetchone()
                total, active, idle = result
                print(f"✅ Total connections: {total}")
                print(f"   Active: {active}")
                print(f"   Idle: {idle}")
                
                if total > 50:
                    print("⚠️  High connection count! Consider:")
                    print("   - Reducing polling frequency")
                    print("   - Using SQLite for development")
                    print("   - Running: python manage.py kill_idle_connections")
        except Exception as e:
            print(f"⚠️  Could not check connections: {e}")
    else:
        print("ℹ️  Connection pooling check only available for PostgreSQL")
    
    print()
    print("=" * 60)
    print("CHECK COMPLETE")
    print("=" * 60)
    
    return True

if __name__ == '__main__':
    try:
        success = check_database()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nCheck cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
