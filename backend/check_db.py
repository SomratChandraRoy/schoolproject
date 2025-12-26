import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%game%'")
tables = cursor.fetchall()

print('Game-related tables:')
for table in tables:
    print(f'  - {table[0]}')
    
    # Count rows in each table
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
        count = cursor.fetchone()[0]
        print(f'    Rows: {count}')
    except:
        pass

conn.close()
