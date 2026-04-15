#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Installation Verification Script (বাংলায়)
এই script আপনার PC তে Celery এবং Redis সঠিকভাবে install হয়েছে কিনা check করবে
"""

import sys

def print_bangla(message, status="info"):
    """বাংলায় message print করার function"""
    colors = {
        "success": "\033[92m✅",  # Green
        "error": "\033[91m❌",    # Red
        "warning": "\033[93m⚠️",  # Yellow
        "info": "\033[94mℹ️",     # Blue
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')} {message}{reset}")

def check_python():
    """Python version check"""
    print_bangla(f"Python Version: {sys.version.split()[0]}", "success")
    return True

def check_celery():
    """Celery installation check"""
    try:
        import celery
        print_bangla(f"Celery Install আছে - Version: {celery.__version__}", "success")
        return True
    except ImportError:
        print_bangla("Celery Install নেই! Install করুন: pip install celery", "error")
        return False

def check_redis_client():
    """Redis Python client check"""
    try:
        import redis
        print_bangla(f"Redis Python Client Install আছে - Version: {redis.__version__}", "success")
        return True
    except ImportError:
        print_bangla("Redis Python Client Install নেই! Install করুন: pip install redis", "error")
        return False

def check_redis_server():
    """Redis server connection check"""
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, socket_connect_timeout=2)
        r.ping()
        print_bangla("Redis Server চালু আছে এবং কাজ করছে!", "success")
        
        # Redis info দেখান
        info = r.info()
        print_bangla(f"  └─ Redis Version: {info.get('redis_version', 'Unknown')}", "info")
        print_bangla(f"  └─ Used Memory: {info.get('used_memory_human', 'Unknown')}", "info")
        return True
    except Exception as e:
        print_bangla("Redis Server চালু নেই বা connection করতে পারছে না!", "error")
        print_bangla(f"  └─ Error: {str(e)}", "warning")
        print_bangla("\n📝 Redis Server Start করার উপায়:", "info")
        print_bangla("  1. Docker: docker run -d -p 6379:6379 redis:alpine", "info")
        print_bangla("  2. WSL: sudo service redis-server start", "info")
        print_bangla("  3. Memurai (Windows): net start Memurai", "info")
        return False

def check_channels_redis():
    """Django Channels Redis check"""
    try:
        import channels_redis
        print_bangla("channels_redis Install আছে (Django WebSocket এর জন্য)", "success")
        return True
    except ImportError:
        print_bangla("channels_redis Install নেই (optional)", "warning")
        return False

def check_django_celery_beat():
    """Django Celery Beat check"""
    try:
        import django_celery_beat
        print_bangla("django-celery-beat Install আছে (Scheduled Tasks এর জন্য)", "success")
        return True
    except ImportError:
        print_bangla("django-celery-beat Install নেই (optional)", "warning")
        return False

def main():
    """Main verification function"""
    print("\n" + "="*60)
    print_bangla("🔍 Installation Verification শুরু হচ্ছে...", "info")
    print("="*60 + "\n")
    
    results = {
        "Python": check_python(),
        "Celery": check_celery(),
        "Redis Client": check_redis_client(),
        "Redis Server": check_redis_server(),
        "Channels Redis": check_channels_redis(),
        "Django Celery Beat": check_django_celery_beat(),
    }
    
    print("\n" + "="*60)
    print_bangla("📊 সারাংশ (Summary):", "info")
    print("="*60)
    
    for name, status in results.items():
        status_text = "✅ কাজ করছে" if status else "❌ সমস্যা আছে"
        print(f"  {name}: {status_text}")
    
    print("\n" + "="*60)
    
    # Final verdict
    critical_checks = ["Python", "Celery", "Redis Client", "Redis Server"]
    all_critical_passed = all(results[check] for check in critical_checks if check in results)
    
    if all_critical_passed:
        print_bangla("🎉 সব কিছু সঠিকভাবে Install এবং কাজ করছে!", "success")
    else:
        print_bangla("⚠️ কিছু সমস্যা আছে। উপরের নির্দেশনা অনুসরণ করুন।", "warning")
    
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
