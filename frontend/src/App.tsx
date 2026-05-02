import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Mirror of green-main / green-second in tailwind.config.js
const theme = createTheme({
  palette: {
    primary: { main: '#14532d' },
    secondary: { main: '#0f7033' },
    background: { default: '#ebe1d3' },
  },
  typography: {
    fontFamily: '"Playfair Display"',
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' }, '&:active': { boxShadow: 'none' } },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route
              path="/"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <LandingPage />
                  </Box>
                </Box>
              }
            />
            <Route
              path="/auth"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <AuthPage />
                  </Box>
                </Box>
              }
            />
            <Route
              path="/verify-email"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <VerifyEmailPage />
                  </Box>
                </Box>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <ForgotPasswordPage />
                  </Box>
                </Box>
              }
            />
            <Route
              path="/reset-password"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <ResetPasswordPage />
                  </Box>
                </Box>
              }
            />
            <Route
              path="/profile"
              element={
                <Box className="min-h-screen flex flex-col">
                  <Navbar />
                  <Box className="pt-16 flex-1 flex flex-col">
                    <ProfilePage />
                  </Box>
                </Box>
              }
            />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
