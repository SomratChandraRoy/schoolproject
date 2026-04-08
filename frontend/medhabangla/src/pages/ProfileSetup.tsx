import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurriculumSubjectsForClass } from '../utils/curriculumSubjects';

const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        class_level: '',
        fav_subjects: [] as string[],
        disliked_subjects: [] as string[]
    });
    const [loading, setLoading] = useState(false);

    const selectedClassLevel = formData.class_level ? parseInt(formData.class_level, 10) : null;
    const subjects = getCurriculumSubjectsForClass(selectedClassLevel);

    const handleSubjectToggle = (subjectId: string, type: 'fav' | 'disliked') => {
        if (type === 'fav') {
            setFormData(prev => ({
                ...prev,
                fav_subjects: prev.fav_subjects.includes(subjectId)
                    ? prev.fav_subjects.filter(s => s !== subjectId)
                    : [...prev.fav_subjects, subjectId],
                disliked_subjects: prev.disliked_subjects.filter(s => s !== subjectId)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                disliked_subjects: prev.disliked_subjects.includes(subjectId)
                    ? prev.disliked_subjects.filter(s => s !== subjectId)
                    : [...prev.disliked_subjects, subjectId],
                fav_subjects: prev.fav_subjects.filter(s => s !== subjectId)
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.class_level) {
            alert('Please select your class');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/accounts/profile/update/', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                    আপনার প্রোফাইল সম্পূর্ণ করুন<br />
                    <span className="text-xl">Complete Your Profile</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
                    আপনার শেখার অভিজ্ঞতা ব্যক্তিগতকৃত করতে সাহায্য করুন<br />
                    <span className="text-sm">Help us personalize your learning experience</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Class Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            আপনার শ্রেণী নির্বাচন করুন * (Select Your Class)
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                                <button
                                    key={cls}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, class_level: cls.toString() }))}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${formData.class_level === cls.toString()
                                        ? 'bg-blue-600 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    শ্রেণী {cls}<br />
                                    <span className="text-xs">Class {cls}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Favorite Subjects */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            প্রিয় বিষয় (Favorite Subjects) - একাধিক নির্বাচন করুন
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {subjects.map(subject => (
                                <button
                                    key={subject.code}
                                    type="button"
                                    onClick={() => handleSubjectToggle(subject.code, 'fav')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${formData.fav_subjects.includes(subject.code)
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {subject.bengaliName} ({subject.name})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Disliked Subjects */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            চ্যালেঞ্জিং বিষয় (Challenging Subjects) - ঐচ্ছিক
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {subjects.map(subject => (
                                <button
                                    key={subject.code}
                                    type="button"
                                    onClick={() => handleSubjectToggle(subject.code, 'disliked')}
                                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${formData.disliked_subjects.includes(subject.code)
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {subject.bengaliName} ({subject.name})
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.class_level}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                        {loading ? 'সংরক্ষণ করা হচ্ছে... (Saving...)' : 'সেটআপ সম্পূর্ণ করুন (Complete Setup)'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
