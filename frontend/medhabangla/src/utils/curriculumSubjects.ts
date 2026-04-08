export interface CurriculumSubject {
    id: string;
    code: string;
    name: string;
    bengaliName: string;
    stream?: 'Science' | 'Humanities' | 'Business';
    isCompulsory: boolean;
}

const COMMON_6_TO_10_SUBJECTS: CurriculumSubject[] = [
    { id: 'bangla', code: 'bangla', name: 'Bengali', bengaliName: 'বাংলা', isCompulsory: true },
    { id: 'english', code: 'english', name: 'English', bengaliName: 'ইংরেজি', isCompulsory: true },
    { id: 'math', code: 'math', name: 'Mathematics', bengaliName: 'গণিত', isCompulsory: true },
    { id: 'science', code: 'science', name: 'Science', bengaliName: 'বিজ্ঞান', isCompulsory: true },
    {
        id: 'history_social_science',
        code: 'history_social_science',
        name: 'History and Social Science',
        bengaliName: 'ইতিহাস ও সামাজিক বিজ্ঞান',
        isCompulsory: true
    },
    {
        id: 'digital_technology',
        code: 'digital_technology',
        name: 'Digital Technology',
        bengaliName: 'ডিজিটাল প্রযুক্তি',
        isCompulsory: true
    },
    {
        id: 'life_livelihood',
        code: 'life_livelihood',
        name: 'Life and Livelihood',
        bengaliName: 'জীবন ও জীবিকা',
        isCompulsory: true
    },
    {
        id: 'health_wellbeing',
        code: 'health_wellbeing',
        name: 'Health and Wellbeing',
        bengaliName: 'স্বাস্থ্য সুরক্ষা',
        isCompulsory: true
    },
    {
        id: 'religious_education',
        code: 'religious_education',
        name: 'Religious Education',
        bengaliName: 'ধর্ম শিক্ষা',
        isCompulsory: true
    },
    {
        id: 'art_culture',
        code: 'art_culture',
        name: 'Art and Culture',
        bengaliName: 'শিল্প ও সংস্কৃতি',
        isCompulsory: true
    }
];

const COMMON_11_12_SUBJECTS: CurriculumSubject[] = [
    { id: 'bangla', code: 'bangla', name: 'Bengali', bengaliName: 'বাংলা', isCompulsory: true },
    { id: 'english', code: 'english', name: 'English', bengaliName: 'ইংরেজি', isCompulsory: true },
    {
        id: 'ict',
        code: 'ict',
        name: 'Information and Communication Technology (ICT)',
        bengaliName: 'তথ্য ও যোগাযোগ প্রযুক্তি',
        isCompulsory: true
    }
];

const SCIENCE_11_12_SUBJECTS: CurriculumSubject[] = [
    { id: 'physics', code: 'physics', name: 'Physics', bengaliName: 'পদার্থবিজ্ঞান', stream: 'Science', isCompulsory: false },
    { id: 'chemistry', code: 'chemistry', name: 'Chemistry', bengaliName: 'রসায়ন', stream: 'Science', isCompulsory: false },
    { id: 'higher_math', code: 'higher_math', name: 'Higher Mathematics', bengaliName: 'উচ্চতর গণিত', stream: 'Science', isCompulsory: false },
    { id: 'biology', code: 'biology', name: 'Biology', bengaliName: 'জীববিজ্ঞান', stream: 'Science', isCompulsory: false }
];

const HUMANITIES_11_12_SUBJECTS: CurriculumSubject[] = [
    {
        id: 'civics_governance',
        code: 'civics_governance',
        name: 'Civics and Good Governance',
        bengaliName: 'পৌরনীতি ও সুশাসন',
        stream: 'Humanities',
        isCompulsory: false
    },
    { id: 'economics', code: 'economics', name: 'Economics', bengaliName: 'অর্থনীতি', stream: 'Humanities', isCompulsory: false },
    {
        id: 'history',
        code: 'history',
        name: 'History',
        bengaliName: 'ইতিহাস',
        stream: 'Humanities',
        isCompulsory: false
    },
    {
        id: 'islamic_history_culture',
        code: 'islamic_history_culture',
        name: 'Islamic History and Culture',
        bengaliName: 'ইসলামের ইতিহাস ও সংস্কৃতি',
        stream: 'Humanities',
        isCompulsory: false
    },
    {
        id: 'sociology',
        code: 'sociology',
        name: 'Sociology',
        bengaliName: 'সমাজবিজ্ঞান',
        stream: 'Humanities',
        isCompulsory: false
    },
    {
        id: 'social_work',
        code: 'social_work',
        name: 'Social Work',
        bengaliName: 'সমাজকর্ম',
        stream: 'Humanities',
        isCompulsory: false
    },
    { id: 'logic', code: 'logic', name: 'Logic', bengaliName: 'যুক্তিবিদ্যা', stream: 'Humanities', isCompulsory: false },
    { id: 'geography', code: 'geography', name: 'Geography', bengaliName: 'ভূগোল', stream: 'Humanities', isCompulsory: false },
    {
        id: 'home_science',
        code: 'home_science',
        name: 'Home Science',
        bengaliName: 'গার্হস্থ্য বিজ্ঞান',
        stream: 'Humanities',
        isCompulsory: false
    }
];

const BUSINESS_11_12_SUBJECTS: CurriculumSubject[] = [
    {
        id: 'accounting',
        code: 'accounting',
        name: 'Accounting',
        bengaliName: 'হিসাববিজ্ঞান',
        stream: 'Business',
        isCompulsory: false
    },
    {
        id: 'business_organization_management',
        code: 'business_organization_management',
        name: 'Business Organization and Management',
        bengaliName: 'ব্যবসায় সংগঠন ও ব্যবস্থাপনা',
        stream: 'Business',
        isCompulsory: false
    },
    {
        id: 'finance_banking_insurance',
        code: 'finance_banking_insurance',
        name: 'Finance, Banking and Insurance',
        bengaliName: 'ফিন্যান্স, ব্যাংকিং ও বিমা',
        stream: 'Business',
        isCompulsory: false
    },
    {
        id: 'production_marketing',
        code: 'production_marketing',
        name: 'Production Management and Marketing',
        bengaliName: 'উৎপাদন ব্যবস্থাপনা ও বিপণন',
        stream: 'Business',
        isCompulsory: false
    }
];

export const getCurriculumSubjectsForClass = (classLevel?: number | null): CurriculumSubject[] => {
    if (!classLevel) {
        return [];
    }

    if (classLevel >= 6 && classLevel <= 10) {
        return COMMON_6_TO_10_SUBJECTS;
    }

    if (classLevel === 11 || classLevel === 12) {
        return [
            ...COMMON_11_12_SUBJECTS,
            ...SCIENCE_11_12_SUBJECTS,
            ...HUMANITIES_11_12_SUBJECTS,
            ...BUSINESS_11_12_SUBJECTS
        ];
    }

    return [];
};

export const getSubjectNameByCode = (classLevel: number | null | undefined, code: string): string => {
    const subject = getCurriculumSubjectsForClass(classLevel).find((item) => item.code === code);
    if (!subject) {
        return code;
    }

    return `${subject.bengaliName} (${subject.name})`;
};
