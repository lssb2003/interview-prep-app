// src/services/firebase/firestore.ts
import { db, storage } from './config';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    UserProfile,
    Answer,
    Job,
    Question,
    PracticeSession,
    QuestionCategory
} from '../../types';

// User Profile Functions
export const createUserProfile = async (profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>) => {
    const userProfileRef = doc(db, 'profiles', profile.uid);
    await setDoc(userProfileRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    // Update the isProfileComplete flag in the users collection
    const userRef = doc(db, 'users', profile.uid);
    await updateDoc(userRef, {
        isProfileComplete: true
    });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userProfileRef = doc(db, 'profiles', uid);
    const userProfileSnap = await getDoc(userProfileRef);

    if (userProfileSnap.exists()) {
        return userProfileSnap.data() as UserProfile;
    }

    return null;
};

export const updateUserProfile = async (profile: Partial<UserProfile> & { uid: string }) => {
    const userProfileRef = doc(db, 'profiles', profile.uid);
    await updateDoc(userProfileRef, {
        ...profile,
        updatedAt: serverTimestamp()
    });
};

// File Upload Functions
export const uploadResume = async (uid: string, file: File): Promise<string> => {
    const fileRef = ref(storage, `resumes/${uid}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
};

export const uploadCoverLetter = async (uid: string, file: File, jobId: string): Promise<string> => {
    const fileRef = ref(storage, `coverLetters/${uid}/${jobId}/${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
};

// Job Functions
export const createJob = async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => {
    const jobRef = collection(db, 'jobs');
    return addDoc(jobRef, {
        ...job,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const getJobs = async (userId: string): Promise<Job[]> => {
    const jobsQuery = query(
        collection(db, 'jobs'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    const jobsSnap = await getDocs(jobsQuery);
    return jobsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Job));
};

export const getJob = async (jobId: string): Promise<Job | null> => {
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);

    if (jobSnap.exists()) {
        return {
            id: jobSnap.id,
            ...jobSnap.data()
        } as Job;
    }

    return null;
};

export const updateJob = async (job: Partial<Job> & { id: string }) => {
    const jobRef = doc(db, 'jobs', job.id);
    await updateDoc(jobRef, {
        ...job,
        updatedAt: serverTimestamp()
    });
};

export const deleteJob = async (jobId: string) => {
    const jobRef = doc(db, 'jobs', jobId);
    await deleteDoc(jobRef);
};

// Answer Functions
export const saveAnswer = async (answer: Omit<Answer, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Validate required fields
    if (!answer.userId) throw new Error('userId is required');
    if (!answer.questionId) throw new Error('questionId is required');
    if (!answer.questionText) throw new Error('questionText is required');
    if (!answer.answerText) throw new Error('answerText is required');
    if (!answer.category) throw new Error('category is required');

    // Create a clean answer object with no undefined values
    const cleanAnswer: any = {
        userId: answer.userId,
        questionId: answer.questionId,
        questionText: answer.questionText,
        answerText: answer.answerText,
        category: answer.category,
        feedback: answer.feedback || '',  // Default to empty string
        tags: Array.isArray(answer.tags) && answer.tags.length > 0 ? answer.tags : ['interview'],
        isFavorite: answer.isFavorite ?? false, // Use nullish coalescing to default to false
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    // Only add jobId if it exists and isn't undefined
    if (answer.jobId) {
        cleanAnswer.jobId = answer.jobId;
    }

    const answersRef = collection(db, 'answers');
    return addDoc(answersRef, cleanAnswer);
};

export const getAnswers = async (userId: string): Promise<Answer[]> => {
    const answersQuery = query(
        collection(db, 'answers'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
    );

    const answersSnap = await getDocs(answersQuery);
    return answersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Answer));
};

export const getAnswersByJob = async (userId: string, jobId: string): Promise<Answer[]> => {
    const answersQuery = query(
        collection(db, 'answers'),
        where('userId', '==', userId),
        where('jobId', '==', jobId),
        orderBy('updatedAt', 'desc')
    );

    const answersSnap = await getDocs(answersQuery);
    return answersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Answer));
};

export const updateAnswer = async (answer: Partial<Answer> & { id: string }) => {
    const answerRef = doc(db, 'answers', answer.id);
    await updateDoc(answerRef, {
        ...answer,
        updatedAt: serverTimestamp()
    });
};

export const deleteAnswer = async (answerId: string) => {
    const answerRef = doc(db, 'answers', answerId);
    await deleteDoc(answerRef);
};

// Practice Session Functions
export const updatePracticeSession = async (
    sessionId: string,
    questions: Question[],
    currentQuestionIndex: number
) => {
    // Validate inputs
    if (!sessionId) {
        console.error('Session ID is required for updating a practice session');
        throw new Error('Session ID is required');
    }

    if (!Array.isArray(questions)) {
        console.error('Questions must be an array');
        throw new Error('Questions must be an array');
    }

    // Ensure currentQuestionIndex is a valid number
    const validIndex = Number.isInteger(currentQuestionIndex) ? currentQuestionIndex : 0;

    // Clean questions to remove any undefined values
    const cleanQuestions = questions.map(q => {
        const cleanQuestion: any = {
            id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: q.text || 'Interview question',
            category: q.category || 'Behavioral',
            jobSpecific: q.jobSpecific ?? false
        };

        // Only add jobId if it exists, otherwise don't include it
        if (q.jobId) {
            cleanQuestion.jobId = q.jobId;
        }

        return cleanQuestion;
    });

    const sessionRef = doc(db, 'practice_sessions', sessionId);

    // Include updatedAt timestamp
    await updateDoc(sessionRef, {
        questions: cleanQuestions,
        currentQuestionIndex: validIndex,
        updatedAt: serverTimestamp()
    });
};


// Additional validation for createPracticeSession
export const createPracticeSession = async (
    userId: string,
    categories: QuestionCategory[],
    jobId?: string
): Promise<string> => {
    if (!userId) {
        throw new Error('User ID is required');
    }

    if (!Array.isArray(categories) || categories.length === 0) {
        throw new Error('At least one question category is required');
    }

    const sessionRef = collection(db, 'practice_sessions');
    const newSession = await addDoc(sessionRef, {
        userId,
        jobId: jobId || null, // Ensure we store null, not undefined
        categories,
        questions: [], // Initialize with empty array
        currentQuestionIndex: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp() // Add updatedAt timestamp
    });

    return newSession.id;
};

// Update getPracticeSession to validate the session data
export const getPracticeSession = async (sessionId: string): Promise<PracticeSession | null> => {
    if (!sessionId) {
        console.error('Session ID is required');
        return null;
    }

    const sessionRef = doc(db, 'practice_sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
        const data = sessionSnap.data();
        // Ensure questions is always an array
        const questions = Array.isArray(data.questions) ? data.questions : [];
        // Ensure currentQuestionIndex is a valid number
        const currentQuestionIndex = Number.isInteger(data.currentQuestionIndex) ?
            data.currentQuestionIndex : 0;

        return {
            id: sessionSnap.id,
            ...data,
            questions,
            currentQuestionIndex
        } as PracticeSession;
    }

    return null;
};