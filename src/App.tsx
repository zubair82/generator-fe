import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { AppProvider } from './contexts/AppContext';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Papers } from './pages/Papers';
import { UploadPdf } from './pages/UploadPdf';
import { ManualEntry } from './pages/ManualEntry';
import { VariantGen } from './pages/VariantGen';
import { Verification } from './pages/Verification';
import { Review } from './pages/Review';
import { AddResource } from './pages/AddResource';

function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppProvider>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes wrapped in MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/papers" element={<Papers />} />
              <Route path="/upload_pdf" element={<UploadPdf />} />
              <Route path="/manual_entry" element={<ManualEntry />} />
              <Route path="/variant_gen" element={<VariantGen />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/review" element={<Review />} />
              <Route path="/add-resource" element={<AddResource />} />
            </Route>

            {/* Default redirect to login (which will auto-redirect to dashboard if authed) */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export default App;
