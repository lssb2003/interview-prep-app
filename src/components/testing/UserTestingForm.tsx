// src/components/testing/UserTestingForm.tsx
import React, { useState } from 'react';

interface UserFeedback {
  taskNumber: number;
  taskName: string;
  easeOfUse: number;
  confusionPoints: string;
  improvementSuggestions: string;
}

const UserTestingForm: React.FC = () => {
  const [feedbackList, setFeedbackList] = useState<UserFeedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<UserFeedback>({
    taskNumber: 1,
    taskName: 'Account Creation and Profile Setup',
    easeOfUse: 3,
    confusionPoints: '',
    improvementSuggestions: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentFeedback(prev => ({
      ...prev,
      [name]: name === 'easeOfUse' ? parseInt(value) : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add current feedback to the list
    setFeedbackList(prev => [...prev, currentFeedback]);
    
    // Prepare for next task
    const nextTask = currentFeedback.taskNumber + 1;
    let nextTaskName = '';
    
    switch(nextTask) {
      case 2:
        nextTaskName = 'Job Management';
        break;
      case 3:
        nextTaskName = 'Interview Practice';
        break;
      case 4:
        nextTaskName = 'Review Your Answers';
        break;
      default:
        nextTaskName = 'Final Thoughts';
    }
    
    // Reset form for next task
    setCurrentFeedback({
      taskNumber: nextTask,
      taskName: nextTaskName,
      easeOfUse: 3,
      confusionPoints: '',
      improvementSuggestions: ''
    });
  };
  
  const handleExport = () => {
    // Create a JSON file with feedback data
    const dataStr = JSON.stringify(feedbackList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    // Create download link
    const exportFileDefaultName = `user_testing_feedback_${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-xl font-bold mb-6">User Testing Feedback</h1>
      
      {feedbackList.length >= 4 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Thank you for your feedback!</h2>
          <p>You have completed all tasks. Click below to export your feedback.</p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Export Feedback
          </button>
          
          <div className="mt-8">
            <h3 className="font-medium">Your Feedback Summary:</h3>
            <ul className="mt-2 space-y-2">
              {feedbackList.map((fb, index) => (
                <li key={index} className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{fb.taskName}</p>
                  <p>Ease of use: {fb.easeOfUse}/5</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h2 className="text-lg font-medium">
              Task {currentFeedback.taskNumber}: {currentFeedback.taskName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Please complete this task and provide feedback below.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              On a scale of 1-5, how easy was it to complete this task?
            </label>
            <div className="mt-1 flex items-center space-x-4">
              {[1, 2, 3, 4, 5].map(num => (
                <label key={num} className="flex items-center">
                  <input
                    type="radio"
                    name="easeOfUse"
                    value={num}
                    checked={currentFeedback.easeOfUse === num}
                    onChange={handleInputChange}
                    className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{num}</span>
                </label>
              ))}
              <span className="text-xs text-gray-500">(1 = Very Difficult, 5 = Very Easy)</span>
            </div>
          </div>
          
          <div>
            <label htmlFor="confusionPoints" className="block text-sm font-medium text-gray-700">
              What, if anything, was confusing about this process?
            </label>
            <textarea
              id="confusionPoints"
              name="confusionPoints"
              rows={3}
              value={currentFeedback.confusionPoints}
              onChange={handleInputChange}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="improvementSuggestions" className="block text-sm font-medium text-gray-700">
              What would improve this feature?
            </label>
            <textarea
              id="improvementSuggestions"
              name="improvementSuggestions"
              rows={3}
              value={currentFeedback.improvementSuggestions}
              onChange={handleInputChange}
              className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next Task
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserTestingForm;