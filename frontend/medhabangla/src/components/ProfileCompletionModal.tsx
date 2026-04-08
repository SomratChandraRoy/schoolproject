import React, { useState } from 'react';
import { getCurriculumSubjectsForClass } from '../utils/curriculumSubjects';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        class_level: '',
        fav_subjects: [] as string[],
        disliked_subjects: [] as string[],
        interests: [] as string[]
    });

    const selectedClassLevel = formData.class_level ? parseInt(formData.class_level, 10) : null;
    const subjects = getCurriculumSubjectsForClass(selectedClassLevel);

    const interestOptions = [
        { id: 'reading', name: '📚 পড়া (Reading)', icon: '📚' },
        { id: 'science', name: '🔬 বিজ্ঞান (Science)', icon: '🔬' },
        { id: 'technology', name: '💻 প্রযুক্তি (Technology)', icon: '💻' },
        { id: 'sports', name: '⚽ খেলাধুলা (Sports)', icon: '⚽' },
        { id: 'arts', name: '🎨 শিল্পকলা (Arts)', icon: '🎨' },
        { id: 'music', name: '🎵 সঙ্গীত (Music)', icon: '🎵' },
        { id: 'coding', name: '👨‍💻 কোডিং (Coding)', icon: '👨‍💻' },
        { id: 'writing', name: '✍️ লেখালেখি (Writing)', icon: '✍️' }
    ];

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

    const handleInterestToggle = (interestId: string) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.includes(interestId)
                ? prev.interests.filter(i => i !== interestId)
                : [...prev.interests, interestId]
        }));
    };

    const handleNext = () => {
        if (step === 1 && !formData.class_level) {
            alert('আপনার শ্রেণী নির্বাচন করুন (Please select your class)');
            return;
        }
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        if (!formData.class_level) {
            alert('আপনার শ্রেণী নির্বাচন করুন (Please select your class)');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/accounts/profile/update/', {
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
                onComplete();
            } else {
                alert('Failed to update profile. Please try again.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                    <h2 className="text-2xl font-bold mb-2">
                        {step === 1 && '👋 স্বাগতম! (Welcome!)'}
                        {step === 2 && '📚 আপনার পছন্দ (Your Preferences)'}
                        {step === 3 && '🎯 আপনার আগ্রহ (Your Interests)'}
                    </h2>
                    <p className="text-blue-100">
                        {step === 1 && 'আপনার শেখার যাত্রা শুরু করতে কিছু তথ্য দিন'}
                        {step === 2 && 'আপনার পছন্দের বিষয় নির্বাচন করুন'}
                        {step === 3 && 'আপনার আগ্রহের ক্ষেত্র নির্বাচন করুন'}
                    </p>
                    <div className="mt-4 flex space-x-2">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: Class Selection */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    আপনার শ্রেণী নির্বাচন করুন * (Select Your Class)
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[6, 7, 8, 9, 10, 11, 12].map(cls => (
                                        <button
                                            key={cls}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, class_level: cls.toString() }))}
                                            className={`py-4 px-4 rounded-xl font-bold transition-all transform hover:scale-105 ${formData.class_level === cls.toString()
                                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">🎓</div>
                                            <div className="text-sm">শ্রেণী {cls}</div>
                                            <div className="text-xs opacity-75">Class {cls}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Subject Preferences */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    ❤️ প্রিয় বিষয় (Favorite Subjects)
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    একাধিক নির্বাচন করুন (Select multiple)
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {subjects.map(subject => (
                                        <button
                                            key={subject.code}
                                            type="button"
                                            onClick={() => handleSubjectToggle(subject.code, 'fav')}
                                            className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${formData.fav_subjects.includes(subject.code)
                                                    ? 'bg-green-600 text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {subject.bengaliName} ({subject.name})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    😓 চ্যালেঞ্জিং বিষয় (Challenging Subjects)
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    ঐচ্ছিক - যেসব বিষয়ে সাহায্য চান (Optional - subjects you need help with)
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {subjects.map(subject => (
                                        <button
                                            key={subject.code}
                                            type="button"
                                            onClick={() => handleSubjectToggle(subject.code, 'disliked')}
                                            className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${formData.disliked_subjects.includes(subject.code)
                                                    ? 'bg-orange-600 text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {subject.bengaliName} ({subject.name})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Interests */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    🌟 আপনার আগ্রহ (Your Interests)
                                </label>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    ঐচ্ছিক - আপনার পছন্দের ক্ষেত্র (Optional - your areas of interest)
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {interestOptions.map(interest => (
                                        <button
                                            key={interest.id}
                                            type="button"
                                            onClick={() => handleInterestToggle(interest.id)}
                                            className={`py-4 px-4 rounded-lg text-sm font-medium transition-all ${formData.interests.includes(interest.id)
                                                    ? 'bg-purple-600 text-white shadow-md'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{interest.icon}</div>
                                            <div className="text-xs">{interest.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-between">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            ← পূর্ববর্তী (Previous)
                        </button>
                    )}
                    {step < 3 ? (
                        <button
                            onClick={handleNext}
                            disabled={step === 1 && !formData.class_level}
                            className={`ml-auto px-6 py-3 rounded-lg font-medium transition-colors ${step === 1 && !formData.class_level
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                }`}
                        >
                            পরবর্তী (Next) →
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.class_level}
                            className={`ml-auto px-6 py-3 rounded-lg font-medium transition-colors ${loading || !formData.class_level
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:shadow-lg'
                                }`}
                        >
                            {loading ? 'সংরক্ষণ করা হচ্ছে... (Saving...)' : '✓ সম্পূর্ণ করুন (Complete)'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
