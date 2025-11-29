import { addMinutes, isBefore, isAfter, startOfDay, endOfDay, parseISO } from 'date-fns';

import { TaskModel, ITask } from '../Models/Task';
import { EventModel, IEvent } from '../Models/Event';

interface TimeSlot {

  Start: Date;
  End: Date;

}

interface ScoredSlot extends TimeSlot {

  Score: number;

}

interface ScheduleSuggestion {

  TaskId: string;
  TaskTitle: string;
  SuggestedStart: Date;
  SuggestedEnd: Date;
  Priority: string;
  EstimatedTime: number;

}

export class SchedulingService {

  /**
   * Calculate task priority score (higher = schedule first)
  */
  private static CalculateTaskScore(Task: ITask): number {

    let Score = 0;
    const Now = new Date();

    // Priority weight (0-100)

    const PriorityWeights = { high: 100, medium: 50, low: 25 };
    Score += PriorityWeights[Task.Priority] || 50;

    // Due date urgency (0-100)

    if (Task.DueDate) {

      const DaysUntilDue = Math.ceil((Task.DueDate.getTime() - Now.getTime()) / (1000 * 60 * 60 * 24));

      if (DaysUntilDue <= 0) Score += 100; // Overdue
      else if (DaysUntilDue <= 1) Score += 80;
      else if (DaysUntilDue <= 3) Score += 60;
      else if (DaysUntilDue <= 7) Score += 40;
      else Score += 20;

    }

    // Bonus for having estimated time (easier to schedule accurately)

    if (Task.EstimatedTime) Score += 10;

    return Score;

  }

