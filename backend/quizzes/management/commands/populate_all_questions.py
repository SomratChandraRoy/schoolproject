"""
Management command to populate all questions from A.C.Q/questions.md
"""
from django.core.management.base import BaseCommand
from quizzes.models import Quiz
import json

class Command(BaseCommand):
    help = 'Populate all questions from questions.md file'

    def handle(self, *args, **kwargs):
        # Clear existing questions
        Quiz.objects.all().delete()
        self.stdout.write(self.style.WARNING('Cleared existing questions'))

        questions_data = {
            "class_06": {
                "bangla": [
                    {
                        "type": "mcq",
                        "question": "কোনো অপরিচিত ব্যক্তির সাথে কথা বলার সময় কোন ধরনের ভাষা ব্যবহার করা শ্রেয়?",
                        "options": {"A": "আঞ্চলিক ভাষা", "B": "প্রমিত ভাষা", "C": "সংকেত ভাষা", "D": "বিদেশি ভাষা"},
                        "answer": "প্রমিত ভাষা",
                        "difficulty": "easy"
                    },
                    {
                        "type": "short",
                        "question": "প্রমিত ভাষা বলতে কী বোঝো? দুইটি উদাহরণ দাও।",
                        "answer": "যে ভাষা সর্বজনস্বীকৃত এবং দাপ্তরিক কাজে ব্যবহৃত হয় তাকে প্রমিত ভাষা বলে। যেমন: 'খেয়েছি', 'গিয়েছিলাম'।",
                        "difficulty": "medium"
                    },
                    {
                        "type": "long",
                        "question": "তোমার শ্রেণিকক্ষে একজন নতুন সহপাঠী ভর্তি হয়েছে যে অন্য জেলা থেকে এসেছে এবং তার কথা বুঝতে তোমার সমস্যা হচ্ছে। এ অবস্থায় তুমি তার সাথে কীভাবে যোগাযোগ স্থাপন করবে? একটি কথোপকথন রচনা করো।",
                        "answer": "প্রমিত বাংলা ব্যবহার করে ধীরে ধীরে কথা বলব এবং তার আঞ্চলিক ভাষা বুঝার চেষ্টা করব।",
                        "difficulty": "hard"
                    }
                ],
                "english": [
                    {
                        "type": "mcq",
                        "question": "Which punctuation mark is used to express strong emotion?",
                        "options": {"A": "Full stop (.)", "B": "Comma (,)", "C": "Exclamation mark (!)", "D": "Question mark (?)"},
                        "answer": "Exclamation mark (!)",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "You meet a foreigner at a bookshop who wants to buy a book about Bangladesh but doesn't know which one to pick. Write a dialogue between you and the foreigner helping him choose a book.",
                        "answer": "A dialogue showing polite conversation and book recommendations about Bangladesh.",
                        "difficulty": "hard"
                    }
                ],
                "math": [
                    {
                        "type": "mcq",
                        "question": "রোমান সংখ্যা পদ্ধতিতে 'L' কোন সংখ্যাকে নির্দেশ করে?",
                        "options": {"A": "১০", "B": "৫০", "C": "১০০", "D": "৫০০"},
                        "answer": "৫০",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "একটি আয়তাকার বাগানের দৈর্ঘ্য ৪০ মিটার এবং প্রস্থ ৩০ মিটার। ১. বাগানটির পরিসীমা নির্ণয় করো। ২. বাগানটির ক্ষেত্রফল কত? ৩. বাগানের মাঝখান দিয়ে দৈর্ঘ্য ও প্রস্থ বরাবর ২ মিটার চওড়া রাস্তা থাকলে রাস্তার ক্ষেত্রফল নির্ণয় করো।",
                        "answer": "১. পরিসীমা = ২(৪০+৩০) = ১৪০ মিটার। ২. ক্ষেত্রফল = ৪০×৩০ = ১২০০ বর্গমিটার। ৩. রাস্তার ক্ষেত্রফল = (৪০×২) + (৩০×২) - (২×২) = ১৩৬ বর্গমিটার।",
                        "difficulty": "hard"
                    }
                ],
                "science": [
                    {
                        "type": "mcq",
                        "question": "উদ্ভিদের খাদ্য তৈরির প্রক্রিয়ার নাম কী?",
                        "options": {"A": "শ্বসন", "B": "প্রস্বেদন", "C": "সালোকসংশ্লেষণ", "D": "রেচন"},
                        "answer": "সালোকসংশ্লেষণ",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "একটি উদ্ভিদকোষ ও একটি প্রাণিকোষের চিহ্নিত চিত্র অঙ্কন করো এবং এদের মধ্যে ৩টি প্রধান পার্থক্য উল্লেখ করো।",
                        "answer": "উদ্ভিদকোষে কোষপ্রাচীর, ক্লোরোপ্লাস্ট এবং বড় গহ্বর থাকে যা প্রাণিকোষে নেই।",
                        "difficulty": "hard"
                    }
                ]
            },
            "class_07": {
                "math": [
                    {
                        "type": "mcq",
                        "question": "(a+b)² এর সূত্র কোনটি?",
                        "options": {"A": "a² + b²", "B": "a² - 2ab + b²", "C": "a² + 2ab + b²", "D": "a² + ab + b²"},
                        "answer": "a² + 2ab + b²",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "একটি আয়তাকার ঘরের দৈর্ঘ্য প্রস্থের দেড় গুণ। ঘরটির ক্ষেত্রফল ২১৬ বর্গমিটার। (ক) প্রস্থকে x ধরে সমীকরণ গঠন করো। (খ) ঘরটির দৈর্ঘ্য ও প্রস্থ নির্ণয় করো।",
                        "answer": "(ক) x × 1.5x = 216, সুতরাং 1.5x² = 216। (খ) x² = 144, x = 12 মিটার (প্রস্থ), দৈর্ঘ্য = 18 মিটার।",
                        "difficulty": "hard"
                    }
                ],
                "science": [
                    {
                        "type": "long",
                        "question": "তুমি একটি ধাতব চামচ গরম পানিতে ডুবিয়ে রাখলে চামচটির হাতল গরম হয়ে যায়। এটি তাপ সঞ্চালনের কোন পদ্ধতি? কঠিন পদার্থে তাপ কীভাবে এক প্রান্ত থেকে অন্য প্রান্তে যায় তা অণু-পরমাণুর কম্পন দিয়ে ব্যাখ্যা করো।",
                        "answer": "এটি পরিবহন পদ্ধতি। কঠিন পদার্থে তাপ পরিবহনের মাধ্যমে সঞ্চালিত হয়। গরম প্রান্তের অণুগুলো বেশি কম্পিত হয় এবং পাশের অণুতে শক্তি স্থানান্তর করে।",
                        "difficulty": "hard"
                    },
                    {
                        "type": "long",
                        "question": "মানবদেহে পরিপাক তন্ত্রের চিহ্নিত চিত্র আঁকো এবং পাকস্থলী ও ক্ষুদ্রান্তের কাজ বর্ণনা করো।",
                        "answer": "পাকস্থলী খাদ্য পরিপাক করে এবং ক্ষুদ্রান্ত্র পুষ্টি শোষণ করে।",
                        "difficulty": "hard"
                    }
                ]
            },
            "class_08": {
                "science": [
                    {
                        "type": "long",
                        "question": "সোডিয়াম (Na) এবং ক্লোরিন (Cl) কীভাবে আয়নিক বন্ধন গঠন করে তা ডায়াগ্রামসহ ব্যাখ্যা করো।",
                        "answer": "সোডিয়াম একটি ইলেকট্রন ত্যাগ করে Na+ আয়ন হয় এবং ক্লোরিন একটি ইলেকট্রন গ্রহণ করে Cl- আয়ন হয়। এই বিপরীত আধানের আকর্ষণে আয়নিক বন্ধন গঠিত হয়।",
                        "difficulty": "hard"
                    }
                ],
                "math": [
                    {
                        "type": "mcq",
                        "question": "(a-b)² + 4ab সমান কত?",
                        "options": {"A": "(a+b)²", "B": "(a-b)²", "C": "a² + b²", "D": "4ab"},
                        "answer": "(a+b)²",
                        "difficulty": "medium"
                    },
                    {
                        "type": "long",
                        "question": "বার্ষিক ১০% মুনাফায় ৫০০০ টাকার ৩ বছরের সরল মুনাফা ও চক্রবৃদ্ধি মুনাফার পার্থক্য নির্ণয় করো।",
                        "answer": "সরল মুনাফা = ৫০০০×১০×৩/১০০ = ১৫০০ টাকা। চক্রবৃদ্ধি মুনাফা = ৫০০০(১.১)³ - ৫০০০ = ১৬৫৫ টাকা। পার্থক্য = ১৫৫ টাকা।",
                        "difficulty": "hard"
                    }
                ]
            },
            "class_09": {
                "physics": [
                    {
                        "type": "mcq",
                        "question": "অভিকর্ষজ ত্বরণ g এর আদর্শ মান কত?",
                        "options": {"A": "9.8 ms⁻²", "B": "10 ms⁻²", "C": "9.0 ms⁻²", "D": "8.9 ms⁻²"},
                        "answer": "9.8 ms⁻²",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "একটি গাড়ি স্থির অবস্থান থেকে 4 ms⁻² ত্বরণে ১০ সেকেন্ড চলল। ১০ সেকেন্ড পর গাড়ির বেগ কত?",
                        "answer": "v = u + at = 0 + 4×10 = 40 ms⁻¹",
                        "difficulty": "medium"
                    }
                ],
                "biology": [
                    {
                        "type": "mcq",
                        "question": "কোষের পাওয়ার হাউস কোনটি?",
                        "options": {"A": "নিউক্লিয়াস", "B": "মাইটোকন্ড্রিয়া", "C": "রাইবোসোম", "D": "গলজি বডি"},
                        "answer": "মাইটোকন্ড্রিয়া",
                        "difficulty": "easy"
                    },
                    {
                        "type": "long",
                        "question": "হৃদপিণ্ডের গঠন ও রক্ত সঞ্চালন প্রক্রিয়া চিত্রসহ বর্ণনা করো।",
                        "answer": "হৃদপিণ্ডে চারটি প্রকোষ্ঠ আছে। ডান অলিন্দ → ডান নিলয় → ফুসফুস → বাম অলিন্দ → বাম নিলয় → সারা দেহ।",
                        "difficulty": "hard"
                    }
                ],
                "chemistry": [
                    {
                        "type": "mcq",
                        "question": "পানির রাসায়নিক সংকেত কী?",
                        "options": {"A": "H₂O", "B": "HO", "C": "H₂O₂", "D": "H₃O"},
                        "answer": "H₂O",
                        "difficulty": "easy"
                    }
                ]
            },
            "class_10": {
                "physics": [
                    {
                        "type": "mcq",
                        "question": "আলোর বেগ কত?",
                        "options": {"A": "3×10⁸ ms⁻¹", "B": "3×10⁶ ms⁻¹", "C": "3×10⁷ ms⁻¹", "D": "3×10⁹ ms⁻¹"},
                        "answer": "3×10⁸ ms⁻¹",
                        "difficulty": "easy"
                    }
                ],
                "chemistry": [
                    {
                        "type": "mcq",
                        "question": "পর্যায় সারণিতে মৌলের সংখ্যা কত?",
                        "options": {"A": "১১৮", "B": "১০৮", "C": "৯২", "D": "১০০"},
                        "answer": "১১৮",
                        "difficulty": "medium"
                    }
                ],
                "biology": [
                    {
                        "type": "mcq",
                        "question": "DNA এর পূর্ণরূপ কী?",
                        "options": {"A": "Deoxyribonucleic Acid", "B": "Diribonucleic Acid", "C": "Deoxyribose Acid", "D": "Deoxy Acid"},
                        "answer": "Deoxyribonucleic Acid",
                        "difficulty": "easy"
                    }
                ]
            },
            "class_11": {
                "physics": [
                    {
                        "type": "mcq",
                        "question": "ভেক্টর গুণনের বিনিময় সূত্র কোনটি?",
                        "options": {"A": "A⃗·B⃗ = B⃗·A⃗", "B": "A⃗×B⃗ = B⃗×A⃗", "C": "A⃗·B⃗ = -B⃗·A⃗", "D": "A⃗×B⃗ = -B⃗×A⃗"},
                        "answer": "A⃗·B⃗ = B⃗·A⃗",
                        "difficulty": "medium"
                    },
                    {
                        "type": "long",
                        "question": "নৌকার বেগ ও স্রোতের বেগ দেওয়া থাকলে, লম্বালম্বি পার হতে কোন দিকে নৌকা চালাতে হবে?",
                        "answer": "নৌকাকে স্রোতের বিপরীতে একটি কোণে চালাতে হবে যাতে ফলাফল বেগ নদীর লম্বালম্বি হয়।",
                        "difficulty": "hard"
                    }
                ],
                "chemistry": [
                    {
                        "type": "mcq",
                        "question": "পানির অণুতে কোন ধরনের হাইব্রিডাইজেশন ঘটে?",
                        "options": {"A": "sp", "B": "sp²", "C": "sp³", "D": "sp³d"},
                        "answer": "sp³",
                        "difficulty": "medium"
                    }
                ],
                "ict": [
                    {
                        "type": "long",
                        "question": "তিনটি সংখ্যার মধ্যে বড় সংখ্যাটি নির্ণয়ের জন্য 'C' ভাষায় একটি প্রোগ্রাম লেখো।",
                        "answer": "if-else statement ব্যবহার করে তিনটি সংখ্যা তুলনা করে বড়টি বের করতে হবে।",
                        "difficulty": "medium"
                    }
                ]
            },
            "class_12": {
                "physics": [
                    {
                        "type": "mcq",
                        "question": "প্ল্যাঙ্ক ধ্রুবকের মান কত?",
                        "options": {"A": "6.626×10⁻³⁴ Js", "B": "6.626×10⁻³³ Js", "C": "6.626×10⁻³⁵ Js", "D": "6.626×10⁻³² Js"},
                        "answer": "6.626×10⁻³⁴ Js",
                        "difficulty": "medium"
                    }
                ],
                "chemistry": [
                    {
                        "type": "mcq",
                        "question": "জৈব রসায়নে কার্বনের যোজনী কত?",
                        "options": {"A": "২", "B": "৩", "C": "৪", "D": "৫"},
                        "answer": "৪",
                        "difficulty": "easy"
                    }
                ],
                "ict": [
                    {
                        "type": "mcq",
                        "question": "HTML এর পূর্ণরূপ কী?",
                        "options": {"A": "Hyper Text Markup Language", "B": "High Text Markup Language", "C": "Hyper Transfer Markup Language", "D": "Home Text Markup Language"},
                        "answer": "Hyper Text Markup Language",
                        "difficulty": "easy"
                    }
                ]
            }
        }

        total_created = 0
        
        for class_key, subjects in questions_data.items():
            class_num = int(class_key.split('_')[1])
            
            for subject, questions in subjects.items():
                for q in questions:
                    Quiz.objects.create(
                        subject=subject,
                        class_target=class_num,
                        difficulty=q.get('difficulty', 'medium'),
                        question_text=q['question'],
                        question_type=q['type'],
                        options=q.get('options', {}),
                        correct_answer=q['answer'],
                        explanation=q.get('explanation', '')
                    )
                    total_created += 1
                    
        self.stdout.write(self.style.SUCCESS(f'Successfully created {total_created} questions'))
        
        # Show summary
        for class_num in range(6, 13):
            count = Quiz.objects.filter(class_target=class_num).count()
            self.stdout.write(f'Class {class_num}: {count} questions')
