// src/components/profile/ProfileSetup.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parsePdfText } from '../../utils/pdfParser';
import { extractResumeInfo, beautifyProfile } from '../../services/openai/functions';
import { createUserProfile, getUserProfile, updateUserProfile } from '../../services/firebase/firestore';
import { UserProfile, Education, WorkExperience, Project, Skill, Extracurricular } from '../../types';
import { toast } from 'react-hot-toast';

// Sub-components
import EducationForm from './forms/EducationForm';
import WorkExperienceForm from './forms/WorkExperienceForm';
import ProjectForm from './forms/ProjectForm';
import SkillForm from './forms/SkillForm';
import ExtracurricularForm from './forms/ExtracurricularForm';

const ProfileSetup: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [processingResume, setProcessingResume] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalManualInputs, setOriginalManualInputs] = useState<Set<string>>(new Set());
    const [debugInfo, setDebugInfo] = useState<any>(null);

    // Profile state
    const [profile, setProfile] = useState<Partial<UserProfile>>({
        uid: currentUser?.uid || '',
        name: '',
        email: currentUser?.email || '',
        phone: '',
        location: '',
        summary: '',
        education: [],
        workExperience: [],
        projects: [],
        skills: [],
        extracurriculars: [],
        additionalInfo: ''
    });

    // Fetch existing profile data when component mounts
    useEffect(() => {
        const fetchExistingProfile = async () => {
            if (!currentUser) return;

            try {
                setLoading(true);
                const existingProfile = await getUserProfile(currentUser.uid);

                if (existingProfile) {
                    setProfile(existingProfile);
                    setIsEditMode(true);
                    // Initialize all fields as manually entered since they're coming from saved profile
                    const manualFields = new Set<string>();
                    Object.keys(existingProfile).forEach(key => {
                        if (key !== 'uid' && key !== 'createdAt' && key !== 'updatedAt') {
                            manualFields.add(key);
                        }
                    });
                    setOriginalManualInputs(manualFields);
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                toast.error('Failed to load your profile. Starting with a blank form.');
            } finally {
                setLoading(false);
            }
        };

        fetchExistingProfile();
    }, [currentUser]);

    // Track which fields have been manually edited
    const trackManualInput = (fieldName: string) => {
        setOriginalManualInputs(prev => {
            const updated = new Set(prev);
            updated.add(fieldName);
            return updated;
        });
    };

    // Resume upload handling with improved logic
    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        try {
            setProcessingResume(true);
            toast.loading('Processing your resume...');

            // Parse PDF to text
            const resumeText = await parsePdfText(file);
            console.log("Extracted resume text (first 200 chars):", resumeText.substring(0, 200));

            // Extract resume information using OpenAI
            const extractedInfo = await extractResumeInfo(resumeText);
            console.log("Extracted resume info:", extractedInfo);

            // Update profile state with extracted information, using improved logic
            setProfile(prev => {
                const updated = { ...prev };

                // For each field in extractedInfo, update if current value is empty
                Object.entries(extractedInfo).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        if (Array.isArray(value)) {
                            // For arrays (education, work experience, etc.)
                            const currentArray = updated[key as keyof UserProfile] as any[] || [];
                            if (currentArray.length === 0 && value.length > 0) {
                                // Only update if current array is empty and extracted array has values
                                updated[key as keyof UserProfile] = value as any;
                            }
                        } else {
                            // For simple fields (name, email, etc.)
                            const currentValue = updated[key as keyof UserProfile];
                            if ((!currentValue || currentValue === '') && value) {
                                // Only update if current value is empty and extracted value exists
                                updated[key as keyof UserProfile] = value as any;
                            }
                        }
                    }
                });

                // Store debug info for transparency
                setDebugInfo({
                    extractedInfo,
                    resumeTextPreview: resumeText.substring(0, 500) + "...",
                });

                return updated;
            });

            toast.dismiss();
            toast.success('Resume processed successfully! Empty fields have been filled with resume data.');
        } catch (error) {
            console.error('Error processing resume:', error);
            toast.dismiss();
            toast.error('Failed to process resume. Please try again or enter details manually.');
        } finally {
            setProcessingResume(false);
        }
    };

    // Beautify profile
    const handleBeautifyProfile = async () => {
        try {
            setLoading(true);
            toast.loading('Enhancing your profile with AI...');

            // Store original values for comparison
            const originalSummary = profile.summary;

            const enhancedProfile = await beautifyProfile(profile as UserProfile);

            // Track which fields were enhanced
            const changedFields: string[] = [];
            Object.keys(enhancedProfile).forEach(key => {
                if (JSON.stringify(enhancedProfile[key as keyof UserProfile]) !==
                    JSON.stringify(profile[key as keyof UserProfile])) {
                    changedFields.push(key);
                }
            });

            setProfile(prev => ({
                ...prev,
                ...enhancedProfile
            }));

            toast.dismiss();

            if (changedFields.length > 0) {
                // More informative success message
                toast.success(`Profile enhanced! Improvements made to your ${changedFields.join(', ')}. These changes will be saved when you complete setup.`,
                    { duration: 5000 });

                // Apply visual highlights to changed fields
                setTimeout(() => {
                    changedFields.forEach(field => {
                        // Find any textareas or inputs for this field
                        const elements = document.querySelectorAll(`[name="${field}"], #${field}`);
                        elements.forEach(element => {
                            if (element instanceof HTMLElement) {
                                element.style.borderColor = '#4f46e5';
                                element.style.backgroundColor = '#EEF2FF';
                                setTimeout(() => {
                                    element.style.backgroundColor = '';
                                    element.style.transition = 'background-color 1s ease-out';
                                }, 100);
                            }
                        });
                    });
                }, 500);
            } else {
                toast.success('Profile is already well-crafted! No significant improvements needed.');
            }
        } catch (error) {
            console.error('Error beautifying profile:', error);
            toast.dismiss();
            toast.error('Failed to enhance profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // Track this field as manually entered
        trackManualInput(name);

        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Education handlers
    const addEducation = (education: Education) => {
        trackManualInput('education');
        setProfile(prev => ({
            ...prev,
            education: [...(prev.education || []), education]
        }));
    };

    const updateEducation = (index: number, education: Education) => {
        trackManualInput('education');
        setProfile(prev => {
            const updatedEducation = [...(prev.education || [])];
            updatedEducation[index] = education;
            return {
                ...prev,
                education: updatedEducation
            };
        });
    };

    const removeEducation = (index: number) => {
        trackManualInput('education');
        setProfile(prev => {
            const updatedEducation = [...(prev.education || [])];
            updatedEducation.splice(index, 1);
            return {
                ...prev,
                education: updatedEducation
            };
        });
    };

    // Work Experience handlers
    const addWorkExperience = (experience: WorkExperience) => {
        trackManualInput('workExperience');
        setProfile(prev => ({
            ...prev,
            workExperience: [...(prev.workExperience || []), experience]
        }));
    };

    const updateWorkExperience = (index: number, experience: WorkExperience) => {
        trackManualInput('workExperience');
        setProfile(prev => {
            const updatedExperience = [...(prev.workExperience || [])];
            updatedExperience[index] = experience;
            return {
                ...prev,
                workExperience: updatedExperience
            };
        });
    };

    const removeWorkExperience = (index: number) => {
        trackManualInput('workExperience');
        setProfile(prev => {
            const updatedExperience = [...(prev.workExperience || [])];
            updatedExperience.splice(index, 1);
            return {
                ...prev,
                workExperience: updatedExperience
            };
        });
    };

    // Project handlers
    const addProject = (project: Project) => {
        trackManualInput('projects');
        setProfile(prev => ({
            ...prev,
            projects: [...(prev.projects || []), project]
        }));
    };

    const updateProject = (index: number, project: Project) => {
        trackManualInput('projects');
        setProfile(prev => {
            const updatedProjects = [...(prev.projects || [])];
            updatedProjects[index] = project;
            return {
                ...prev,
                projects: updatedProjects
            };
        });
    };

    const removeProject = (index: number) => {
        trackManualInput('projects');
        setProfile(prev => {
            const updatedProjects = [...(prev.projects || [])];
            updatedProjects.splice(index, 1);
            return {
                ...prev,
                projects: updatedProjects
            };
        });
    };

    // Skill handlers
    const addSkill = (skill: Skill) => {
        trackManualInput('skills');
        setProfile(prev => ({
            ...prev,
            skills: [...(prev.skills || []), skill]
        }));
    };

    const updateSkill = (index: number, skill: Skill) => {
        trackManualInput('skills');
        setProfile(prev => {
            const updatedSkills = [...(prev.skills || [])];
            updatedSkills[index] = skill;
            return {
                ...prev,
                skills: updatedSkills
            };
        });
    };

    const removeSkill = (index: number) => {
        trackManualInput('skills');
        setProfile(prev => {
            const updatedSkills = [...(prev.skills || [])];
            updatedSkills.splice(index, 1);
            return {
                ...prev,
                skills: updatedSkills
            };
        });
    };

    // Extracurricular handlers
    const addExtracurricular = (extracurricular: Extracurricular) => {
        trackManualInput('extracurriculars');
        setProfile(prev => ({
            ...prev,
            extracurriculars: [...(prev.extracurriculars || []), extracurricular]
        }));
    };

    const updateExtracurricular = (index: number, extracurricular: Extracurricular) => {
        trackManualInput('extracurriculars');
        setProfile(prev => {
            const updatedExtracurriculars = [...(prev.extracurriculars || [])];
            updatedExtracurriculars[index] = extracurricular;
            return {
                ...prev,
                extracurriculars: updatedExtracurriculars
            };
        });
    };

    const removeExtracurricular = (index: number) => {
        trackManualInput('extracurriculars');
        setProfile(prev => {
            const updatedExtracurriculars = [...(prev.extracurriculars || [])];
            updatedExtracurriculars.splice(index, 1);
            return {
                ...prev,
                extracurriculars: updatedExtracurriculars
            };
        });
    };

    // Submit profile
    const handleSubmitProfile = async () => {
        try {
            setLoading(true);

            // Validate required fields
            if (!profile.name || !profile.email) {
                toast.error('Please fill in your name and email');
                return;
            }

            if (isEditMode) {
                // Update existing profile
                await updateUserProfile(profile as UserProfile);
                toast.success('Profile updated successfully!');
            } else {
                // Create new profile
                await createUserProfile(profile as UserProfile);
                toast.success('Profile created successfully!');
            }

            navigate('/dashboard');
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} profile. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Step navigation
    const handleNext = () => {
        setActiveStep(prev => prev + 1);
    };

    const handleBack = () => {
        setActiveStep(prev => prev - 1);
    };

    // Step content
    const steps = [
        {
            label: 'Upload Resume or Enter Basic Info',
            content: (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Resume (PDF)</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload your resume in PDF format and we'll automatically extract the information.
                            Any fields you've already filled in will be preserved, and empty fields will be populated with data from your resume.
                        </p>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            disabled={processingResume}
                            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {processingResume && <p className="mt-2 text-sm text-indigo-600">Processing your resume...</p>}
                        
                        {/* Debug info section - you can remove this in production */}
                        {debugInfo && (
                            <div className="mt-4 p-3 bg-gray-100 rounded-md">
                                <details>
                                    <summary className="text-xs font-medium text-gray-700 cursor-pointer">Resume Processing Details</summary>
                                    <div className="mt-2 text-xs overflow-auto max-h-40">
                                        <p className="font-semibold mt-1">Fields extracted:</p>
                                        <ul className="list-disc list-inside">
                                            {Object.keys(debugInfo.extractedInfo).map(key => (
                                                <li key={key}>
                                                    {key}: {typeof debugInfo.extractedInfo[key] === 'object' 
                                                        ? (Array.isArray(debugInfo.extractedInfo[key]) 
                                                            ? `${debugInfo.extractedInfo[key].length} items` 
                                                            : 'Object') 
                                                        : String(debugInfo.extractedInfo[key]).substring(0, 50)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Full Name*
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    value={profile.name || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email*
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    id="email"
                                    value={profile.email || ''}
                                    onChange={handleInputChange}
                                    required
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    id="phone"
                                    value={profile.phone || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    id="location"
                                    value={profile.location || ''}
                                    onChange={handleInputChange}
                                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                    placeholder="City, State/Province, Country"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                                Professional Summary
                            </label>
                            <textarea
                                name="summary"
                                id="summary"
                                rows={4}
                                value={profile.summary || ''}
                                onChange={handleInputChange}
                                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                                placeholder="Brief overview of your professional background and career goals"
                            />
                        </div>
                    </div>
                </div>
            )
        },
        // Rest of the steps remain unchanged
        {
            label: 'Education',
            content: (
                <EducationForm
                    education={profile.education || []}
                    onAdd={addEducation}
                    onUpdate={updateEducation}
                    onRemove={removeEducation}
                />
            )
        },
        {
            label: 'Work Experience',
            content: (
                <WorkExperienceForm
                    experiences={profile.workExperience || []}
                    onAdd={addWorkExperience}
                    onUpdate={updateWorkExperience}
                    onRemove={removeWorkExperience}
                />
            )
        },
        {
            label: 'Projects',
            content: (
                <ProjectForm
                    projects={profile.projects || []}
                    onAdd={addProject}
                    onUpdate={updateProject}
                    onRemove={removeProject}
                />
            )
        },
        {
            label: 'Skills',
            content: (
                <SkillForm
                    skills={profile.skills || []}
                    onAdd={addSkill}
                    onUpdate={updateSkill}
                    onRemove={removeSkill}
                />
            )
        },
        {
            label: 'Extracurriculars',
            content: (
                <ExtracurricularForm
                    extracurriculars={profile.extracurriculars || []}
                    onAdd={addExtracurricular}
                    onUpdate={updateExtracurricular}
                    onRemove={removeExtracurricular}
                />
            )
        },
        {
            label: 'Additional Information',
            content: (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700">
                            Additional Information
                        </label>
                        <textarea
                            name="additionalInfo"
                            id="additionalInfo"
                            rows={6}
                            value={profile.additionalInfo || ''}
                            onChange={handleInputChange}
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Any other information you'd like to include (certifications, languages, interests, etc.)"
                        />
                    </div>

                    <div className="bg-indigo-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium text-indigo-900 mb-2">Beautify My Profile</h3>
                        <p className="text-sm text-indigo-700 mb-4">
                            Let our AI enhance your profile content with better phrasing, structure, and emphasis.
                            This can help polish your resume bullets and create LinkedIn-style summaries.
                        </p>
                        <button
                            type="button"
                            onClick={handleBeautifyProfile}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? 'Enhancing...' : 'Beautify My Profile'}
                        </button>
                    </div>
                </div>
            )
        },
        {
            label: 'Review & Submit',
            content: (
                <div className="space-y-6">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Summary</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Review your profile before submitting.</p>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-gray-200">
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Full name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.name}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.email}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.phone || 'Not provided'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.location || 'Not provided'}</dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Education</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {profile.education && profile.education.length > 0 ? (
                                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                                {profile.education.map((edu, index) => (
                                                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                        <div className="w-0 flex-1 flex items-center">
                                                            <span className="ml-2 flex-1 w-0 truncate">
                                                                {edu.degree} in {edu.field}, {edu.institution}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'No education details provided'
                                        )}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Work Experience</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {profile.workExperience && profile.workExperience.length > 0 ? (
                                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                                {profile.workExperience.map((exp, index) => (
                                                    <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                                        <div className="w-0 flex-1 flex items-center">
                                                            <span className="ml-2 flex-1 w-0 truncate">
                                                                {exp.position} at {exp.company}
                                                            </span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            'No work experience provided'
                                        )}
                                    </dd>
                                </div>
                                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Skills</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                                        {profile.skills && profile.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {profile.skills.map((skill, index) => (
                                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                        {skill.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            'No skills provided'
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>
                                        {isEditMode
                                            ? 'You are updating your existing profile. Make sure all required fields are filled in correctly.'
                                            : 'Once you submit your profile, you\'ll be able to edit it later from the "My Profile" section. Make sure all required fields are filled in correctly.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        {isEditMode ? 'Edit Your Profile' : 'Complete Your Profile'}
                    </h1>
                    <p className="mt-3 text-xl text-gray-500">
                        {isEditMode
                            ? 'Update your information to get better tailored interview questions.'
                            : 'Help us understand your background to provide tailored interview questions.'}
                    </p>
                </div>

                {/* Progress indicator */}
                <div className="mb-8">
                    <nav aria-label="Progress">
                        <ol className="flex items-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.label} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                                    {activeStep > stepIdx ? (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-indigo-600" />
                                            </div>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setActiveStep(stepIdx);
                                                }}
                                                className="relative w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full hover:bg-indigo-900"
                                            >
                                                <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="sr-only">{step.label}</span>
                                            </a>
                                        </>
                                    ) : activeStep === stepIdx ? (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-gray-200" />
                                            </div>
                                            <a
                                                href="#"
                                                onClick={(e) => e.preventDefault()}
                                                className="relative w-8 h-8 flex items-center justify-center bg-white border-2 border-indigo-600 rounded-full"
                                                aria-current="step"
                                            >
                                                <span className="h-2.5 w-2.5 bg-indigo-600 rounded-full" aria-hidden="true" />
                                                <span className="sr-only">{step.label}</span>
                                            </a>
                                        </>

                                    ) : (
                                        <>
                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                <div className="h-0.5 w-full bg-gray-200" />
                                            </div>
                                            <a
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setActiveStep(stepIdx);
                                                }}
                                                className="group relative w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:border-gray-400"
                                            >
                                                <span className="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300" aria-hidden="true" />
                                                <span className="sr-only">{step.label}</span>
                                            </a>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {/* Step content */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">{steps[activeStep].label}</h2>
                    {steps[activeStep].content}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={activeStep === 0}
                        className={`${activeStep === 0 ? 'invisible' : ''
                            } inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                        Back
                    </button>

                    {activeStep === steps.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleSubmitProfile}
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {loading ? 'Submitting...' : isEditMode ? 'Update Profile' : 'Submit Profile'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSetup;