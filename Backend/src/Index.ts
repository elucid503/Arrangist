import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';

import { ConnectDatabase, DisconnectDatabase } from './Config/Database';

import TaskRoutes from './Routes/TaskRoutes';
import CalendarRoutes from './Routes/CalendarRoutes';
import UserRoutes from './Routes/UserRoutes';
import ScheduleRoutes from './Routes/ScheduleRoutes';
import AIRoutes from './Routes/AIRoutes';

const App = new Hono();

// Middleware

App.use('*', logger());
App.use('*', cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true })); // CORS fallback to the vite dev server

// API Routes 

App.route('/api/users', UserRoutes);
App.route('/api/tasks', TaskRoutes);
App.route('/api/calendar', CalendarRoutes);
App.route('/api/schedule', ScheduleRoutes);
App.route('/api/ai', AIRoutes);

// Serve static files

App.get('/assets/*', serveStatic({ root: "../Frontend/dist" })); // Serve assets
App.get('*', serveStatic({ path: 'index.html', root: "../Frontend/dist" })); // Serve index.html for single page app

// Error handling

App.onError((err, c) => {

  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);

});

const Port = process.env.PORT || 3000;

const StartServer = async () => {

  return await ConnectDatabase().then(() => {

    console.log('Database connected successfully');
    console.log(`Server running on http://localhost:${Port}`);
    
    return App;
    
  }).catch((error) => {

    console.error('Failed to start server:', error);
    process.exit(1);
    
  });
  
};

StartServer();

const Shutdown = async (Sig: string) => { // Graceful shutdown to prevent memory leaks from unclosed connections

  console.log(`\n${Sig} received. Shutting down...`);
  
  await DisconnectDatabase();
  
  console.log('Cleanup complete. Exiting.');
  process.exit(0);

};

process.on('SIGTERM', () => Shutdown('SIGTERM'));
process.on('SIGINT', () => Shutdown('SIGINT'));

export default App;