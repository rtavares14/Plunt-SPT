import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { AuthProvider } from './context/AuthContext';

// Mirror of olive-main / olive-light / cream-main in tailwind.config.js
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
