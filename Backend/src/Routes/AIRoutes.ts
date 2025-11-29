import { Hono } from 'hono';

import { AuthMiddleware } from '../Middleware/Auth';

import { AIController } from '../Controllers/AIController';

const AIRoutes = new Hono();

// All AI routes require authentication

AIRoutes.use('*', AuthMiddleware);

// Natural language task creation

AIRoutes.post('/parse-task', AIController.CreateTaskFromNaturalLanguage);

export default AIRoutes;