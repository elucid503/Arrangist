import React, { useEffect, useState } from 'react';
import Navbar, { MobileBottomNav } from '../Components/Navbar';
import EventCard from '../Components/EventCard';
import Api from '../Utils/Api';
import { Plus, ChevronLeft, ChevronRight, List, Grid, Download } from 'lucide-react';

interface Event {
  _id: string;
  Title: string;
  Description?: string;
  StartTime: string;
  EndTime: string;
  Location?: string;
  Category?: string;
  Color?: string;
  IsAllDay: boolean;
}

// Calendar helper functions
const GetDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const GetFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const IsSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const IsToday = (date: Date): boolean => {
  return IsSameDay(date, new Date());
};

const CalendarPage: React.FC = () => {
  const [Events, SetEvents] = useState<Event[]>([]);
  const [IsLoading, SetIsLoading] = useState(true);
  const [ShowModal, SetShowModal] = useState(false);
  const [ViewMode, SetViewMode] = useState<'calendar' | 'list'>('calendar');
  const [CurrentDate, SetCurrentDate] = useState(new Date());
  const [SelectedDate, SetSelectedDate] = useState<Date | null>(null);
  const now = new Date();
  const defaultStartTime = now.toISOString().slice(0, 16);
  const defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
  const [NewEvent, SetNewEvent] = useState({
    Title: '',
    Description: '',
    StartTime: defaultStartTime,
    EndTime: defaultEndTime,
    Location: '',
    Category: '',
    Color: '#0ea5e9',
    IsAllDay: false,
  });

  const colorOptions = [
    '#0ea5e9', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#6b7280', // gray
    '#374151', // dark gray
  ];

  useEffect(() => {
    FetchEvents();
  }, []);

  const FetchEvents = async () => {
    await Api.get('/calendar/events')
      .then((Response) => {
        SetEvents(Response.data.events || []);
      })
      .catch((Error) => {
        console.error('Error fetching events:', Error);
      })
      .finally(() => {
        SetIsLoading(false);
      });
  };

  const HandleCreateEvent = async (E: React.FormEvent) => {
    E.preventDefault();
    await Api.post('/calendar/events', NewEvent)
      .then(() => {
        SetShowModal(false);
        SetNewEvent({
          Title: '',
          Description: '',
          StartTime: defaultStartTime,
          EndTime: defaultEndTime,
          Location: '',
          Category: '',
          Color: '#0ea5e9',
          IsAllDay: false,
        });
        FetchEvents();
      })
      .catch((Error) => {
        console.error('Error creating event:', Error);
      });
  };

  const HandleEventDelete = async (Id: string) => {
    await Api.delete(`/calendar/events/${Id}`)
      .then(() => {
        FetchEvents();
      })
      .catch((Error) => {
        console.error('Error deleting event:', Error);
      });
  };

  const HandleEventEdit = (Event: Event) => {
    // TODO: Implement edit modal
    console.log('Edit event:', Event);
  };

  const HandleExportICS = async () => {
    try {
      const Response = await Api.get('/calendar/export/ics', {
        responseType: 'blob'
      });
      const B = new Blob([Response.data], { type: 'text/calendar' });
      const Url = window.URL.createObjectURL(B);
      const Link = document.createElement('a');
      Link.href = Url;
      Link.download = 'smartassign-calendar.ics';
      document.body.appendChild(Link);
      Link.click();
      document.body.removeChild(Link);
      window.URL.revokeObjectURL(Url);
    } catch (Error) {
      console.error('Error exporting calendar:', Error);
    }
  };

  // Calendar navigation
  const GoToPreviousMonth = () => {
    SetCurrentDate(new Date(CurrentDate.getFullYear(), CurrentDate.getMonth() - 1, 1));
  };

  const GoToNextMonth = () => {
    SetCurrentDate(new Date(CurrentDate.getFullYear(), CurrentDate.getMonth() + 1, 1));
  };

  const GoToToday = () => {
    SetCurrentDate(new Date());
    SetSelectedDate(new Date());
  };

  // Get events for a specific date
  const GetEventsForDate = (date: Date): Event[] => {
    return Events.filter((event) => {
      const eventDate = new Date(event.StartTime);
      return IsSameDay(eventDate, date);
    });
  };

  // Generate calendar days
  const GenerateCalendarDays = () => {
    const year = CurrentDate.getFullYear();
    const month = CurrentDate.getMonth();
    const daysInMonth = GetDaysInMonth(year, month);
    const firstDayOfMonth = GetFirstDayOfMonth(year, month);
    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const GroupedEvents = Events.reduce((Groups: { [key: string]: Event[] }, Event) => {
    const dateKey = new Date(Event.StartTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!Groups[dateKey]) {
      Groups[dateKey] = [];
    }
    Groups[dateKey].push(Event);
    return Groups;
  }, {});

  const calendarDays = GenerateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get events for selected date (for detail view)
  const SelectedDateEvents = SelectedDate ? GetEventsForDate(SelectedDate) : [];

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className='flex flex-row gap-4'>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <button
              onClick={HandleExportICS}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Export to ICS"
              >
              <Download className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => SetViewMode('calendar')}
                className={`p-2 rounded-md transition-colors ${
                  ViewMode === 'calendar'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="Calendar View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => SetViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  ViewMode === 'list'
                    ? 'bg-white dark:bg-gray-600 shadow-sm'
                    : 'hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => SetShowModal(true)} className="btn-primary flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </button>
          </div>
        </div>

        {ViewMode === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <div className="card">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">
                      {monthNames[CurrentDate.getMonth()]} {CurrentDate.getFullYear()}
                    </h2>
                    <button
                      onClick={GoToToday}
                      className="text-sm px-3 py-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Jump to Today
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={GoToPreviousMonth}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={GoToNextMonth}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Week Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dayEvents = GetEventsForDate(date);
                    const isSelected = SelectedDate && IsSameDay(date, SelectedDate);
                    const isTodayDate = IsToday(date);

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => SetSelectedDate(date)}
                        className={`aspect-square p-1 rounded-lg transition-colors relative flex flex-col items-center ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : isTodayDate
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className={`text-sm pt-1.5 mb-0.5 ${isSelected ? 'font-bold' : ''}`}>
                          {date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: isSelected ? '#fff' : event.Color || '#0ea5e9' }}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className={`text-xs ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Date Events */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  {SelectedDate
                    ? SelectedDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'Select a date'}
                </h3>
                {SelectedDate ? (
                  SelectedDateEvents.length > 0 ? (
                    <div className="space-y-3">
                      {SelectedDateEvents.map((event) => (
                        <div
                          key={event._id}
                          className="dark:bg-gray-700 bg-gray-100 p-3 rounded-lg border-l-4 "
                          style={{ borderColor: event.Color || '#0ea5e9' }}
                        >
                          <div className="font-medium">{event.Title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.StartTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(event.EndTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                          {event.Location && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {event.Location}
                            </div>
                          )}
                          <button
                            onClick={() => HandleEventDelete(event._id)}
                            className="text-xs text-red-300 hover:text-red-500 mt-2"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No events on this day</p>
                  )
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">Click on a date to see events</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-8">
            {Object.entries(GroupedEvents)
              .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
              .map(([dateKey, DayEvents]) => (
                <div key={dateKey}>
                  <h2 className="text-xl font-semibold mb-4">{dateKey}</h2>
                  <div className="space-y-4">
                    {DayEvents.map((Event) => (
                      <EventCard
                        key={Event._id}
                        Event={Event}
                        OnDelete={HandleEventDelete}
                        OnEdit={HandleEventEdit}
                      />
                    ))}
                  </div>
                </div>
              ))}
            {Events.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No events scheduled</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {ShowModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
            <form onSubmit={HandleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={NewEvent.Title}
                  onChange={(E) => SetNewEvent({ ...NewEvent, Title: E.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={NewEvent.Description}
                  onChange={(E) => SetNewEvent({ ...NewEvent, Description: E.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Time *</label>
                <input
                  type="datetime-local"
                  value={NewEvent.StartTime}
                  onChange={(E) => SetNewEvent({ ...NewEvent, StartTime: E.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">End Time *</label>
                <input
                  type="datetime-local"
                  value={NewEvent.EndTime}
                  onChange={(E) => SetNewEvent({ ...NewEvent, EndTime: E.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={NewEvent.Location}
                  onChange={(E) => SetNewEvent({ ...NewEvent, Location: E.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  value={NewEvent.Category}
                  onChange={(E) => SetNewEvent({ ...NewEvent, Category: E.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex space-x-2 flex-wrap">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        NewEvent.Color === color ? 'border-gray-800 dark:border-gray-200' : 'border-gray-800'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => SetNewEvent({ ...NewEvent, Color: color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={NewEvent.IsAllDay}
                  onChange={(E) => SetNewEvent({ ...NewEvent, IsAllDay: E.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">All Day Event</label>
              </div>

              <div className="flex space-x-4 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  Create Event
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

export default CalendarPage;
