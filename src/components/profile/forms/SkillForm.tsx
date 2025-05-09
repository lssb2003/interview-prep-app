// src/components/profile/forms/SkillForm.tsx
import React, { useState } from 'react';
import { Skill } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

interface SkillFormProps {
    skills: Skill[];
    onAdd: (skill: Skill) => void;
    onUpdate: (index: number, skill: Skill) => void;
    onRemove: (index: number) => void;
}

const SkillForm: React.FC<SkillFormProps> = ({
    skills,
    onAdd,
    onUpdate,
    onRemove,
}) => {
    const [formData, setFormData] = useState<Omit<Skill, 'id'>>({
        name: '',
        level: 'Intermediate',
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editIndex !== null) {
            onUpdate(editIndex, { ...skills[editIndex], ...formData });
            setEditIndex(null);
        } else {
            onAdd({ id: uuidv4(), ...formData });
        }

        // Reset form
        setFormData({
            name: '',
            level: 'Intermediate',
        });
    };

    const handleEdit = (index: number) => {
        setFormData(skills[index]);
        setEditIndex(index);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Skills</h3>
                    <p className="mt-1 text-sm text-gray-500">Add your technical and soft skills.</p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Skill Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                        placeholder="E.g., JavaScript, Project Management, Data Analysis"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                    Proficiency Level
                                </label>
                                <div className="mt-1">
                                    <select
                                        id="level"
                                        name="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        name: '',
                                        level: 'Intermediate',
                                    });
                                    setEditIndex(null);
                                }}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {editIndex !== null ? 'Update' : 'Add'} Skill
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {skills.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Your Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                            <div
                                key={skill.id}
                                className="inline-flex items-center bg-indigo-100 rounded-full px-3 py-1 text-sm font-medium text-indigo-800"
                            >
                                {skill.name}
                                {skill.level && (
                                    <span className="ml-1 text-xs text-indigo-600">
                                        ({skill.level})
                                    </span>
                                )}
                                <div className="flex ml-2">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(index)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onRemove(index)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillForm;
