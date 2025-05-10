// src/components/practice/SessionSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile } from '../../services/firebase/firestore';
import { getJobs, createPracticeSession } from '../../services/firebase/firestore';
import { QuestionCategory, UserProfile, Job } from '../../types';
import { toast } from 'react-hot-toast';

const SessionSetup: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [sessionType, setSessionType] = useState<'general' | 'job-specific'>('general');
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [jobDescription, setJobDescription] = useState<string>('');
    const [categories, setCategories] = useState<QuestionCategory[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch user profile and jobs on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // Fetch user profile
                const profile = await getUserProfile(currentUser.uid);
                setUserProfile(profile);

                // Fetch user's saved jobs
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load your data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Handle category selection
    const handleCategoryToggle = (category: QuestionCategory) => {
        setCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    // Handle job selection
    const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const jobId = e.target.value;
        setSelectedJob(jobId);

        if (jobId) {
            const job = jobs.find(j => j.id === jobId);
            if (job && job.description) {
                setJobDescription(job.description);
            } else {
                setJobDescription('');
            }
        } else {
            setJobDescription('');
        }
    };

    // Start practice session
    const handleStartSession = async () => {
        if (categories.length === 0) {
            return toast.error('Please select at least one question category');
        }

        try {
            setLoading(true);
            toast.loading('Creating your practice session...'); // Show loading toast

            // Create practice session in Firestore
            const sessionId = await createPracticeSession(
                currentUser!.uid,
                categories,
                sessionType === 'job-specific' ? selectedJob : undefined
            );

            // Do NOT dismiss the toast here - let PracticeSession handle it
            // The loading state will continue seamlessly between the two components

            // Navigate to practice session
            navigate(`/practice/session/${sessionId}`);
        } catch (error) {
            console.error('Error creating practice session:', error);
            toast.dismiss(); // Dismiss the toast on error
            toast.error('Failed to start practice session. Please try again.');
        } finally {
            setLoading(false);
        }
    };




    if (loading && !userProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Start a Practice Session</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Session Type</h2>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                id="general"
                                name="session-type"
                                type="radio"
                                checked={sessionType === 'general'}
                                onChange={() => setSessionType('general')}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                            />
                            <label htmlFor="general" className="ml-3 block text-sm font-medium text-gray-700">
                                General Prep (not specific to any job)
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                id="job-specific"
                                name="session-type"
                                type="radio"
                                checked={sessionType === 'job-specific'}
                                onChange={() => setSessionType('job-specific')}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                            />
                            <label htmlFor="job-specific" className="ml-3 block text-sm font-medium text-gray-700">
                                Job-Specific Prep
                            </label>
                        </div>
                    </div>

                    {sessionType === 'job-specific' && (
                        <div className="mt-6 space-y-6">
                            <div>
                                <label htmlFor="job-select" className="block text-sm font-medium text-gray-700">
                                    Select a Job
                                </label>
                                <select
                                    id="job-select"
                                    name="job-select"
                                    value={selectedJob}
                                    onChange={handleJobChange}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    required={sessionType === 'job-specific'}
                                >
                                    <option value="">Select a job...</option>
                                    {jobs.map(job => (
                                        <option key={job.id} value={job.id}>
                                            {job.title} at {job.company}
                                        </option>
                                    ))}
                                </select>
                                {jobs.length === 0 && (
                                    <p className="mt-2 text-sm text-yellow-600">
                                        You don't have any saved jobs. <a href="/jobs/new" className="underline">Add a job</a> first or choose the "General Prep" option.
                                    </p>
                                )}
                            </div>

                            {selectedJob && (
                                <div>
                                    <label htmlFor="job-description" className="block text-sm font-medium text-gray-700">
                                        Job Description
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="job-description"
                                            name="job-description"
                                            rows={5}
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Paste the full job description here (optional but recommended for better question tailoring)"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Question Categories</h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Select the types of questions you want to practice. You can select multiple categories.
                    </p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="motivational"
                                    name="motivational"
                                    type="checkbox"
                                    checked={categories.includes('Motivational')}
                                    onChange={() => handleCategoryToggle('Motivational')}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="motivational" className="font-medium text-gray-700">Motivational</label>
                                <p className="text-gray-500">Why this company? Why this role? Career goals</p>
                            </div>
                        </div>

                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="behavioral"
                                    name="behavioral"
                                    type="checkbox"
                                    checked={categories.includes('Behavioral')}
                                    onChange={() => handleCategoryToggle('Behavioral')}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="behavioral" className="font-medium text-gray-700">Behavioral</label>
                                <p className="text-gray-500">Past experiences, team work, conflict resolution</p>
                            </div>
                        </div>

                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="technical"
                                    name="technical"
                                    type="checkbox"
                                    checked={categories.includes('Technical')}
                                    onChange={() => handleCategoryToggle('Technical')}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="technical" className="font-medium text-gray-700">Technical</label>
                                <p className="text-gray-500">Role-specific skills, problem-solving, domain knowledge</p>
                            </div>
                        </div>

                        <div className="relative flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="personality"
                                    name="personality"
                                    type="checkbox"
                                    checked={categories.includes('Personality')}
                                    onChange={() => handleCategoryToggle('Personality')}
                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="personality" className="font-medium text-gray-700">Personality</label>
                                <p className="text-gray-500">Work style, strengths, weaknesses, values</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={loading || categories.length === 0 || (sessionType === 'job-specific' && !selectedJob)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Starting Session...' : 'Start Practice Session'}
                </button>
            </div>
        </div>
    );
};

export default SessionSetup;
