"""
Management command to load initial dictionary data
Run with: python manage.py load_dictionary
"""

import json
from django.core.management.base import BaseCommand
from translator.models import TranslationDictionary


SAMPLE_DICTIONARY = [
    # Greetings
    {'s': 'hello', 't': 'হ্যালো', 'w': 'interjection', 'm': 'A polite greeting', 'e': 'Hello, how are you?', 'eb': 'হ্যালো, আপনি কেমন আছেন?', 'd': 1},
    {'s': 'goodbye', 't': 'আলবিদা', 'w': 'noun', 'm': 'Farewell greeting', 'e': 'Goodbye, see you later!', 'eb': 'আলবিদা, পরে দেখা হবে!', 'd': 1},
    {'s': 'thank you', 't': 'ধন্যবাদ', 'w': 'phrase', 'm': 'Expression of gratitude', 'e': 'Thank you for your help', 'eb': 'আপনার সাহায্যের জন্য ধন্যবাদ', 'd': 1},
    
    # Science
    {'s': 'photosynthesis', 't': 'সালোকসংশ্লেষণ', 'w': 'noun', 'm': 'Process by which plants convert light to energy', 'e': 'Plants use photosynthesis to produce glucose', 'eb': 'উদ্ভিদ গ্লুকোজ উৎপাদনে সালোকসংশ্লেষণ ব্যবহার করে', 'd': 4, 'c': 'science'},
    {'s': 'atom', 't': 'পরমাণু', 'w': 'noun', 'm': 'Smallest unit of matter', 'e': 'An atom is composed of electrons, protons, and neutrons', 'eb': 'একটি পরমাণু ইলেকট্রন, প্রোটন এবং নিউট্রন দিয়ে গঠিত', 'd': 3, 'c': 'physics'},
    {'s': 'molecule', 't': 'অণু', 'w': 'noun', 'm': 'Two or more atoms chemically bonded', 'e': 'A water molecule consists of two hydrogen atoms and one oxygen atom', 'eb': 'একটি জল অণু দুটি হাইড্রোজেন পরমাণু এবং একটি অক্সিজেন পরমাণু নিয়ে গঠিত', 'd': 3, 'c': 'chemistry'},
    {'s': 'gravity', 't': 'মহাকর্ষ', 'w': 'noun', 'm': 'Force that attracts objects toward Earth', 'e': 'Gravity keeps us on the ground', 'eb': 'মহাকর্ষ আমাদের মাটিতে রাখে', 'd': 2, 'c': 'physics'},
    
    # Mathematics
    {'s': 'equation', 't': 'সমীকরণ', 'w': 'noun', 'm': 'Mathematical statement asserting equality', 'e': 'Solve the equation: 2x + 5 = 13', 'eb': 'সমীকরণ সমাধান করুন: 2x + 5 = 13', 'd': 2, 'c': 'mathematics'},
    {'s': 'algorithm', 't': 'অ্যালগরিদম', 'w': 'noun', 'm': 'Step-by-step procedure to solve a problem', 'e': 'An algorithm is a finite sequence of well-defined steps', 'eb': 'একটি অ্যালগরিদম সুসংজ্ঞায়িত পদক্ষেপের একটি সীমিত সিরিজ', 'd': 4, 'c': 'computer_science'},
    {'s': 'geometry', 't': 'জ্যামিতি', 'w': 'noun', 'm': 'Branch of mathematics concerned with shapes', 'e': 'Geometry studies properties and relationships of shapes', 'eb': 'জ্যামিতি আকৃতির বৈশিষ্ট্য এবং সম্পর্ক অধ্যয়ন করে', 'd': 2, 'c': 'mathematics'},
    
    # Literature
    {'s': 'metaphor', 't': 'রূপক', 'w': 'noun', 'm': 'Figure of speech comparing two unlike things', 'e': 'Time is money is a common metaphor', 'eb': 'সময় টাকা একটি সাধারণ রূপক', 'd': 3, 'c': 'literature'},
    {'s': 'simile', 't': 'উপমা', 'w': 'noun', 'm': 'Comparison using like or as', 'e': 'She is as bright as a diamond', 'eb': 'তিনি একটি হীরার মতো উজ্জ্বল', 'd': 3, 'c': 'literature'},
    {'s': 'protagonist', 't': 'প্রধান চরিত্র', 'w': 'noun', 'm': 'Main character in a story', 'e': 'The protagonist of the novel faces many challenges', 'eb': 'উপন্যাসের প্রধান চরিত্র অনেক চ্যালেঞ্জের মুখোমুখি হয়', 'd': 3, 'c': 'literature'},
    
    # Daily use
    {'s': 'water', 't': 'পানি', 'w': 'noun', 'm': 'Transparent liquid essential for life', 'e': 'Drink plenty of water daily', 'eb': 'প্রতিদিন প্রচুর পানি পান', 'd': 1, 'c': 'daily_use'},
    {'s': 'food', 't': 'খাবার', 'w': 'noun', 'm': 'Substance consumed for nutrition', 'e': 'This food is delicious', 'eb': 'এই খাবার সুস্বাদু', 'd': 1, 'c': 'daily_use'},
    {'s': 'school', 't': 'স্কুল', 'w': 'noun', 'm': 'Institution for education', 'e': 'I go to school every day', 'eb': 'আমি প্রতিদিন স্কুলে যাই', 'd': 1, 'c': 'education'},
    {'s': 'teacher', 't': 'শিক্ষক', 'w': 'noun', 'm': 'Person who educates students', 'e': 'My teacher is very kind', 'eb': 'আমার শিক্ষক খুবই দয়ালু', 'd': 1, 'c': 'education'},
    {'s': 'book', 't': 'বই', 'w': 'noun', 'm': 'Set of printed pages bound together', 'e': 'I like reading books', 'eb': 'আমি বই পড়তে পছন্দ করি', 'd': 1, 'c': 'education'},
]


class Command(BaseCommand):
    help = 'Load initial dictionary data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing dictionary before loading',
        )

    def handle(self, *args, **options):
        if options['clear']:
            TranslationDictionary.objects.all().delete()
            self.stdout.write(self.style.WARNING('✓ Cleared existing dictionary'))

        created_count = 0
        for entry in SAMPLE_DICTIONARY:
            try:
                obj, created = TranslationDictionary.objects.get_or_create(
                    source_text=entry['s'],
                    source_language='en',
                    target_language='bn',
                    defaults={
                        'target_text': entry['t'],
                        'word_type': entry.get('w', ''),
                        'meaning': entry.get('m', ''),
                        'example_english': entry.get('e', ''),
                        'example_bangla': entry.get('eb', ''),
                        'context': entry.get('c', 'general'),
                        'difficulty_level': entry.get('d', 1),
                        'is_verified': True,
                        'created_by': 'import',
                    }
                )
                if created:
                    created_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Error creating {entry["s"]}: {e}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Successfully loaded {created_count} dictionary entries'
            )
        )
