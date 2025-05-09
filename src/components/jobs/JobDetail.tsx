// src/components/jobs/JobDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getJob, updateJob, deleteJob, getAnswersByJob } from '../../services/firebase/firestore';
import { Job, JobStatus, Answer } from '../../types';
import { toast } from 'react-hot-toast';

const JobDetail: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [job, setJob] = useState<Job | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Job>>({});

    useEffect(() => {
        const fetchJobData = async () => {
            if (!jobId || !currentUser) return;

            try {
                setLoading(true);

                // Fetch job details
                const jobData = await getJob(jobId);

                if (!jobData) {
                    toast.error('Job not found');
                    return navigate('/jobs');
                }

                if (jobData.userId !== currentUser.uid) {
                    toast.error('You do not have access to this job');
                    return navigate('/jobs');
                }

                setJob(jobData);
                setFormData(jobData);

                // Fetch answers associated with this job
                const jobAnswers = await getAnswersByJob(currentUser.uid, jobId);
                setAnswers(jobAnswers);
            } catch (error) {
                console.error('Error fetching job data:', error);
                toast.error('Failed to load job details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobData();
    }, [jobId, currentUser, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleUpdateJob = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!job) return;

        try {
            setLoading(true);

            await updateJob({
                id: job.id,
                ...formData
            });

            setJob(prev => prev ? { ...prev, ...formData } : null);
            setEditing(false);
            toast.success('Job updated successfully!');
        } catch (error) {
            console.error('Error updating job:', error);
            toast.error('Failed to update job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async () => {
        if (!job) return;

        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);

            await deleteJob(job.id);

            toast.success('Job deleted successfully!');
            navigate('/jobs');
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('Failed to delete job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startPracticeSession = () => {
        navigate(`/practice/setup?job=${job?.id}`);
    };

    if (loading && !job) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Job not found</h1>
                <p className="mb-4">The job you're looking for doesn't exist or you don't have access to it.</p>
                <Link
                    to="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Back to Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <Link
                        to="/jobs"
                        className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">{editing ? 'Edit Job' : job.title}</h1>
                </div>
                {!editing && (
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={startPracticeSession}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Practice for this Job
                        </button>
                    </div>
                )}
            </div>

            {editing ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <form onSubmit={handleUpdateJob}>
                        <div className="px-4 py-5 sm:p-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-6">
                                <div className="sm:col-span-3">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Job Title
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="title"
                                            id="title"
                                            value={formData.title || ''}
                                            onChange={handleInputChange}
                                            required
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                                        Company
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="company"
                                            id="company"
                                            value={formData.company || ''}
                                            onChange={handleInputChange}
                                            required
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <div className="mt-1">
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status || 'Drafted'}
                                            onChange={handleInputChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        >
                                            <option value="Drafted">Drafted</option>
                                            <option value="Submitted">Submitted</option>
                                            <option value="Interviewing">Interviewing</option>
                                            <option value="Offer">Offer</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Job Description
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={8}
                                            value={formData.description || ''}
                                            onChange={handleInputChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Paste the job description here"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-6">
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                        Notes
                                    </label>
                                    <div className="mt-1">
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows={4}
                                            value={formData.notes || ''}
                                            onChange={handleInputChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Add any notes about this job (recruiter info, interview details, etc.)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
                            <button
                                type="button"
                                onClick={handleDeleteJob}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete Job
                            </button>
                            <div className="space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setEditing(false)}
                                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6 flex justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">{job.title}</h2>
                                <p className="mt-1 max-w-2xl text-sm text-gray-500">{job.company}</p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${job.status === 'Drafted' ? 'bg-blue-100 text-blue-800' :
                                    job.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                                        job.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                                            job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                }`}>
                                {job.status}
                            </span>
                        </div>
                        <div className="border-t border-gray-200">
                            <dl>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Job Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                        {job.description || 'No description provided'}
                                    </dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                                        {job.notes || 'No notes added'}
                                    </dd>
                                </div>
                                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Date Added</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </dd>
                                </div>
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {new Date(job.updatedAt).toLocaleDateString()}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h2 className="text-lg font-medium text-gray-900">Saved Answers for this Job</h2>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Practice responses you've saved for this specific job
                            </p>
                        </div>
                        <div className="border-t border-gray-200">
                            {answers.length === 0 ? (
                                <div className="px-4 py-5 sm:px-6 text-center">
                                    <p className="text-sm text-gray-500 mb-4">
                                        You haven't saved any answers for this job yet.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={startPracticeSession}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Start Practice Session
                                    </button>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {answers.map((answer) => (
                                        <li key={answer.id} className="px-4 py-4 sm:px-6">
                                            <div className="mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${answer.category === 'Motivational' ? 'bg-green-100 text-green-800' :
                                                        answer.category === 'Behavioral' ? 'bg-blue-100 text-blue-800' :
                                                            answer.category === 'Technical' ? 'bg-purple-100 text-purple-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {answer.category}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-indigo-600 mb-1">{answer.questionText}</p>
                                            <p className="text-sm text-gray-900 mb-2 line-clamp-3">{answer.answerText}</p>
                                            <Link
                                                to="/answers"
                                                className="text-xs text-indigo-600 hover:text-indigo-900"
                                            >
                                                View full answer →
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default JobDetail;
