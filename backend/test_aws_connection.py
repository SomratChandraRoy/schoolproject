#!/usr/bin/env python
"""
Test AWS RDS PostgreSQL Connection
Run with: python test_aws_connection.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.db import connection
from django.conf import settings

def test_connection():
    print("="*60)
    print("🔍 Testing AWS RDS PostgreSQL Connection")
    print("="*60)
    
    # Display configuration
    db_config = settings.DATABASES['default']
    print("\n📋 Database Configuration:")
    print(f"  Engine: {db_config['ENGINE']}")
    print(f"  Database: {db_config['NAME']}")
    print(f"  User: {db_config['USER']}")
    print(f"  Host: {db_config['HOST']}")
    print(f"  Port: {db_config['PORT']}")
    
    # Test connection
    print("\n🔌 Testing connection...")
    try:
        connection.ensure_connection()
        print("✅ Connection successful!")
        
        # Get database info
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"\n📊 PostgreSQL Version:")
            print(f"  {version}")
            
            cursor.execute("SELECT current_database();")
            db_name = cursor.fetchone()[0]
            print(f"\n💾 Current Database: {db_name}")
            
            cursor.execute("""
                SELECT schemaname, tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename;
            """)
            tables = cursor.fetchall()
            print(f"\n📋 Tables in database ({len(tables)}):")
            if tables:
                for schema, table in tables:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
                    count = cursor.fetchone()[0]
                    print(f"  - {table}: {count} rows")
            else:
                print("  No tables yet (run migrations first)")
        
        print("\n" + "="*60)
        print("✅ All tests passed! Database is ready to use.")
        print("="*60)
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed!")
        print(f"Error: {e}")
        print("\n🔧 Troubleshooting:")
        print("  1. Check if RDS instance is running")
        print("  2. Verify security group allows inbound on port 5432")
        print("  3. Check if public access is enabled")
        print("  4. Verify credentials in .env file")
        print("  5. Check if database name exists")
        print("="*60)
        return False

if __name__ == '__main__':
    success = test_connection()
    sys.exit(0 if success else 1)
