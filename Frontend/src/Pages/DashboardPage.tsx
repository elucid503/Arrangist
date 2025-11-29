import React, { useEffect, useState } from 'react';
import Navbar, { MobileBottomNav } from '../Components/Navbar';
import TaskCard from '../Components/TaskCard';
import ScheduleSuggestionCard from '../Components/ScheduleSuggestionCard';
import Api from '../Utils/Api';
import { Calendar, CheckSquare, Clock, TrendingUp, Sparkles, Send, Loader2 } from 'lucide-react';

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

interface Event {
  _id: string;
  Title: string;
  StartTime: string;
  EndTime: string;
}

interface ScheduleSuggestion {
  TaskId: string;
  TaskTitle: string;
  SuggestedStart: string;
  SuggestedEnd: string;
  Priority: string;
  EstimatedTime: number;
}

interface AIMessage {
  type: 'user' | 'assistant';
  content: string;
}

const DashboardPage: React.FC = () => {
  const [Tasks, SetTasks] = useState<Task[]>([]);
  const [Events, SetEvents] = useState<Event[]>([]);
  const [Suggestions, SetSuggestions] = useState<ScheduleSuggestion[]>([]);
  const [IsLoading, SetIsLoading] = useState(true);
  const [ReschedulingTaskId, SetReschedulingTaskId] = useState<string | null>(null);
  
  // AI Input state
  const [AIInput, SetAIInput] = useState('');
  const [AIMessages, SetAIMessages] = useState<AIMessage[]>([]);
  const [IsAIProcessing, SetIsAIProcessing] = useState(false);

  useEffect(() => {
    FetchDashboardData();
  }, []);

  const FetchDashboardData = async () => {
    await Promise.all([
      Api.get('/tasks'),
      Api.get('/calendar/events'),
      Api.get('/schedule/suggestions'),
    ])
      .then(([TasksRes, EventsRes, SuggestionsRes]) => {
        SetTasks(TasksRes.data.tasks || []);
        SetEvents(EventsRes.data.events || []);
        SetSuggestions(SuggestionsRes.data.suggestions || []);
      })
      .catch((Error) => {
        console.error('Error fetching dashboard data:', Error);
      })
      .finally(() => {
        SetIsLoading(false);
      });
  };

  const HandleTaskStatusChange = async (Id: string, Status: string) => {
    await Api.put(`/tasks/${Id}`, { Status })
      .then(() => {
        FetchDashboardData();
      })
      .catch((Error) => {
        console.error('Error updating task:', Error);
      });
  };

  const HandleTaskDelete = async (Id: string) => {
    await Api.delete(`/tasks/${Id}`)
      .then(() => {
        FetchDashboardData();
      })
      .catch((Error) => {
        console.error('Error deleting task:', Error);
      });
  };

  const HandleAcceptSuggestion = async (Suggestion: ScheduleSuggestion) => {
    await Api.post('/schedule/apply', {
      TaskId: Suggestion.TaskId,
      ScheduledStart: Suggestion.SuggestedStart,
      ScheduledEnd: Suggestion.SuggestedEnd,
    })
      .then(() => {
        FetchDashboardData();
      })
      .catch((Error) => {
        console.error('Error applying suggestion:', Error);
      });
  };

  const HandleRejectSuggestion = async (Suggestion: ScheduleSuggestion) => {
    SetReschedulingTaskId(Suggestion.TaskId);
    try {
      const Response = await Api.post(`/schedule/reschedule/${Suggestion.TaskId}`, {
        ExcludedStart: Suggestion.SuggestedStart,
      });
      const NewSuggestion = Response.data.newSuggestion;
      
      if (NewSuggestion) {
        SetSuggestions((prev) =>
          prev.map((s) => (s.TaskId === Suggestion.TaskId ? NewSuggestion : s))
        );
      } else {
        // No new time slot available, remove from suggestions
        SetSuggestions((prev) => prev.filter((s) => s.TaskId !== Suggestion.TaskId));
      }
    } catch (Error) {
      console.error('Error rescheduling suggestion:', Error);
    } finally {
      SetReschedulingTaskId(null);
    }
  };

  // AI Task Input Handler
  const HandleAISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!AIInput.trim() || IsAIProcessing) return;

    const userMessage = AIInput.trim();
    SetAIMessages((prev) => [...prev, { type: 'user', content: userMessage }]);
    SetAIInput('');
    SetIsAIProcessing(true);

    try {
      const Response = await Api.post('/ai/parse-task', { input: userMessage });
      const { confirmation, scheduleSuggestion } = Response.data;
      
      SetAIMessages((prev) => [...prev, { type: 'assistant', content: confirmation }]);
      
      // Add the new suggestion if available
      if (scheduleSuggestion) {
        SetSuggestions((prev) => [scheduleSuggestion, ...prev]);
      }
      
      // Refresh data to show the new task
      FetchDashboardData();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Sorry, I couldn\'t process that. Please try again.';
      SetAIMessages((prev) => [...prev, { type: 'assistant', content: `${errorMessage}` }]);
    } finally {
      SetIsAIProcessing(false);
    }
  };

  const PendingTasks = Tasks.filter((T) => T.Status !== 'completed');
  const TodayEvents = Events.filter((E) => {
    const EventDate = new Date(E.StartTime);
    const Today = new Date();
    return EventDate.toDateString() === Today.toDateString();
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
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Tasks</p>
                <p className="text-3xl font-bold mt-1">{PendingTasks.length}</p>
              </div>
              <CheckSquare className="w-10 h-10 text-primary-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Events Today</p>
                <p className="text-3xl font-bold mt-1">{TodayEvents.length}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Suggestions</p>
                <p className="text-3xl font-bold mt-1">{Suggestions.length}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold mt-1">
                  {Tasks.filter((T) => T.Status === 'completed').length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Schedule Suggestions */}
          {Suggestions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Smart Scheduling</h2>
              <div className="space-y-4">
                {Suggestions.slice(0, 3).map((Suggestion) => (
                  <ScheduleSuggestionCard
                    key={Suggestion.TaskId}
                    Suggestion={Suggestion}
                    OnAccept={HandleAcceptSuggestion}
                    OnReject={HandleRejectSuggestion}
                    IsRescheduling={ReschedulingTaskId === Suggestion.TaskId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Tasks */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Upcoming Tasks</h2>
            <div className="space-y-4">
              {PendingTasks.slice(0, 5).map((Task) => (
                <TaskCard
                  key={Task._id}
                  Task={Task}
                  OnDelete={HandleTaskDelete}
                  OnStatusChange={HandleTaskStatusChange}
                  OnClick={() => {}}
                />
              ))}
              {PendingTasks.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400">No pending tasks</p>
              )}
            </div>
          </div>
        </div>

        {/* AI Task Input Section */}
        <div className="mt-8">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary-500" />
              <h2 className="text-2xl font-semibold">Quick Add</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Describe your task and AI will create and schedule it for you.
            </p>

            {/* Chat Messages */}
            {AIMessages.length > 0 && (
              <div className="mb-4 max-h-60 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {AIMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                        message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {IsAIProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={HandleAISubmit} className="flex gap-3">
              <input
                type="text"
                value={AIInput}
                onChange={(e) => SetAIInput(e.target.value)}
                placeholder='Use natural language to describe your task...'
                className="input-field flex-1"
                disabled={IsAIProcessing}
              />
              <button
                type="submit"
                disabled={!AIInput.trim() || IsAIProcessing}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {IsAIProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>

            {/* Example prompts */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Try:</span>
              {[
                'Buy groceries tomorrow',
                'Call mom this weekend',
                'Submit assignment by Monday 9am, urgent',
              ].map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => SetAIInput(example)}
                  className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
