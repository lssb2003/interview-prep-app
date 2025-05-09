// src/types/index.ts
export interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
}

export interface WorkExperience {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string[];
    technologies: string[];
    link?: string;
}

export interface Skill {
    id: string;
    name: string;
    level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Extracurricular {
    id: string;
    name: string;
    role?: string;
    description: string;
    startDate?: string;
    endDate?: string;
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
    education: Education[];
    workExperience: WorkExperience[];
    projects: Project[];
    skills: Skill[];
    extracurriculars: Extracurricular[];
    additionalInfo?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Question and Answer types
export type QuestionCategory = 'Motivational' | 'Behavioral' | 'Technical' | 'Personality';

export interface Question {
    id: string;
    text: string;
    category: QuestionCategory;
    jobSpecific: boolean;
    jobId?: string;
}

export interface Answer {
    id: string;
    userId: string; // Add userId property
    questionId: string;
    questionText: string;
    answerText: string;
    category: QuestionCategory;
    feedback?: string;
    tags: string[];
    jobId?: string;
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
}


// Job types
export type JobStatus = 'Drafted' | 'Submitted' | 'Interviewing' | 'Offer' | 'Rejected';

export interface Job {
    id: string;
    userId: string;
    company: string;
    title: string;
    description?: string;
    status: JobStatus;
    resumeUrl?: string;
    coverLetterUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Session types
export interface PracticeSession {
    id: string;
    userId: string;
    jobId?: string;
    categories: QuestionCategory[];
    questions: Question[];
    currentQuestionIndex: number;
    createdAt: Date;
}