// src/components/jobs/JobTracker.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getJobs } from '../../services/firebase/firestore';
import { Job, JobStatus } from '../../types';
import { toast } from 'react-hot-toast';
import JobItem from './JobItem';

const JobTracker: React.FC = () => {
    const { currentUser } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<JobStatus | 'All'>('All');

    useEffect(() => {
        const fetchJobs = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const userJobs = await getJobs(currentUser.uid);
                setJobs(userJobs);
            } catch (error) {
                console.error('Error fetching jobs:', error);
                toast.error('Failed to load your jobs. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [currentUser]);

    const filteredJobs = filter === 'All'
        ? jobs
        : jobs.filter(job => job.status === filter);

    const jobStatusCounts = jobs.reduce((counts, job) => {
        counts[job.status] = (counts[job.status] || 0) + 1;
        return counts;
    }, {} as Record<JobStatus, number>);

    const totalJobs = jobs.length;

    if (loading && jobs.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Job Tracker</h1>
                <Link
                    to="/jobs/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add New Job
                </Link>
            </div>

            {/* Stats */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Job Application Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Jobs</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalJobs}</dd>
                            </div>
                        </div>
                        <div className="bg-blue-50 overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-blue-500 truncate">Drafted</dt>
                                <dd className="mt-1 text-3xl font-semibold text-blue-900">{jobStatusCounts.Drafted || 0}</dd>
                            </div>
                        </div>
                        <div className="bg-yellow-50 overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-yellow-500 truncate">Submitted</dt>
                                <dd className="mt-1 text-3xl font-semibold text-yellow-900">{jobStatusCounts.Submitted || 0}</dd>
                            </div>
                        </div>
                        <div className="bg-purple-50 overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-purple-500 truncate">Interviewing</dt>
                                <dd className="mt-1 text-3xl font-semibold text-purple-900">{jobStatusCounts.Interviewing || 0}</dd>
                            </div>
                        </div>
                        <div className="bg-green-50 overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-green-500 truncate">Offers</dt>
                                <dd className="mt-1 text-3xl font-semibold text-green-900">{jobStatusCounts.Offer || 0}</dd>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white shadow rounded-lg mb-6">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilter('All')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'All'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            All Jobs ({totalJobs})
                        </button>
                        <button
                            onClick={() => setFilter('Drafted')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'Drafted'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Drafted ({jobStatusCounts.Drafted || 0})
                        </button>
                        <button
                            onClick={() => setFilter('Submitted')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'Submitted'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Submitted ({jobStatusCounts.Submitted || 0})
                        </button>
                        <button
                            onClick={() => setFilter('Interviewing')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'Interviewing'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Interviewing ({jobStatusCounts.Interviewing || 0})
                        </button>
                        <button
                            onClick={() => setFilter('Offer')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'Offer'
                                    ? 'bg-green-100 text-green-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Offers ({jobStatusCounts.Offer || 0})
                        </button>
                        <button
                            onClick={() => setFilter('Rejected')}
                            className={`px-3 py-2 rounded-md text-sm font-medium ${filter === 'Rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Rejected ({jobStatusCounts.Rejected || 0})
                        </button>
                    </div>
                </div>
            </div>

            {/* Job list */}
            {filteredJobs.length === 0 ? (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    {jobs.length > 0 ? (
                        <p className="text-gray-500">
                            No jobs match your current filter. Try selecting a different status filter.
                        </p>
                    ) : (
                        <p className="text-gray-500">
                            You haven't added any jobs yet. Click the "Add New Job" button to get started.
                        </p>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <JobItem key={job.id} job={job} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default JobTracker;
