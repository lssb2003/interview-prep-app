// src/components/dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, getAnswers, getJobs } from '../../services/firebase/firestore';
import { UserProfile, Answer, Job } from '../../types';
import { toast } from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
        
        // Check if profile is complete, if not redirect to profile setup
        if (!userProfile) {
          // Use toast() instead of toast.info
          toast('Please complete your profile before proceeding');
          navigate('/profile/setup');
          return;
        }
        
        // Fetch recent answers
        const allAnswers = await getAnswers(currentUser.uid);
        setRecentAnswers(allAnswers.slice(0, 5)); // Get 5 most recent
        
        // Fetch jobs
        const userJobs = await getJobs(currentUser.uid);
        setJobs(userJobs);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser, navigate]);
  
  const getJobName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? `${job.title} at ${job.company}` : 'Unknown Job';
  };
  
  const getCategoryBadgeColor = (category: string) => {
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile?.name}!</h1>
        <p className="mt-1 text-gray-500">Your interview preparation dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick actions card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/practice/setup')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Practice Session
              </button>
              <button
                onClick={() => navigate('/jobs/new')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add New Job
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
        
        {/* Recent answers card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recent Answers</h2>
              <p className="mt-1 text-sm text-gray-500">Your latest practice responses</p>
            </div>
            <button
              onClick={() => navigate('/answers')}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              View all
              <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {recentAnswers.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-sm text-gray-500">You haven't saved any answers yet.</p>
                <button
                  onClick={() => navigate('/practice/setup')}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Start practicing
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {recentAnswers.map((answer) => (
                  <li key={answer.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center mb-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(answer.category)}`}>
                        {answer.category}
                      </span>
                      {answer.jobId && (
                        <span className="ml-2 text-xs text-gray-500">
                          {getJobName(answer.jobId)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{answer.questionText}</p>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{answer.answerText}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* Job applications card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Job Applications</h2>
              <p className="mt-1 text-sm text-gray-500">Track your job search progress</p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
            >
              View all
              <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {jobs.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center">
                <p className="text-sm text-gray-500">You haven't added any jobs yet.</p>
                <button
                  onClick={() => navigate('/jobs/new')}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add job
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {jobs.slice(0, 5).map((job) => (
                  <li key={job.id} className="px-4 py-4 sm:px-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-sm text-gray-500">{job.company}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'Drafted' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'Interviewing' ? 'bg-purple-100 text-purple-800' :
                        job.status === 'Offer' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Stats card */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Answers</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{recentAnswers.length}</dd>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Jobs Tracked</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">{jobs.length}</dd>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Job Interviews</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {jobs.filter(job => job.status === 'Interviewing').length}
                </dd>
              </div>
            </div>
            <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Job Offers</dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {jobs.filter(job => job.status === 'Offer').length}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;