import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

import { SuperAdminDashboard } from '../pages/super-admin/SuperAdminDashboard';
import { DirectorDashboard } from '../pages/director/DirectorDashboard';
import { SeniorDashboard } from '../pages/senior/SeniorDashboard';
import { JuniorDashboard } from '../pages/junior/JuniorDashboard';
import { FacultyDashboard } from '../pages/faculty/FacultyDashboard';

import { HierarchyPage } from '../pages/hierarchy/HierarchyPage';
import { UsersListPage } from '../pages/users/UsersListPage';
import { IssuesListPage } from '../pages/issues/IssuesListPage';
import { CreateIssuePage } from '../pages/issues/CreateIssuePage';
import { IssueDetailPage } from '../pages/issues/IssueDetailPage';
import { OnboardingPage } from '../pages/onboarding/OnboardingPage';
import { QuestionsPage } from '../pages/questions/QuestionsPage';
import { SuggestionsPage } from '../pages/suggestions/SuggestionsPage';
import { MentorChatPage } from '../pages/chat/MentorChatPage';
import { CollegeInfoPage } from '../pages/info/CollegeInfoPage';
import { EmergencyPage } from '../pages/emergency/EmergencyPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { DiagnosisHub } from '../pages/diagnosis/DiagnosisHub';
import { EventsPage } from '../pages/events/EventsPage';
import { AnnouncementsPage } from '../pages/announcements/AnnouncementsPage';
import { PollsPage } from '../pages/polls/PollsPage';
import { MeetingsPage } from '../pages/meetings/MeetingsPage';

const DashboardDispatcher: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <SuperAdminDashboard />;
    case 'DIRECTOR':
      return <DirectorDashboard />;
    case 'FACULTY':
      return <FacultyDashboard />;
    case 'SENIOR':
      return <SeniorDashboard />;
    case 'JUNIOR':
      return <JuniorDashboard />;
    default:
      return <JuniorDashboard />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardDispatcher />} />
          <Route path="/hierarchy" element={<HierarchyPage />} />
          <Route path="/users" element={<UsersListPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/polls" element={<PollsPage />} />
          <Route path="/issues" element={<IssuesListPage />} />
          <Route path="/issues/new" element={<CreateIssuePage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/questions" element={<QuestionsPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/chat" element={<MentorChatPage />} />
          <Route path="/college-info" element={<CollegeInfoPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/diagnosis" element={<DiagnosisHub />} />
          <Route path="/reports" element={<SuperAdminDashboard />} />
          <Route path="/support-indicators" element={<SeniorDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
