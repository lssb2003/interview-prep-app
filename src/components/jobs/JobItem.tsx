// src/components/jobs/JobItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../../types';

interface JobItemProps {
    job: Job;
}

const JobItem: React.FC<JobItemProps> = ({ job }) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Drafted':
                return 'bg-blue-100 text-blue-800';
            case 'Submitted':
                return 'bg-yellow-100 text-yellow-800';
            case 'Interviewing':
                return 'bg-purple-100 text-purple-800';
            case 'Offer':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (date: any) => {
        // Check if date is a Firebase timestamp (has seconds and nanoseconds)
        if (date && typeof date === 'object' && date.seconds !== undefined) {
            // Convert Firebase timestamp to JS Date
            return new Date(date.seconds * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        }
        
        // Try parsing as a regular date if it's a string or number
        if (date) {
            const jsDate = new Date(date);
            if (!isNaN(jsDate.getTime())) {
                return jsDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
            }
        }
        
        // Fallback if date is invalid
        return 'Date not available';
    };

    return (
        <Link
            to={`/jobs/${job.id}`}
            className="block hover:shadow-lg transition-shadow duration-200"
        >
            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 h-full">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 truncate">{job.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{job.company}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                    </span>
                </div>
                <div className="px-4 py-4 sm:px-6">
                    <div className="text-sm text-gray-500 mb-2">
                        Added on {formatDate(job.createdAt)}
                    </div>
                    <div className="text-sm text-gray-900 line-clamp-3">
                        {job.description ? job.description.substring(0, 150) + (job.description.length > 150 ? '...' : '') : 'No description provided'}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default JobItem;