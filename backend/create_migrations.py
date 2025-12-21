#!/usr/bin/env python
"""
Script to create migrations for the updated User model
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medhabangla.settings')
django.setup()

from django.core.management import call_command

print("Creating migrations...")
call_command('makemigrations', 'accounts')
print("Migrations created successfully!")
