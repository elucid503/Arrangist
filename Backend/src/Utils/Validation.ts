import { z } from 'zod';

export const RegisterSchema = z.object({

  Email: z.string().email('Invalid email address'),
  Password: z.string().min(6, 'Password must be at least 6 characters'),
  Name: z.string().min(1, 'Name is required'),

});

export const LoginSchema = z.object({

  Email: z.string().email('Invalid email address'),
  Password: z.string().min(1, 'Password is required'),

});

export const TaskSchema = z.object({

  Title: z.string().min(1, 'Title is required'),
  Description: z.string().optional(),
  DueDate: z.string().optional(),
  Category: z.string().optional(),
  Course: z.string().optional(),
  Priority: z.enum(['low', 'medium', 'high']).default('medium'),
  EstimatedTime: z.number().min(0).optional(),
  Status: z.enum(['pending', 'in-progress', 'completed']).default('pending'),
  Color: z.string().optional(),

});

export const UpdateTaskSchema = TaskSchema.partial();

export const SubtaskSchema = z.object({

  Title: z.string().min(1, 'Subtask title is required'),
  IsCompleted: z.boolean().default(false),

});

export const EventSchema = z.object({

  Title: z.string().min(1, 'Title is required'),
  Description: z.string().optional(),
  StartTime: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid start time'),
  EndTime: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid end time'),
  Location: z.string().optional(),
  Category: z.string().optional(),
  Color: z.string().optional(),
  IsRecurring: z.boolean().default(false),
  Recurrence: z.object({
    Frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
    Interval: z.number().min(1),
    EndDate: z.string().datetime().optional(),
    DaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    DayOfMonth: z.number().min(1).max(31).optional(),
  }).optional(),
  Reminders: z.array(z.number()).default([]),
  IsAllDay: z.boolean().default(false),

});

export const UpdateEventSchema = EventSchema.partial();