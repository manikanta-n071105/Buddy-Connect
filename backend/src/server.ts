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
import { 
  initDatabasePerformance, 
  initHostelMessTables, 
  initCrFeedbackTables, 
  initCounselingTables,
  initQuizTables,
  initSystemSettingsTables,
  initDisciplinaryCommitteeTables,
  initBloodDonationTables
} from './config/db';
import { initRedis } from './config/redis';

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
import messRoutes from './routes/messRoutes';
import crFeedbackRoutes from './routes/crFeedbackRoutes';
import counselingRoutes from './routes/counselingRoutes';
import quizRoutes from './routes/quizRoutes';
import bloodRoutes from './routes/bloodRoutes';

import compression from 'compression';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// High-Performance Payload Gzip Compression (reduces network payload size by ~75%)
app.use(compression({
  level: 6,
  threshold: 1024, // Compress responses above 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

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
  credentials: true,
  maxAge: 86400 // Cache CORS pre-flight for 24 hours in browser
}));

// Fast pre-flight handling
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', apiLimiter);

// Health and Portal Diagnosis
app.use('/api/health', healthRoutes);
app.use('/api/diagnosis', healthRoutes);

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
app.use('/api/mess', messRoutes);
app.use('/api/cr-feedback', crFeedbackRoutes);
app.use('/api/counseling', counselingRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/blood', bloodRoutes);

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

// Start SLA Cron Job, Initialize Redis & DB Performance Indexes
initRedis();
startSlaCronJob();
initDatabasePerformance();
initHostelMessTables();
initCrFeedbackTables();
initQuizTables();
initSystemSettingsTables();
initDisciplinaryCommitteeTables();
initBloodDonationTables();
initCounselingTables().then(() => {
  logger.info('Database performance, Quiz, CR Feedback, Blood Donation & Counseling tables initialized.');
}).catch(err => {
  logger.warn('Database initialization warning:', err.message);
});

app.listen(PORT, () => {
  logger.info(`JuniorConnect Backend REST Server running on http://localhost:${PORT}`);
});

export default app;
