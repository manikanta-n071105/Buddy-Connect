import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error';
import { apiLimiter } from './middleware/rateLimit';
import { startSlaCronJob } from './jobs/slaCron';
import { initDatabasePerformance } from './config/db';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import hierarchyRoutes from './routes/hierarchyRoutes';
import settingsRoutes from './routes/settingsRoutes';
import issueRoutes from './routes/issueRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import surveyRoutes from './routes/surveyRoutes';
import suggestionRoutes from './routes/suggestionRoutes';
import infoRoutes from './routes/infoRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import reportRoutes from './routes/reportRoutes';
import healthRoutes from './routes/healthRoutes';
import eventRoutes from './routes/eventRoutes';
import announcementRoutes from './routes/announcementRoutes';
import pollRoutes from './routes/pollRoutes';
import meetingRoutes from './routes/meetingRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow for production flexibility
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// Health and Portal Diagnosis
app.use('/api/health', healthRoutes);

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/meetings', meetingRoutes);

// Serve Frontend Static Build in Production if present
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Start SLA Cron Job & Initialize DB Performance Indexes
startSlaCronJob();
initDatabasePerformance().then(() => {
  logger.info('Database performance indexes & query optimization initialized.');
}).catch(err => {
  logger.warn('Database performance initialization warning:', err.message);
});

app.listen(PORT, () => {
  logger.info(`JuniorConnect Backend REST Server running on http://localhost:${PORT}`);
});

export default app;
