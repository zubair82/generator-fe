import React, { createContext, useContext, useState } from 'react';
import { DashboardMode, QuestionPaper, TeacherPerformance, ActivityLog } from '../types';

interface AppContextType {
  papersList: QuestionPaper[];
  setPapersList: (papers: QuestionPaper[]) => void;
  teacherPerformanceList: TeacherPerformance[];
  recentActivityFeed: ActivityLog[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {

  const [papersList, setPapersList] = useState<QuestionPaper[]>([
    { id: '1', name: 'Calculus III Final Exam - Fall 2023', courseCode: 'MATH-301', instructor: 'Prof. Harrison', uploadedAt: 'Oct 24, 2023 • 09:41 AM', status: 'AI-PROCESSED', subject: 'Mathematics' },
    { id: '2', name: 'Introduction to Physics Midterm A', courseCode: 'PHYS-101', instructor: 'Dept. Master', uploadedAt: 'Oct 22, 2023 • 14:20 PM', status: 'MANUALLY-VERIFIED', subject: 'Physics' },
    { id: '3', name: 'Organic Chemistry Quiz 4 (Draft)', courseCode: 'CHEM-202', instructor: 'Unassigned', uploadedAt: 'Oct 25, 2023 • 08:05 AM', status: 'PENDING', subject: 'Chemistry' },
    { id: '4', name: 'European History Essay Prompts', courseCode: 'HIST-105', instructor: 'Prof. Vance', uploadedAt: 'Oct 21, 2023 • 11:15 AM', status: 'AI-PROCESSED', subject: 'History' },
    { id: '5', name: 'Discrete Math Term Assessment', courseCode: 'MATH-102', instructor: 'Dr. Patel', uploadedAt: 'Oct 18, 2023 • 16:30 PM', status: 'MANUALLY-VERIFIED', subject: 'Mathematics' },
    { id: '6', name: 'Introduction to Organic Syntheses', courseCode: 'CHEM-205', instructor: 'Jessica Lin', uploadedAt: 'Oct 15, 2023 • 10:15 AM', status: 'PENDING', subject: 'Chemistry' },
  ]);

  const teacherPerformanceList: TeacherPerformance[] = [
    { id: '1', name: 'Sarah Anderson', subject: 'Mathematics', papers: 14, verified: 420, status: 'ACTIVE', avatar: 'SA' },
    { id: '2', name: 'Marcus Reed', subject: 'Physics', papers: 8, verified: 240, status: 'PENDING', avatar: 'MR' },
    { id: '3', name: 'Jessica Lin', subject: 'Chemistry', papers: 22, verified: 650, status: 'REVIEWING', avatar: 'JL' },
    { id: '4', name: 'David Thompson', subject: 'Biology', papers: 5, verified: 150, status: 'ACTIVE', avatar: 'DT' },
  ];

  const recentActivityFeed: ActivityLog[] = [
    { id: '1', user: 'Sarah Anderson', action: 'uploaded', target: 'MATH-101-Midterm.pdf', time: '10 MINS AGO', type: 'purple' },
    { id: '2', user: 'AI Pipeline', action: 'completed processing for', target: 'PHYS-202-Final.pdf', time: '45 MINS AGO', type: 'success' },
    { id: '3', user: 'Jessica Lin', action: 'verified 50 questions in', target: 'Chemistry batch', time: '2 HOURS AGO', type: 'info' },
    { id: '4', user: 'System', action: 'flagged potential duplicate in', target: 'BIO-105-Quiz.docx', time: '4 HOURS AGO', type: 'warning' },
  ];

  return (
    <AppContext.Provider
      value={{
        papersList,
        setPapersList,
        teacherPerformanceList,
        recentActivityFeed
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
