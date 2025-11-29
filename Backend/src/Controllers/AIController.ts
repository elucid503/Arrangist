import { Context } from 'hono';

import { TaskModel } from '../Models/Task';

import { GetUserID } from '../Middleware/Auth';
import { AIService } from '../Services/AIService';
import { SchedulingService } from '../Services/SchedulingService';

export class AIController {

    /**
     * Parse natural language input and create a task
    */
    static async CreateTaskFromNaturalLanguage(c: Context) {

        const UserID = GetUserID(c);

        return await c.req.json().then(async (Body) => {

            const { input } = Body;

            if (!input || typeof input !== 'string' || input.trim().length === 0) {

                return c.json({ error: 'Input text is required' }, 400);

            }

            // Check if OpenAI API key is configured
        
            if (!process.env.OPENAI_API_KEY) {
            
                return c.json({ error: 'OpenAI API key is not configured' }, 500);
            
            }

            // 'Parses' the natural language input using AI

            const ParsedTask = await AIService.ParseTaskFromNaturalLanguage(input.trim());

            // Creates the task in the database

            const NewTask = await TaskModel.create({

                ...ParsedTask,

                UserID,
                DueDate: ParsedTask.DueDate ? new Date(ParsedTask.DueDate) : undefined,
                Status: 'pending',
                IsScheduled: false,

            });

            // Generate a scheduling suggestion for the new task
            let ScheduleSuggestion = null;
            
            try {

                ScheduleSuggestion = await SchedulingService.GenerateSingleTaskSuggestion(UserID, NewTask._id.toString());

            } catch (err) {

                console.error('Failed to generate schedule suggestion:', err); // Scheduling suggestion is optional, continue without it

            }

            // Generate confirmation message

            const ConfirmationMessage = AIService.GenerateConfirmationMessage(ParsedTask);

            return c.json({

                message: 'Task created successfully from natural language',
                confirmation: ConfirmationMessage,
                task: NewTask,
                scheduleSuggestion: ScheduleSuggestion,

            }, 201);

        }).catch((error) => {

            console.error('AI Task Creation Error:', error);

            if (error.message?.includes('API key')) {

                return c.json({ error: 'OpenAI API configuration error' }, 500);

            }

            if (error.message?.includes('parse') || error.message?.includes('JSON')) {

                return c.json({ error: 'Could not understand the input. Please try rephrasing.' }, 400);

            }

            return c.json({ error: error.message || 'Failed to create task' }, 500);

        });

    }
    
}