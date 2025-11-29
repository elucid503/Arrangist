import { Context } from 'hono'
  
import { GetUserID } from '../Middleware/Auth';
import { SchedulingService } from '../Services/SchedulingService';

export class ScheduleController {

  static async GetSuggestions(c: Context) {

    const UserID = GetUserID(c);
    const { startDate, endDate } = c.req.query();

    return await SchedulingService.GenerateScheduleSuggestions(UserID, startDate, endDate).then((Suggestions) => {
      
      return c.json({
          
        message: 'Schedule suggestions generated successfully',
        
        suggestions: Suggestions,
        count: Suggestions.length,
          
      });

    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to generate suggestions' }, 500);
      
    });
    
  }

  static async ApplySuggestion(c: Context) {

    const UserID = GetUserID(c);

    return await c.req.json().then(async (Body) => {

      const { TaskId, ScheduledStart, ScheduledEnd } = Body;

      if (!TaskId || !ScheduledStart || !ScheduledEnd) {
          
        return c.json({ error: 'Missing required fields' }, 400);
        
      }

      const Result = await SchedulingService.ApplyScheduleSuggestion(UserID, TaskId, new Date(ScheduledStart), new Date(ScheduledEnd));

      if (!Result.task) {

        return c.json({ error: 'Task not found' }, 404);

      }

      return c.json({

        message: 'Schedule applied successfully',
        task: Result.task,
        event: Result.event,

      });

    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to apply suggestion' }, 500);

    });

  }

  static async RescheduleTask(c: Context) {
    
    const UserID = GetUserID(c);
    const TaskId = c.req.param('id');

    // Get the excluded time from the request body (the currently suggested time to avoid)
    let ExcludedStart: Date | undefined;
    
    try {
      const Body = await c.req.json();
      if (Body.ExcludedStart) {
        ExcludedStart = new Date(Body.ExcludedStart);
      }
    } catch {
      // No body provided, that's fine
    }

    // Generate a new suggestion for this specific task, excluding the previous time
    return await SchedulingService.GenerateSingleTaskSuggestion(UserID, TaskId, ExcludedStart).then((NewSuggestion) => {

      return c.json({
        message: NewSuggestion ? 'New time found successfully' : 'No alternative time slots available',
        newSuggestion: NewSuggestion,
      });
      
    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to reschedule task' }, 500);
      
    });
    
  }

}