import OpenAI from 'openai';

// Lazy singleton pattern to avoid memory leaks from multiple client instantiations
let OpenAIClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {

    if (!OpenAIClient) {

        OpenAIClient = new OpenAI({

            apiKey: process.env.OPENAI_API_KEY,

        });

    }

    return OpenAIClient;

}

interface ParsedTask {

    Title: string;
    Description?: string;
    DueDate?: string;
    Priority: 'low' | 'medium' | 'high';
    EstimatedTime?: number;
    Category?: string;
    
}

export class AIService {

    /**
   * Parse natural language input into structured task data using OpenAI
   */
    static async ParseTaskFromNaturalLanguage(input: string): Promise<ParsedTask> {

        const Today = new Date();
        const SystemPrompt = `You are a task parser assistant. Parse the user's natural language input into a structured task object.

            Current date and time: ${Today.toISOString()}

            Return a JSON object with these fields:
            - Title (string, required): A concise, but explanatory and differentiable title for the task
            - Description (string, optional, encouraged): Additional details if mentioned
            - DueDate (string, optional, ideal): ISO 8601 datetime string. Parse relative dates like "tomorrow", "next Monday", "in 3 days", "December 5th", etc.
            - Priority (string, required): "low", "medium", or "high" - infer from urgency words like "urgent", "ASAP", "important", "whenever", etc. Default to "medium" if unclear.
            - EstimatedTime (number, optional, encouraged): Estimated minutes to complete. Infer from phrases like "quick 5 minute task", "about an hour", "30 min", "lengthy", "complex", etc or by the nature of the task.
            - Category (string, optional, encouraged): Infer category from context like "work", "personal", "school", "shopping", "health", etc.

            Only respond with valid JSON, no other text.
            
        `;

        const AIRes = await getOpenAIClient().chat.completions.create({
            
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SystemPrompt },
                { role: 'user', content: input }
            ],
            max_completion_tokens: 500,
            response_format: { type: 'json_object' }
        
        });

        const AIResContent = AIRes.choices[0]?.message?.content;
            
        if (!AIResContent) {
        
            throw new Error('Failed to parse task from AI response');
            
        }

        const ParsedRes = JSON.parse(AIResContent) as ParsedTask;

        // Validate required fields
        
        if (!ParsedRes.Title) {
            
            throw new Error('Could not determine task title from input');
            
        }
        
        // Ensure priority is valid

        if (!['low', 'medium', 'high'].includes(ParsedRes.Priority)) {
            
            ParsedRes.Priority = 'medium';
            
        }

        return ParsedRes;
    
    }

    /**
     * Generate a friendly confirmation message for a created task
    */
    static GenerateConfirmationMessage(Task: ParsedTask): string {
        
        let Msg = `Created task: "${Task.Title}"`;
        
        if (Task.DueDate) {
            
            const ParsedDueDate = new Date(Task.DueDate);
            
            Msg += `\nDue: ${ParsedDueDate.toLocaleDateString('en-US', { 

                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'

            })}`;

        }
        
        if (Task.Priority !== 'medium') {

            Msg += `\nPriority: ${Task.Priority}`;
            
        }
        
        if (Task.EstimatedTime) {

            Msg += `\nEstimated: ${Task.EstimatedTime} minutes`;
            
        }
        
        if (Task.Category) {

            Msg += `\nCategory: ${Task.Category}`;
            
        }

        return Msg;

    }

}