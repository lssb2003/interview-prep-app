// src/components/answers/AnswerLibrary.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAnswers, getJobs, updateAnswer, deleteAnswer } from '../../services/firebase/firestore';
import { getAnswerFeedback, suggestTags } from '../../services/openai/functions';
import { QuestionCategory, Answer, Job } from '../../types';
import { toast } from 'react-hot-toast';

const AnswerLibrary: React.FC = () => {
    const { currentUser } = useAuth();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAnswer, setEditingAnswer] = useState<Answer | null>(null);
    const [editedText, setEditedText] = useState('');
    const [regeneratingFeedback, setRegeneratingFeedback] = useState(false);

    // Filtering state
    const [selectedTags, setSelectedTags] = useState<{ [tag: string]: boolean }>({});
    const [excludedTags, setExcludedTags] = useState<{ [tag: string]: boolean }>({});
    const [selectedCategories, setSelectedCategories] = useState<QuestionCategory[]>([]);
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch answers and jobs on component mount
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);

                // Fetch answers
                const userAnswers = await getAnswers(currentUser.uid);
                setAnswers(userAnswers);

                // Fetch jobs
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load your answers. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Extract all unique tags from answers
    const allTags = useMemo(() => {
        const tagsSet = new Set<string>();
        answers.forEach((answer) => {
            answer.tags.forEach((tag) => {
                tagsSet.add(tag);
            });
        });
        return Array.from(tagsSet).sort();
    }, [answers]);

    // Filter answers based on current filter settings
    const filteredAnswers = useMemo(() => {
        return answers.filter((answer) => {
            // Filter by favorites
            if (showOnlyFavorites && !answer.isFavorite) {
                return false;
            }

            // Filter by job
            if (selectedJob && answer.jobId !== selectedJob) {
                return false;
            }

            // Filter by categories
            if (selectedCategories.length > 0 && !selectedCategories.includes(answer.category)) {
                return false;
            }

            // Filter by included tags
            const selectedTagsList = Object.keys(selectedTags).filter(tag => selectedTags[tag]);
            if (selectedTagsList.length > 0) {
                const hasAllSelectedTags = selectedTagsList.every(tag => answer.tags.includes(tag));
                if (!hasAllSelectedTags) {
                    return false;
                }
            }

            // Filter by excluded tags
            const excludedTagsList = Object.keys(excludedTags).filter(tag => excludedTags[tag]);
            if (excludedTagsList.length > 0) {
                const hasExcludedTag = excludedTagsList.some(tag => answer.tags.includes(tag));
                if (hasExcludedTag) {
                    return false;
                }
            }

            // Filter by search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesQuestion = answer.questionText.toLowerCase().includes(query);
                const matchesAnswer = answer.answerText.toLowerCase().includes(query);
                if (!matchesQuestion && !matchesAnswer) {
                    return false;
                }
            }

            return true;
        });
    }, [
        answers,
        showOnlyFavorites,
        selectedJob,
        selectedCategories,
        selectedTags,
        excludedTags,
        searchQuery
    ]);

    // Toggle tag in filter (include/exclude/none)
    const toggleTagFilter = (tag: string) => {
        if (selectedTags[tag]) {
            // If currently included, switch to excluded
            setSelectedTags(prev => ({ ...prev, [tag]: false }));
            setExcludedTags(prev => ({ ...prev, [tag]: true }));
        } else if (excludedTags[tag]) {
            // If currently excluded, remove from filters
            setExcludedTags(prev => ({ ...prev, [tag]: false }));
        } else {
            // If not filtered, include it
            setSelectedTags(prev => ({ ...prev, [tag]: true }));
        }
    };

    // Toggle category in filter
    const toggleCategoryFilter = (category: QuestionCategory) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(c => c !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    // Toggle favorite status of an answer
    const toggleFavorite = async (answer: Answer) => {
        try {
            const updatedAnswer = { ...answer, isFavorite: !answer.isFavorite };
            await updateAnswer(updatedAnswer);

            // Update local state
            setAnswers(prev =>
                prev.map(a => a.id === answer.id ? updatedAnswer : a)
            );
        } catch (error) {
            console.error('Error updating favorite status:', error);
            toast.error('Failed to update favorite status.');
        }
    };

    // Edit answer
    const startEditingAnswer = (answer: Answer) => {
        setEditingAnswer(answer);
        setEditedText(answer.answerText);
    };

    const saveEditedAnswer = async () => {
        if (!editingAnswer) return;

        try {
            const updatedAnswer = { ...editingAnswer, answerText: editedText };
            await updateAnswer(updatedAnswer);

            // Update local state
            setAnswers(prev =>
                prev.map(a => a.id === updatedAnswer.id ? updatedAnswer : a)
            );

            setEditingAnswer(null);
            toast.success('Answer updated successfully!');
        } catch (error) {
            console.error('Error updating answer:', error);
            toast.error('Failed to update answer.');
        }
    };

    // Delete answer
    const handleDeleteAnswer = async (answerId: string) => {
        if (!window.confirm('Are you sure you want to delete this answer? This action cannot be undone.')) {
            return;
        }

        try {
            await deleteAnswer(answerId);

            // Update local state
            setAnswers(prev => prev.filter(a => a.id !== answerId));
            toast.success('Answer deleted successfully!');
        } catch (error) {
            console.error('Error deleting answer:', error);
            toast.error('Failed to delete answer.');
        }
    };

    // Regenerate feedback for an answer
    const regenerateFeedback = async (answer: Answer) => {
        try {
            setRegeneratingFeedback(true);
            toast.loading('Regenerating AI feedback...');

            // Get the job details if this answer is associated with a job
            const jobDetails = answer.jobId
                ? jobs.find(job => job.id === answer.jobId)
                : undefined;

            // Get new feedback using OpenAI
            const newFeedback = await getAnswerFeedback(
                answer.questionText,
                answer.answerText,
                { uid: currentUser!.uid } as any, // We only need the user ID for this call
                jobDetails
            );

            // Update the answer with new feedback
            const updatedAnswer = { ...answer, feedback: newFeedback };
            await updateAnswer(updatedAnswer);

            // Update local state
            setAnswers(prev =>
                prev.map(a => a.id === updatedAnswer.id ? updatedAnswer : a)
            );

            toast.dismiss();
            toast.success('Feedback regenerated successfully!');
        } catch (error) {
            console.error('Error regenerating feedback:', error);
            toast.dismiss();
            toast.error('Failed to regenerate feedback.');
        } finally {
            setRegeneratingFeedback(false);
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setSelectedTags({});
        setExcludedTags({});
        setSelectedCategories([]);
        setSelectedJob('');
        setShowOnlyFavorites(false);
        setSearchQuery('');
    };

    // Get job name by ID
    const getJobName = (jobId: string) => {
        const job = jobs.find(j => j.id === jobId);
        return job ? `${job.title} at ${job.company}` : 'Unknown Job';
    };

    // Get category badge color
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

    if (loading && answers.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Answer Library</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Filters sidebar - Modified for independent scrolling */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg sticky top-4" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
                        <div className="px-4 py-5 sm:px-6">
                            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Refine your saved answers
                            </p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-6 space-y-6">
                            {/* Search */}
                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                                    Search
                                </label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        name="search"
                                        id="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Search in questions & answers"
                                    />
                                </div>
                            </div>

                            {/* Favorites filter */}
                            <div>
                                <div className="relative flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            id="favorites"
                                            name="favorites"
                                            type="checkbox"
                                            checked={showOnlyFavorites}
                                            onChange={() => setShowOnlyFavorites(!showOnlyFavorites)}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="favorites" className="font-medium text-gray-700">
                                            Favorites Only
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Job filter */}
                            <div>
                                <label htmlFor="job-filter" className="block text-sm font-medium text-gray-700">
                                    Job
                                </label>
                                <select
                                    id="job-filter"
                                    name="job-filter"
                                    value={selectedJob}
                                    onChange={(e) => setSelectedJob(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">All Jobs</option>
                                    <option value="general">General (No Specific Job)</option>
                                    {jobs.map((job) => (
                                        <option key={job.id} value={job.id}>
                                            {job.title} at {job.company}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Category filter */}
                            <div>
                                <span className="block text-sm font-medium text-gray-700 mb-2">
                                    Categories
                                </span>
                                <div className="space-y-2">
                                    {(['Motivational', 'Behavioral', 'Technical', 'Personality'] as QuestionCategory[]).map((category) => (
                                        <div key={category} className="relative flex items-start">
                                            <div className="flex items-center h-5">
                                                <input
                                                    id={`category-${category}`}
                                                    name={`category-${category}`}
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category)}
                                                    onChange={() => toggleCategoryFilter(category)}
                                                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm">
                                                <label htmlFor={`category-${category}`} className="font-medium text-gray-700">
                                                    {category}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tags filter */}
                            {allTags.length > 0 && (
                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-2">
                                        Tags
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => toggleTagFilter(tag)}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedTags[tag]
                                                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500'
                                                        : excludedTags[tag]
                                                            ? 'bg-red-100 text-red-800 border-2 border-red-500'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {tag}
                                                {selectedTags[tag] && (
                                                    <span className="ml-1 text-xs text-indigo-600">✓</span>
                                                )}
                                                {excludedTags[tag] && (
                                                    <span className="ml-1 text-xs text-red-600">✕</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Click to include (✓), click again to exclude (✕), click again to remove filter
                                    </p>
                                </div>
                            )}

                            {/* Reset filters */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Reset All Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Answers list - Making this scrollable independently */}
                <div className="lg:col-span-3" style={{ maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto' }}>
                    {filteredAnswers.length === 0 ? (
                        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No answers found</h3>
                            {answers.length > 0 ? (
                                <p className="text-gray-500">
                                    No answers match your current filters. Try adjusting your filters or{' '}
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        reset all filters
                                    </button>
                                    .
                                </p>
                            ) : (
                                <p className="text-gray-500">
                                    You haven't saved any answers yet. Start a{' '}
                                    <a href="/practice/setup" className="text-indigo-600 hover:text-indigo-900">
                                        practice session
                                    </a>{' '}
                                    to begin building your answer library.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredAnswers.map((answer) => (
                                <div key={answer.id} className="bg-white shadow overflow-hidden sm:rounded-lg">
                                    <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center mb-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(answer.category)}`}>
                                                    {answer.category}
                                                </span>
                                                {answer.jobId && (
                                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {getJobName(answer.jobId)}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {answer.questionText}
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(answer)}
                                            className={`${answer.isFavorite ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-yellow-400'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                                        {editingAnswer && editingAnswer.id === answer.id ? (
                                            <div>
                                                <textarea
                                                    rows={6}
                                                    value={editedText}
                                                    onChange={(e) => setEditedText(e.target.value)}
                                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md mb-4"
                                                />
                                                <div className="flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingAnswer(null)}
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={saveEditedAnswer}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-sm text-gray-900 whitespace-pre-line mb-4">
                                                    {answer.answerText}
                                                </p>

                                                {answer.feedback && (
                                                    <div className="bg-indigo-50 p-4 rounded-md mb-4">
                                                        <h4 className="text-sm font-medium text-indigo-900 mb-2">AI Feedback</h4>
                                                        <p className="text-sm text-indigo-800 whitespace-pre-line">
                                                            {answer.feedback}
                                                        </p>
                                                    </div>
                                                )}

                                                {answer.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {answer.tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditingAnswer(answer)}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Edit Answer
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => regenerateFeedback(answer)}
                                                        disabled={regeneratingFeedback}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                                    >
                                                        Regenerate Feedback
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAnswer(answer.id)}
                                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnswerLibrary;