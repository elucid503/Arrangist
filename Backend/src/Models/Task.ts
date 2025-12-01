import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubtask {

  Id: string;
  Title: string;

  IsCompleted: boolean;
  Order: number;

}

export interface ITask extends Document {

  UserID: Types.ObjectId;

  Title: string;
  Description?: string;
  Category?: string;
  Course?: string;

  DueDate?: Date;
  
  Priority: 'low' | 'medium' | 'high';
  EstimatedTime?: number; // in minutes

  Status: 'pending' | 'in-progress' | 'completed';

  Subtasks: ISubtask[];

  Color?: string;

  IsScheduled: boolean;
  
  ScheduledStartTime?: Date;
  ScheduledEndTime?: Date;

  CreatedAt: Date;
  UpdatedAt: Date;

}

const SubtaskSchema = new Schema<ISubtask>({

  Id: {
    type: String,
    required: true,
  },
  Title: {
    type: String,
    required: true,
  },
  IsCompleted: {
    type: Boolean,
    default: false,
  },
  Order: {
    type: Number,
    required: true,
  },

}, { _id: false });

const TaskSchema = new Schema<ITask>({

  UserID: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  Title: {
    type: String,
    required: true,
    trim: true,
  },
  Description: {
    type: String,
    trim: true,
  },
  Course: {
    type: String,
    trim: true,
  },
  DueDate: {
    type: Date,
  },
  Category: {
    type: String,
    trim: true,
  },
  Priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  EstimatedTime: {
    type: Number, // in minutes
    min: 0,
  },
  Status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending',
  },
  Subtasks: [SubtaskSchema],
  Color: {
    type: String,
  },
  IsScheduled: {
    type: Boolean,
    default: false,
  },
  ScheduledStartTime: {
    type: Date,
  },
  ScheduledEndTime: {
    type: Date,
  },
}, {
  timestamps: { createdAt: 'CreatedAt', updatedAt: 'UpdatedAt' },
});

// Index for better query performance

TaskSchema.index({ UserID: 1, DueDate: 1 });
TaskSchema.index({ UserID: 1, Status: 1 });
TaskSchema.index({ UserID: 1, Priority: 1 });

export const TaskModel = mongoose.model<ITask>('Task', TaskSchema);