import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/marketing/LandingPage';
import PrivacyPage from './pages/marketing/PrivacyPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import FeedPage from './pages/app/FeedPage';
import UserPage from './pages/app/profile/UserPage';
import EditProfilePage from './pages/app/profile/EditProfilePage';
import ComingSoonPage from './pages/app/ComingSoonPage';
import ProtectedLayout from './components/ProtectedLayout';
import { AuthProvider } from './context/AuthContext';
// Mirror of the colors in tailwind.config.js — update both together if a color changes
const theme = createTheme({
  palette: {
    primary: { main: '#405035' },
    secondary: { main: '#5B6952' },
    background: { default: '#ECE7DC' },
  },
  typography: {
    fontFamily: '"Lateef", Georgia, serif',
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} locale="en">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile" element={<UserPage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route
                path="/garden"
                element={
                  <ComingSoonPage
                    title="My garden"
                    description="Your plants and planters will live here, all in one place."
                  />
                }
              />
              <Route
                path="/friends"
                element={
                  <ComingSoonPage
                    title="Friends"
                    description="Connect with your plant people, share collections, and send watering reminders."
                  />
                }
              />
              <Route
                path="/notifications"
                element={
                  <ComingSoonPage
                    title="Notifications"
                    description="Watering reminders, friend requests, and garden updates will show up here."
                  />
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
