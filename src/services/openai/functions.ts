// src/services/openai/function.ts
import openai from './api';
import { UserProfile, QuestionCategory, Job } from '../../types';

// Extract information from resume PDF
export const extractResumeInfo = async (resumeText: string): Promise<Partial<UserProfile>> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that extracts structured information from resumes. 
          Extract the following details from the provided resume text:
          - Name
          - Email
          - Phone
          - Location
          - Summary (create a compelling professional summary even if one isn't explicitly present in the resume)
          - Education (institution, degree, field, start/end dates, GPA)
          - Work Experience (company, position, start/end dates, description)
          - Projects (name, description, technologies, link)
          - Skills
          - Extracurriculars (name, role, description, dates)
          
          For the Summary, if not explicitly provided, generate a concise, well-written professional summary that highlights the candidate's key qualifications, experience, and career focus based on the resume content.
          
          Format your response as a JSON object with appropriate fields.`
                },
                {
                    role: "user",
                    content: resumeText
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return {};
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return {};
        }
    } catch (error) {
        console.error("Error extracting resume info:", error);
        return {};
    }
};

// Enhance profile content
export const beautifyProfile = async (profile: UserProfile): Promise<Partial<UserProfile>> => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an expert resume writer and career coach that transforms ordinary job profiles into powerful, impactful career documents.
          
ENHANCEMENT GUIDELINES:
1. QUANTIFY ACHIEVEMENTS: Add specific metrics, percentages, and numbers to work experience (e.g., "Increased sales by 27%" instead of "Increased sales")
2. USE POWER VERBS: Replace weak verbs with strong action verbs (e.g., "Spearheaded" instead of "Led", "Orchestrated" instead of "Managed")
3. HIGHLIGHT OUTCOMES: Focus on results and impact, not just responsibilities
4. ADD SPECIFICITY: Include technologies, methodologies, and industry-specific terminology where appropriate
5. IMPROVE STRUCTURE: Ensure consistent formatting and presentation
6. ENHANCE SUMMARY: Create a compelling professional summary that highlights key strengths and unique value proposition

Only enhance factual content - do NOT invent new information or metrics.
Return ONLY the enhanced version as JSON matching the original structure.
Focus especially on work experience descriptions, project descriptions, and the professional summary.`
                },
                {
                    role: "user",
                    content: JSON.stringify(profile)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return {};
        }

        try {
            return JSON.parse(content);
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return {};
        }
    } catch (error) {
        console.error("Error beautifying profile:", error);
        return {};
    }
};

// Generate interview questions
export const generateQuestions = async (
    profile: UserProfile,
    categories: QuestionCategory[],
    count: number = 5,
    job?: Job
): Promise<{ text: string; category: QuestionCategory }[]> => {
    try {
        let prompt = `Generate ${count} unique interview questions based on the candidate's profile`;

        if (job) {
            prompt += ` and the job they are applying for (${job.title} at ${job.company})`;
            if (job.description) {
                prompt += `. Here's the job description: ${job.description}`;
            }
        }

        prompt += `. Focus on the following categories: ${categories.join(', ')}.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that generates relevant interview questions for job candidates.
          Generate questions that are specific to the candidate's profile and, if provided, the job description.
          Create challenging but fair questions that would be asked in real interviews.
          For technical questions, ensure they're appropriate for the candidate's skills and the job requirements.
          Return the questions as a JSON array of objects with 'text' and 'category' properties.
          Example format:
          {
            "questions": [
              {"text": "Tell me about a time you faced a challenge in your previous role?", "category": "Behavioral"},
              {"text": "Why do you want to work at our company?", "category": "Motivational"}
            ]
          }
          The 'category' must be one of: Motivational, Behavioral, Technical, Personality.`
                },
                {
                    role: "user",
                    content: `${prompt}\n\nCandidate Profile: ${JSON.stringify(profile)}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return [];
        }

        try {
            const parsedContent = JSON.parse(content);
            // Handle different possible response formats
            if (Array.isArray(parsedContent)) {
                return parsedContent;
            } else if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
                return parsedContent.questions;
            } else {
                // Create fallback questions if format is unexpected
                console.error("Unexpected response format:", parsedContent);
                return categories.map((category, index) => ({
                    text: `Interview question ${index + 1} for ${category} category`,
                    category: category
                }));
            }
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            // Create fallback questions if parsing fails
            return categories.map((category, index) => ({
                text: `Interview question ${index + 1} for ${category} category`,
                category: category
            }));
        }
    } catch (error) {
        console.error("Error generating questions:", error);
        // Create fallback questions if API call fails
        return categories.map((category, index) => ({
            text: `Interview question ${index + 1} for ${category} category`,
            category: category
        }));
    }
};

// Provide feedback on answers
export const getAnswerFeedback = async (
    question: string,
    answer: string,
    profile: UserProfile,
    job?: Job
): Promise<string> => {
    try {
        let prompt = `Provide constructive feedback on this interview answer.`;

        if (job) {
            prompt += ` The candidate is applying for ${job.title} at ${job.company}.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an AI interview coach that provides helpful feedback on interview answers.
          Analyze the answer for clarity, relevance, structure, and impact.
          Suggest specific improvements and highlight strengths.
          Consider the candidate's background and the job they're applying for.
          Provide actionable feedback that helps the candidate improve their answer.`
                },
                {
                    role: "user",
                    content: `${prompt}\n\nQuestion: ${question}\nAnswer: ${answer}\nCandidate Profile: ${JSON.stringify(profile)}`
                }
            ]
        });

        return response.choices[0].message.content || "Unfortunately, I couldn't generate feedback at this time. Your answer appears complete, but I recommend reviewing it for clarity, relevance, and impact before proceeding.";
    } catch (error) {
        console.error("Error getting answer feedback:", error);
        return "Unfortunately, I couldn't generate feedback at this time. Your answer appears complete, but I recommend reviewing it for clarity, relevance, and impact before proceeding.";
    }
};

// Suggest tags for answers
export const suggestTags = async (
    question: string,
    answer: string,
    job?: Job
): Promise<string[]> => {
    try {
        let prompt = `Suggest relevant tags for the following interview Q&A.`;

        if (job) {
            prompt += ` The context is an application for ${job.title} at ${job.company}.`;
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are an AI assistant that suggests relevant tags for interview answers.
          Analyze the question and answer to identify key themes, skills, and qualities demonstrated.
          Suggest 3-5 concise tags that accurately categorize the content.
          Examples include technical skills (e.g., "Python", "data analysis"), soft skills (e.g., "leadership", "communication"),
          and specific experiences (e.g., "project management", "customer service").
          Return the tags as a JSON array of strings.
          Example format: {"tags": ["leadership", "conflict resolution", "team management"]}`
                },
                {
                    role: "user",
                    content: `${prompt}\n\nQuestion: ${question}\nAnswer: ${answer}`
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) {
            console.error("Empty response from OpenAI");
            return [];
        }

        try {
            const parsedContent = JSON.parse(content);
            // Handle different possible response formats
            if (Array.isArray(parsedContent)) {
                return parsedContent;
            } else if (parsedContent.tags && Array.isArray(parsedContent.tags)) {
                return parsedContent.tags;
            } else {
                // Extract all values if format is unexpected
                const allValues = Object.values(parsedContent).flat();
                return Array.isArray(allValues) ?
                    allValues.filter(v => typeof v === 'string') :
                    [];
            }
        } catch (parseError) {
            console.error("Error parsing JSON response:", parseError);
            return [];
        }
    } catch (error) {
        console.error("Error suggesting tags:", error);
        return [];
    }
};