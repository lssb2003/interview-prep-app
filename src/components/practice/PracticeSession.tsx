// src/components/practice/PracticeSession.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    getPracticeSession,
    updatePracticeSession,
    getUserProfile,
    getJob,
    saveAnswer
} from '../../services/firebase/firestore';
import { generateQuestions, getAnswerFeedback, suggestTags } from '../../services/openai/functions';
import { PracticeSession as SessionType, Question, UserProfile, Job, QuestionCategory } from '../../types';
import { toast } from 'react-hot-toast';
import { serverTimestamp } from 'firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase/config';

const PracticeSession: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [session, setSession] = useState<SessionType | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [job, setJob] = useState<Job | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [userAnswer, setUserAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [savedAnswer, setSavedAnswer] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [generatingQuestions, setGeneratingQuestions] = useState<boolean>(false);
    const [gettingFeedback, setGettingFeedback] = useState<boolean>(false);
    const [customTagInput, setCustomTagInput] = useState('');

    // Load session data on component mount
    useEffect(() => {
        const loadSessionData = async () => {
            if (!sessionId || !currentUser) return;

            try {
                setLoading(true);
                // Set generatingQuestions to true immediately for new sessions
                // This prevents the "No questions available" error from flashing
                setGeneratingQuestions(true);

                // Fetch practice session
                const sessionData = await getPracticeSession(sessionId);

                if (!sessionData) {
                    toast.error('Practice session not found');
                    setGeneratingQuestions(false);
                    return navigate('/practice/setup');
                }

                if (sessionData.userId !== currentUser.uid) {
                    toast.error('You do not have access to this session');
                    setGeneratingQuestions(false);
                    return navigate('/practice/setup');
                }

                setSession(sessionData);
                setCurrentQuestionIndex(sessionData.currentQuestionIndex || 0);

                // Fetch user profile
                const profile = await getUserProfile(currentUser.uid);
                if (!profile) {
                    toast.error('User profile not found');
                    setGeneratingQuestions(false);
                    return navigate('/profile/setup');
                }
                setUserProfile(profile);

                // Fetch job if job-specific session
                let jobData = null;
                if (sessionData.jobId) {
                    jobData = await getJob(sessionData.jobId);
                    setJob(jobData);
                }

                // Check if this is a new session (no questions)
                if (!sessionData.questions || sessionData.questions.length === 0) {
                    // Only show one loading toast
                    toast.dismiss();
                    toast.loading('Generating personalized interview questions...');

                    // Keep generatingQuestions as true and continue to generate questions
                    await generateSessionQuestions(sessionData, profile, jobData);
                } else {
                    // Existing session with questions - no need to generate
                    setGeneratingQuestions(false);

                    // Set current question
                    const questionIndex = sessionData.currentQuestionIndex || 0;
                    if (sessionData.questions.length > questionIndex) {
                        setCurrentQuestion(sessionData.questions[questionIndex]);
                    } else if (sessionData.questions.length > 0) {
                        // If index is out of bounds but questions exist, set to the first question
                        setCurrentQuestion(sessionData.questions[0]);
                        setCurrentQuestionIndex(0);
                    }
                }
            } catch (error) {
                console.error('Error loading session data:', error);
                toast.error('Failed to load session data. Please try again.');
                setGeneratingQuestions(false);
            } finally {
                setLoading(false);
            }
        };

        loadSessionData();
    }, [sessionId, currentUser, navigate]);


    // Generate questions for the session
    const generateSessionQuestions = async (
        sessionData: SessionType,
        profile: UserProfile,
        job?: Job | null
    ) => {
        if (!sessionId) return;

        try {
            // We're already showing the loading indicator from the useEffect, so no need to set it again
            // Just keep the generatingQuestions state as true

            // Generate questions using OpenAI
            const questionsData = await generateQuestions(
                profile,
                sessionData.categories,
                5, // Number of questions to generate
                job || undefined
            );

            // Ensure we have valid questions data
            if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
                toast.dismiss();
                toast.error('Failed to generate questions. Please try again.');
                setGeneratingQuestions(false);
                return;
            }

            // Format questions with fallbacks in case of missing data
            const questions: Question[] = questionsData.map((q, index) => {
                // Create clean question object with no undefined values
                const cleanQuestion: Question = {
                    id: `q-${Date.now()}-${index}`,
                    text: q.text || `Question ${index + 1}`,
                    category: q.category || 'Behavioral' as QuestionCategory,
                    jobSpecific: !!job
                };

                // Only add jobId if it exists
                if (job && job.id) {
                    cleanQuestion.jobId = job.id;
                }

                return cleanQuestion;
            });

            if (questions.length === 0) {
                toast.dismiss();
                toast.error('No questions could be generated. Please try again.');
                setGeneratingQuestions(false);
                return;
            }

            // Create a clean session update with no undefined values
            const sessionUpdate = {
                questions: questions,
                currentQuestionIndex: 0,
                updatedAt: serverTimestamp() // Make sure this is imported from firebase/firestore
            };

            // Update session in Firestore
            try {
                // Directly update the document without using our helper function
                const sessionRef = doc(db, 'practice_sessions', sessionId);
                await updateDoc(sessionRef, sessionUpdate);

                // Update local state
                setSession(prev => prev ? { ...prev, questions } : null);
                setCurrentQuestion(questions[0]);
                setCurrentQuestionIndex(0);

                toast.dismiss();
                toast.success('Questions generated!');
            } catch (updateError) {
                console.error('Error updating practice session:', updateError);
                console.log('Failed session update:', JSON.stringify(sessionUpdate));
                toast.dismiss();
                toast.error('Failed to save questions. Please try again.');
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            toast.dismiss();
            toast.error('Failed to generate questions. Please try again.');
        } finally {
            setGeneratingQuestions(false);
        }
    };



    // Request feedback for the current answer
    const requestFeedback = async () => {
        if (!currentQuestion || !userAnswer.trim() || !userProfile) return;

        try {
            setGettingFeedback(true);
            toast.loading('Getting AI feedback on your answer...');

            // Get feedback using OpenAI
            const feedbackText = await getAnswerFeedback(
                currentQuestion.text,
                userAnswer,
                userProfile,
                job || undefined
            );

            setFeedback(feedbackText || 'No feedback available.');

            // Get suggested tags
            try {
                const tags = await suggestTags(currentQuestion.text, userAnswer, job || undefined);
                if (tags && Array.isArray(tags) && tags.length > 0) {
                    setSuggestedTags(tags);
                    setSelectedTags(tags);
                } else {
                    // Set default tags if none returned
                    const defaultTags = ['interview', currentQuestion.category.toLowerCase()];
                    setSuggestedTags(defaultTags);
                    setSelectedTags(defaultTags);
                }
            } catch (tagError) {
                console.error('Error getting tags:', tagError);
                // Set default tags on error
                const defaultTags = ['interview', currentQuestion.category.toLowerCase()];
                setSuggestedTags(defaultTags);
                setSelectedTags(defaultTags);
            }

            toast.dismiss();
        } catch (error) {
            console.error('Error getting feedback:', error);
            toast.dismiss();
            toast.error('Failed to get feedback. Please try again.');
            // Set a default feedback message
            setFeedback('I couldn\'t generate detailed feedback at this time. Consider reviewing your answer for clarity, relevance to the question, and specific examples that demonstrate your skills and experience.');
        } finally {
            setGettingFeedback(false);
        }
    };

    // Save the current answer
    const saveCurrentAnswer = async () => {
        if (!currentQuestion || !userAnswer.trim() || !currentUser) return;

        try {
            setLoading(true);

            // Create a clean answer object with no undefined values
            const answerData: any = {
                userId: currentUser.uid,
                questionId: currentQuestion.id,
                questionText: currentQuestion.text,
                answerText: userAnswer,
                category: currentQuestion.category,
                feedback: feedback || '',  // Ensure feedback is never undefined
                tags: selectedTags.length > 0 ? selectedTags : ['interview'], // Ensure tags is never empty
                isFavorite: false
            };

            // Only add jobId if job exists and has an id
            if (job && job.id) {
                answerData.jobId = job.id;
            }

            // Save answer to Firestore using the clean object
            await saveAnswer(answerData);

            setSavedAnswer(true);
            toast.success('Answer saved successfully!');
        } catch (error) {
            console.error('Error saving answer:', error);
            toast.error('Failed to save answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Move to the next question
    const handleNextQuestion = async () => {
        if (!session || !session.questions || !sessionId) return;

        // Make sure we have questions to navigate to
        if (!Array.isArray(session.questions) || session.questions.length === 0) {
            toast.error('No questions available. Please start a new session.');
            navigate('/practice/setup');
            return;
        }

        const nextIndex = currentQuestionIndex + 1;

        // Check if this is the last question
        if (nextIndex >= session.questions.length) {
            // End of session
            toast.success('You have completed all questions!');
            navigate('/dashboard');
            return;
        }

        // Clean questions before updating Firebase
        const cleanQuestions = session.questions.map(q => {
            const cleanQuestion: any = {
                id: q.id || `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: q.text || 'Interview question',
                category: q.category || 'Behavioral',
                jobSpecific: q.jobSpecific ?? false
            };

            // Only add jobId if it exists
            if (q.jobId) {
                cleanQuestion.jobId = q.jobId;
            }

            return cleanQuestion;
        });

        // Update session in Firestore directly
        try {
            const sessionRef = doc(db, 'practice_sessions', sessionId);
            await updateDoc(sessionRef, {
                questions: cleanQuestions,
                currentQuestionIndex: nextIndex,
                updatedAt: serverTimestamp()
            });

            // Reset state for next question
            setCurrentQuestionIndex(nextIndex);
            setCurrentQuestion(session.questions[nextIndex]);
            setUserAnswer('');
            setFeedback('');
            setSuggestedTags([]);
            setSelectedTags([]);
            setSavedAnswer(false);
        } catch (error) {
            console.error('Error updating session:', error);
            toast.error('Failed to move to next question. Please try again.');
        }
    };

    // Handle tag selection
    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => {
            // If tag is in the array, remove it
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            }
            // Otherwise add it
            else {
                return [...prev, tag];
            }
        });
        console.log('Toggled tag:', tag); // Debugging log
    };

    // Add custom tag
    const handleAddCustomTag = (tag: string) => {
        const trimmedTag = tag.trim();
        if (trimmedTag && !selectedTags.includes(trimmedTag)) {
            // Use functional state update to ensure we're working with the latest state
            setSelectedTags(prevTags => [...prevTags, trimmedTag]);
            console.log('Added tag:', trimmedTag); // Debugging log
        }
    };


    if (loading && !session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (generatingQuestions) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Generating personalized questions...</h2>
                <p className="mt-2 text-gray-500">
                    Our AI is analyzing your profile {job && 'and job requirements'} to create relevant interview questions.
                </p>
            </div>
        );
    }

    // Check if we have valid questions
    const hasQuestions = session?.questions && Array.isArray(session.questions) && session.questions.length > 0;

    // Only show the "No questions available" error if we're not generating questions
    if (!hasQuestions && !generatingQuestions) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">No questions available</h1>
                <p className="mb-4">We couldn't load any questions for this session.</p>
                <button
                    onClick={() => navigate('/practice/setup')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Start a New Session
                </button>
            </div>
        );
    }

    const getCategoryBadgeColor = (category: QuestionCategory) => {
        switch (category) {
            case 'Motivational':
                return 'bg-green-100 text-green-800';
            case 'Behavioral':
                return 'bg-blue-100 text-blue-800';
            case 'Technical':
                return 'bg-purple-100 text-purple-800';
            case 'Personality':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Safely get the current question or show a fallback
    const displayQuestion = currentQuestion || (hasQuestions ?
        session.questions[Math.min(currentQuestionIndex, session.questions.length - 1)] : null);

    if (!displayQuestion) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error loading question</h1>
                <p className="mb-4">There was a problem loading the question. Please try again.</p>
                <button
                    onClick={() => navigate('/practice/setup')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Start a New Session
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
                    {hasQuestions && (
                        <span className="text-sm text-gray-500">
                            Question {currentQuestionIndex + 1} of {session.questions.length}
                        </span>
                    )}
                </div>
                {job && (
                    <p className="text-sm text-gray-600 mt-1">
                        Preparing for: {job.title} at {job.company}
                    </p>
                )}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center mb-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(displayQuestion.category)}`}>
                            {displayQuestion.category}
                        </span>
                    </div>

                    <h2 className="text-xl font-medium text-gray-900 mb-6">{displayQuestion.text}</h2>

                    <div className="mb-4">
                        <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
                            Your Answer
                        </label>
                        <textarea
                            id="answer"
                            name="answer"
                            rows={8}
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            disabled={savedAnswer}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md resize-none"
                            placeholder="Type your answer here..."
                        />
                    </div>

                    {!feedback && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={requestFeedback}
                                disabled={!userAnswer.trim() || gettingFeedback || savedAnswer}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {gettingFeedback ? 'Getting Feedback...' : 'Get AI Feedback'}
                            </button>
                        </div>
                    )}

                    {feedback && (
                        <div className="mt-6 bg-indigo-50 p-4 rounded-md">
                            <h3 className="text-lg font-medium text-indigo-900 mb-2">AI Feedback</h3>
                            <div className="text-sm text-indigo-800 whitespace-pre-line">
                                {feedback}
                            </div>
                        </div>
                    )}

                    {feedback && !savedAnswer && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {/* Display existing tags */}
                                {suggestedTags.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => handleTagToggle(tag)}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTags.includes(tag)
                                            ? 'bg-indigo-100 text-indigo-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {tag}
                                        {selectedTags.includes(tag) ? (
                                            <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        )}
                                    </button>
                                ))}

                                {/* Display custom added tags that aren't in suggestedTags */}
                                {selectedTags
                                    .filter(tag => !suggestedTags.includes(tag))
                                    .map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => handleTagToggle(tag)}
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                        >
                                            {tag}
                                            <svg className="ml-1.5 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    ))}

                                {/* Custom tag input with controlled component approach */}
                                <div className="inline-flex items-center">
                                    <input
                                        type="text"
                                        placeholder="Add custom tag"
                                        value={customTagInput}
                                        onChange={(e) => setCustomTagInput(e.target.value)}
                                        className="border border-gray-300 rounded-l-md text-xs py-0.5 px-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && customTagInput.trim()) {
                                                handleAddCustomTag(customTagInput);
                                                setCustomTagInput('');
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (customTagInput.trim()) {
                                                handleAddCustomTag(customTagInput);
                                                setCustomTagInput('');
                                            }
                                        }}
                                        className="inline-flex items-center px-2 py-0.5 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-xs font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Show the current selected tags count for clarity */}
                            <p className="text-xs text-gray-500 mb-4">
                                Selected tags: {selectedTags.length} {selectedTags.length > 0 && `(${selectedTags.join(', ')})`}
                            </p>

                            {/* Rest of the button controls */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUserAnswer('');
                                        setFeedback('');
                                        setSuggestedTags([]);
                                        setSelectedTags([]);
                                    }}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Revise Answer
                                </button>
                                <button
                                    type="button"
                                    onClick={saveCurrentAnswer}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {loading ? 'Saving...' : 'Save Answer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {savedAnswer && (
                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={handleNextQuestion}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Next Question
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to exit? Your progress on this question will be lost if not saved.')) {
                            navigate('/dashboard');
                        }
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Exit Session
                </button>

                {!savedAnswer && (
                    <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Skip Question
                    </button>
                )}
            </div>
        </div>
    );
};

export default PracticeSession;