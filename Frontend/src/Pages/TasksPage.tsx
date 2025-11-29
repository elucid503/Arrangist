import React, { useEffect, useState } from 'react';
import Navbar, { MobileBottomNav } from '../Components/Navbar';
import TaskCard from '../Components/TaskCard';
import Api from '../Utils/Api';
import { Plus, Filter } from 'lucide-react';

interface Task {
  _id: string;
  Title: string;
  Description?: string;
  DueDate?: string;
  Priority: 'low' | 'medium' | 'high';
  Status: 'pending' | 'in-progress' | 'completed';
  Category?: string;
  EstimatedTime?: number;
}

const TasksPage: React.FC = () => {
  const [Tasks, SetTasks] = useState<Task[]>([]);
  const [IsLoading, SetIsLoading] = useState(true);
  const [ShowModal, SetShowModal] = useState(false);
  const [FilterStatus, SetFilterStatus] = useState<string>('all');
  const [FilterPriority, SetFilterPriority] = useState<string>('all');
  const [NewTask, SetNewTask] = useState({
    Title: '',
    Description: '',
    DueDate: '',
    DueTime: '',
    Priority: 'medium',
    EstimatedTime: '',
    Category: '',
  });

  useEffect(() => {
    FetchTasks();
  }, []);

  const FetchTasks = async () => {
    await Api.get('/tasks')
      .then((Response) => {
        SetTasks(Response.data.tasks || []);
      })
      .catch((Error) => {
        console.error('Error fetching tasks:', Error);
      })
      .finally(() => {
        SetIsLoading(false);
      });
  };

  const HandleCreateTask = async (E: React.FormEvent) => {
    E.preventDefault();
    // Combine date and time into ISO string
    let DueDateISO = undefined;
    if (NewTask.DueDate) {
      if (NewTask.DueTime) {
        DueDateISO = `${NewTask.DueDate}T${NewTask.DueTime}:00.000Z`;
      } else {
        DueDateISO = `${NewTask.DueDate}T23:59:00.000Z`;
      }
    }

    await Api.post('/tasks', {
      Title: NewTask.Title,
      Description: NewTask.Description || undefined,
      DueDate: DueDateISO,
      Priority: NewTask.Priority,
      EstimatedTime: NewTask.EstimatedTime ? parseInt(NewTask.EstimatedTime) : undefined,
      Category: NewTask.Category || undefined,
    })
      .then(() => {
        SetShowModal(false);
        SetNewTask({
          Title: '',
          Description: '',
          DueDate: '',
          DueTime: '',
          Priority: 'medium',
          EstimatedTime: '',
          Category: '',
        });
        FetchTasks();
      })
      .catch((Error) => {
        console.error('Error creating task:', Error);
      });
  };

  const HandleTaskStatusChange = async (Id: string, Status: string) => {
    await Api.put(`/tasks/${Id}`, { Status })
      .then(() => {
        FetchTasks();
      })
      .catch((Error) => {
        console.error('Error updating task:', Error);
      });
  };

  const HandleTaskDelete = async (Id: string) => {
    await Api.delete(`/tasks/${Id}`)
      .then(() => {
        FetchTasks();
      })
      .catch((Error) => {
        console.error('Error deleting task:', Error);
      });
  };

  const FilteredTasks = Tasks.filter((Task) => {
    if (FilterStatus !== 'all' && Task.Status !== FilterStatus) return false;
    if (FilterPriority !== 'all' && Task.Priority !== FilterPriority) return false;
    return true;
  });

  if (IsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      <Navbar />
      <MobileBottomNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <button onClick={() => SetShowModal(true)} className="btn-primary flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={FilterStatus}
              onChange={(E) => SetFilterStatus(E.target.value)}
              className="input-field flex-1"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={FilterPriority}
              onChange={(E) => SetFilterPriority(E.target.value)}
              className="input-field flex-1"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {FilteredTasks.map((Task) => (
            <TaskCard
              key={Task._id}
              Task={Task}
              OnDelete={HandleTaskDelete}
              OnStatusChange={HandleTaskStatusChange}
              OnClick={() => {}}
            />
          ))}
          {FilteredTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Task Modal */}
      {ShowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={HandleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={NewTask.Title}
                  onChange={(E) => SetNewTask({ ...NewTask, Title: E.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={NewTask.Description}
                  onChange={(E) => SetNewTask({ ...NewTask, Description: E.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={NewTask.DueDate}
                  onChange={(E) => SetNewTask({ ...NewTask, DueDate: E.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Due Time (optional)</label>
                <input
                  type="time"
                  value={NewTask.DueTime}
                  onChange={(E) => SetNewTask({ ...NewTask, DueTime: E.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={NewTask.Priority}
                  onChange={(E) => SetNewTask({ ...NewTask, Priority: E.target.value })}
                  className="input-field"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Estimated Time (minutes)</label>
                <input
                  type="number"
                  value={NewTask.EstimatedTime}
                  onChange={(E) => SetNewTask({ ...NewTask, EstimatedTime: E.target.value })}
                  className="input-field"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  value={NewTask.Category}
                  onChange={(E) => SetNewTask({ ...NewTask, Category: E.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => SetShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