  /**
   * Score a time slot for a task based on preferences
  */
  private static ScoreSlotForTask(Slot: TimeSlot, Task: ITask): number {

    const TaskDuration = Task.EstimatedTime || 60;
    const SlotDuration = (Slot.End.getTime() - Slot.Start.getTime()) / (1000 * 60);
    
    if (SlotDuration < TaskDuration) return -1; // Slot must fit the task

    let Score = 100; // Base score

    const SlotHour = Slot.Start.getHours();

    // Time: slight bonus for earlier in the day

    Score += Math.max(0, 20 - (SlotHour - 9) * 2);

    // Day preference: earlier days are slightly better (avoid procrastination)
    
    const DaysFromNow = Math.floor((Slot.Start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    Score -= DaysFromNow * 5;

    // Prefer slots that fit the task duration well (avoid fragmentation)

    const WastedTime = SlotDuration - TaskDuration;

    if (WastedTime < 30) Score += 15;
    else if (WastedTime < 60) Score += 10;

    // Penalty for very early or late slots

    if (SlotHour < 8) Score -= 30;
    if (SlotHour >= 20) Score -= 25;

    return Score;

  }

  /**
   * Find all available time slots for a day
  */
  private static FindAvailableSlots(BusySlots: TimeSlot[], DayStart: Date, DayEnd: Date, MinDuration: number = 30): TimeSlot[] {

    const Slots: TimeSlot[] = [];
    const Sorted = [...BusySlots].sort((a, b) => a.Start.getTime() - b.Start.getTime());

    let CurrentTime = DayStart;

    for (const Busy of Sorted) {

      // If there's a gap before this busy slot

      if (isBefore(CurrentTime, Busy.Start)) {

        const GapDuration = (Busy.Start.getTime() - CurrentTime.getTime()) / (1000 * 60);

        if (GapDuration >= MinDuration) {

          Slots.push({ Start: new Date(CurrentTime), End: new Date(Busy.Start) });

        }

      }

      // Move past this busy slot

      if (isAfter(Busy.End, CurrentTime)) {

        CurrentTime = new Date(Busy.End);

      }

    }

    // Add remaining time until day end

    if (isBefore(CurrentTime, DayEnd)) {

      const GapDuration = (DayEnd.getTime() - CurrentTime.getTime()) / (1000 * 60);

      if (GapDuration >= MinDuration) {

        Slots.push({ Start: new Date(CurrentTime), End: new Date(DayEnd) });

      }

    }

    return Slots;

  }

  /**
   * Find the best slot for a task using ranking algorithm
  */
  private static FindBestSlotForTask(Task: ITask, AvailableSlots: TimeSlot[]): TimeSlot | null {

    const TaskDuration = Task.EstimatedTime || 60;

    // Score all slots
    const ScoredSlots: ScoredSlot[] = AvailableSlots.map(Slot => ({

      ...Slot,
      Score: this.ScoreSlotForTask(Slot, Task),

    })).filter(Slot => Slot.Score > 0).sort((a, b) => b.Score - a.Score);

    if (ScoredSlots.length == 0) return null;

    // Return the best slot, trimmed to task duration

    const Best = ScoredSlots[0];

    return {

      Start: Best.Start,
      End: addMinutes(Best.Start, TaskDuration),

    };

  }

  /**
   * Get working hours for a day, accounting for current time if today
  */
 
  private static GetWorkingHours(DayStart: Date, Now: Date): { start: Date; end: Date } | null {

    const WorkStart = addMinutes(DayStart, 9 * 60);  // 9 AM
    const WorkEnd = addMinutes(DayStart, 21 * 60);   // 9 PM
    const IsToday = DayStart.toDateString() === Now.toDateString();

    if (IsToday) {

      // Round current time up to next 15 minutes

      const RoundedNow = new Date(Now);
      const Minutes = Math.ceil(RoundedNow.getMinutes() / 15) * 15;
      RoundedNow.setMinutes(Minutes, 0, 0);

      // If past work hours, skip today
      if (isAfter(RoundedNow, WorkEnd)) return null;

      return {

        start: isAfter(RoundedNow, WorkStart) ? RoundedNow : WorkStart,
        end: WorkEnd,

      };

    }

    return { start: WorkStart, end: WorkEnd };

  }

  /**
   * Generate schedule suggestions for unscheduled tasks
   */
  static async GenerateScheduleSuggestions(UserID: string, StartDate?: string, EndDate?: string): Promise<ScheduleSuggestion[]> {

    const Now = new Date();
    const Start = StartDate ? parseISO(StartDate) : startOfDay(Now);
    const End = EndDate ? parseISO(EndDate) : endOfDay(addMinutes(Start, 7 * 24 * 60));

    try {

      const [UnscheduledTasks, Events] = await Promise.all([
        
        TaskModel.find({ UserID, Status: { $ne: 'completed' }, IsScheduled: false }),
        EventModel.find({ UserID, StartTime: { $lt: End }, EndTime: { $gt: Start } }),

      ]);

      // Sort tasks by priority score (highest first)

      const SortedTasks = [...UnscheduledTasks].sort((a, b) => this.CalculateTaskScore(b) - this.CalculateTaskScore(a));

      // Convert events to busy slots

      const EventBusySlots: TimeSlot[] = Events.map(e => ({ Start: e.StartTime, End: e.EndTime }));

      // Collect ALL available slots across ALL days first

      const AllAvailableSlots: TimeSlot[] = [];
      
      for (let Day = 0; Day < 7; Day++) {

        const DayStart = startOfDay(addMinutes(Start, Day * 24 * 60));
        const WorkHours = this.GetWorkingHours(DayStart, Now);
        
        if (!WorkHours) continue;

        // Get busy slots for this day (only events, not allocated yet)

        const DayBusySlots = EventBusySlots.filter(
          s => s.Start < WorkHours.end && s.End > WorkHours.start
        );

        const DaySlots = this.FindAvailableSlots(DayBusySlots, WorkHours.start, WorkHours.end);
        AllAvailableSlots.push(...DaySlots);

      }

      const Suggestions: ScheduleSuggestion[] = [];
      const AllocatedSlots: TimeSlot[] = [];

      // For each task, find the BEST slot across ALL days

      for (const Task of SortedTasks) {
        const TaskDuration = Task.EstimatedTime || 60;

        // Filter out slots that conflict with already allocated slots

        const AvailableForTask = AllAvailableSlots.filter(slot => {

          // Check if this slot (or the portion we'd use) conflicts with allocated slots

          const PotentialEnd = addMinutes(slot.Start, TaskDuration);

          return !AllocatedSlots.some(Allocated => slot.Start < Allocated.End && PotentialEnd > Allocated.Start);

        });

        // Find the best slot for this task

        const BestSlot = this.FindBestSlotForTask(Task, AvailableForTask);
        
        if (BestSlot) {
          
          Suggestions.push({

            TaskId: Task._id.toString(),
            TaskTitle: Task.Title,
            SuggestedStart: BestSlot.Start,
            SuggestedEnd: BestSlot.End,
            Priority: Task.Priority,
            EstimatedTime: TaskDuration,

          });

          // Mark this slot as allocated

          AllocatedSlots.push(BestSlot);

        }

      }

      return Suggestions;

    } catch (error) {

      console.error('Error generating schedule suggestions:', error);
      throw error;

    }

  }

  /**
   * Apply a schedule suggestion (mark task as scheduled and create calendar event)
   */
  static async ApplyScheduleSuggestion(UserID: string, TaskId: string, ScheduledStart: Date, ScheduledEnd: Date): Promise<{ task: ITask | null; event: IEvent | null }> {
          
    const UpdatedTask = await TaskModel.findOneAndUpdate({ _id: TaskId, UserID }, { IsScheduled: true, ScheduledStartTime: ScheduledStart, ScheduledEndTime: ScheduledEnd, }, { new: true } );

    if (!UpdatedTask) {

      return { task: null, event: null };

    }
    
    const PriorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }; // Create calendar event for the scheduled task (ported from frontend)
    
    const NewEvent = new EventModel({

      UserID,
      Title: UpdatedTask.Title,
      Description: UpdatedTask.Description || `Scheduled task: ${UpdatedTask.Title}`,
      StartTime: ScheduledStart,
      EndTime: ScheduledEnd,
      Category: UpdatedTask.Category || 'Task',
      Color: PriorityColors[UpdatedTask.Priority] || '#0ea5e9',
      IsRecurring: false,
      IsAllDay: false,
      Reminders: [15],

    });

    const SavedEvent = await NewEvent.save().catch(error => {

      console.error('Error creating calendar event for task:', error);
      return null;

    });

    return { task: UpdatedTask, event: SavedEvent };
    
  }

  /**
   * Generate a new suggestion for a specific task, excluding a previously suggested time
   */
  static async GenerateSingleTaskSuggestion( UserID: string, TaskId: string, ExcludedStart?: Date ): Promise<ScheduleSuggestion | null> { const Now = new Date();
    
    const Start = startOfDay(Now);
    const End = endOfDay(addMinutes(Start, 7 * 24 * 60));

    try {

      const [Task, Events, ScheduledTasks] = await Promise.all([
        
        TaskModel.findOne({ _id: TaskId, UserID }),
        EventModel.find({ UserID, StartTime: { $lt: End }, EndTime: { $gt: Start } }),
        TaskModel.find({

          UserID,
          _id: { $ne: TaskId },
          IsScheduled: true,
          ScheduledStartTime: { $lt: End },
          ScheduledEndTime: { $gt: Start },

        }),

      ]);

      if (!Task) return null;

      const TaskDuration = Task.EstimatedTime || 60;

      // Build busy slots from events and other scheduled tasks

      const BusySlots: TimeSlot[] = [

        ...Events.map(e => ({ Start: e.StartTime, End: e.EndTime })),
        ...ScheduledTasks.map(t => ({ Start: t.ScheduledStartTime!, End: t.ScheduledEndTime! })),

      ];

      // Add excluded time as busy to avoid suggesting same slot

      if (ExcludedStart) {

        BusySlots.push({ Start: ExcludedStart, End: addMinutes(ExcludedStart, TaskDuration) });

      }

      // Collect ALL available slots across ALL days

      const AllAvailableSlots: TimeSlot[] = [];
      
      for (let Day = 0; Day < 7; Day++) {

        const DayStart = startOfDay(addMinutes(Start, Day * 24 * 60));
        const WorkHours = this.GetWorkingHours(DayStart, Now);
        
        if (!WorkHours) continue;

        const DayBusySlots = BusySlots.filter(s => s.Start < WorkHours.end && s.End > WorkHours.start);
        const DaySlots = this.FindAvailableSlots(DayBusySlots, WorkHours.start, WorkHours.end, TaskDuration);

        AllAvailableSlots.push(...DaySlots);

      }

      // Find the best slot across all days

      const BestSlot = this.FindBestSlotForTask(Task, AllAvailableSlots);
      
      if (BestSlot) {

        // Double-check it's not the excluded time

        if (ExcludedStart && BestSlot.Start.getTime() == ExcludedStart.getTime()) {

          // Try to find another slot by removing this one

          const FilteredSlots = AllAvailableSlots.filter(s => s.Start.getTime() != ExcludedStart.getTime());
          const AlternativeSlot = this.FindBestSlotForTask(Task, FilteredSlots);

          if (!AlternativeSlot) return null;
          
          return {

            TaskId: Task._id.toString(),
            TaskTitle: Task.Title,
            SuggestedStart: AlternativeSlot.Start,
            SuggestedEnd: AlternativeSlot.End,
            Priority: Task.Priority,
            EstimatedTime: TaskDuration,

          };

        }

        return {

          TaskId: Task._id.toString(),
          TaskTitle: Task.Title,
          SuggestedStart: BestSlot.Start,
          SuggestedEnd: BestSlot.End,
          Priority: Task.Priority,
          EstimatedTime: TaskDuration,

        };

      }

      return null;

    } catch (error) {

      console.error('Error generating single task suggestion:', error);
      throw error;

    }

  }

  /**
   * Automatically reschedule tasks when conflicts arise
  */
  static async RescheduleConflictingTasks(UserID: string, NewEvent: IEvent): Promise<ScheduleSuggestion[]> {

    try {

      const ConflictingTasks = await TaskModel.find({

        UserID,
        IsScheduled: true,
        ScheduledStartTime: { $lt: NewEvent.EndTime },
        ScheduledEndTime: { $gt: NewEvent.StartTime },

      });

      if (ConflictingTasks.length === 0) return [];

      // Unschedule conflicting tasks

      await Promise.all(

        ConflictingTasks.map(Task => {

          Task.IsScheduled = false;
          Task.ScheduledStartTime = undefined;
          Task.ScheduledEndTime = undefined;
          return Task.save();

        })

      );

      // Generate new suggestions

      const AllSuggestions = await this.GenerateScheduleSuggestions(UserID);

      return AllSuggestions.filter(s => ConflictingTasks.some(t => t._id.toString() == s.TaskId));

    } catch (error) {

      console.error('Error rescheduling conflicting tasks:', error);
      throw error;

    }

  }

}