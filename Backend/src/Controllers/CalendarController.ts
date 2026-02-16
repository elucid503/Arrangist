import { Context } from 'hono';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

import { EventModel } from '../Models/Event';
import { GetUserID } from '../Middleware/Auth';

import { EventSchema, UpdateEventSchema } from '../Utils/Validation';

export class CalendarController {

  static async CreateEvent(c: Context) {

    const UserID = GetUserID(c);

    return await c.req.json().then(async (Body) => {

      const ValidatedData = EventSchema.parse(Body);

      const NewEvent = await EventModel.create({
        
        ...ValidatedData,

        UserID,
        StartTime: new Date(ValidatedData.StartTime),
        EndTime: new Date(ValidatedData.EndTime),

        Recurrence: ValidatedData.Recurrence ? {

          ...ValidatedData.Recurrence,
          EndDate: ValidatedData.Recurrence.EndDate ? new Date(ValidatedData.Recurrence.EndDate) : undefined,

        } : undefined,

      });

      return c.json({ message: 'Event created successfully', event: NewEvent }, 201);
      
    }).catch((error: any) => {

      if (error.name == 'ZodError') {
          
        return c.json({ error: 'Validation error', details: error.errors }, 400);

      }
        
      return c.json({ error: error.message || 'Failed to create event' }, 500);

    });
    
  }

  static async GetAllEvents(c: Context) {

    const UserID = GetUserID(c);

    const { startDate, endDate, category } = c.req.query();

    const Filter: any = { UserID };
    
    if (startDate && endDate) {

      Filter.StartTime = {

        $gte: startOfDay(parseISO(startDate)),
        $lte: endOfDay(parseISO(endDate)),

      };

    }
    
    if (category) Filter.Category = category;

    return await EventModel.find(Filter).sort({ StartTime: 1 }).then((Events) => {

        return c.json({ events: Events, count: Events.length });
      
    }).catch((error: any) => {
        
      return c.json({ error: error.message || 'Failed to fetch events' }, 500);
      
    });

  }

  static async GetEventById(c: Context) {

    const UserID = GetUserID(c);
    const EventId = c.req.param('id');

    return await EventModel.findOne({ _id: EventId, UserID }).then((Event) => {

      if (!Event) {
          
        return c.json({ error: 'Event not found' }, 404);
        
      }

      return c.json({ event: Event });

    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to fetch event' }, 500);
      
    });

  }

  static async UpdateEvent(c: Context) {

    const UserID = GetUserID(c);
    const EventId = c.req.param('id');

    return await c.req.json().then(async (Body) => {

      const ValidatedData = UpdateEventSchema.parse(Body);

      const UpdateData: any = { ...ValidatedData };
      
      if (ValidatedData.StartTime) UpdateData.StartTime = new Date(ValidatedData.StartTime);
      if (ValidatedData.EndTime) UpdateData.EndTime = new Date(ValidatedData.EndTime);
      
      ValidatedData.Recurrence?.EndDate && (UpdateData.Recurrence.EndDate = new Date(ValidatedData.Recurrence.EndDate));

      const UpdatedEvent = await EventModel.findOneAndUpdate({ _id: EventId, UserID }, UpdateData, { new: true });

      if (!UpdatedEvent) {

        return c.json({ error: 'Event not found' }, 404);

      }

      return c.json({ message: 'Event updated successfully', event: UpdatedEvent });
      
    }).catch((error) => {
        
      if (error.name == 'ZodError') {

        return c.json({ error: 'Validation error', details: error.errors }, 400);

      }

      return c.json({ error: error.message || 'Failed to update event' }, 500);

    });
    
  }

  static async DeleteEvent(c: Context) {

    const UserID = GetUserID(c);
    const EventId = c.req.param('id');

    return await EventModel.findOneAndDelete({ _id: EventId, UserID }).then((DeletedEvent) => {
      
      if (!DeletedEvent) {
        return c.json({ error: 'Event not found' }, 404);
      }

      return c.json({ message: 'Event deleted successfully' });
      
    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to delete event' }, 500);
      
    });
    
  }

  static async ExportToICS(c: Context) {

    const UserID = GetUserID(c);
    const { startDate, endDate } = c.req.query();

    const Filter: any = { UserID };

    if (startDate && endDate) {

      Filter.StartTime = {

        $gte: startOfDay(parseISO(startDate)),
        $lte: endOfDay(parseISO(endDate)),

      };

    }

    return await EventModel.find(Filter).then((Events) => {

      // Simple ICS format
      
      let IcsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Arrangist//Calendar//EN\n';
        
      Events.forEach(E => {
          
        IcsContent += 'BEGIN:VEVENT\n';
        IcsContent += `UID:${E._id}@arrangist.app\n`;
        IcsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        IcsContent += `DTSTART:${E.StartTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        IcsContent += `DTEND:${E.EndTime.toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        IcsContent += `SUMMARY:${E.Title}\n`;
        
        if (E.Description) IcsContent += `DESCRIPTION:${E.Description}\n`;
        if (E.Location) IcsContent += `LOCATION:${E.Location}\n`;

        IcsContent += 'END:VEVENT\n';
        
      });

      IcsContent += 'END:VCALENDAR';

      c.header('Content-Type', 'text/calendar');
      c.header('Content-Disposition', 'attachment; filename="calendar.ics"');
      
      return c.body(IcsContent);

    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to export calendar' }, 500);
      
    });
    
  }

}