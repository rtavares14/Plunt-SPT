import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LandingPage from './pages/LandingPage';

// Mirror of olive-deep / cream in tailwind.config.js
const theme = createTheme({
  palette: {
    primary:    { main: '#405035' },
    secondary:  { main: '#5B6952' },
    background: { default: '#ECE7DC' },
  },
  typography: {
    fontFamily: '"Lateef", Georgia, serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LandingPage />
    </ThemeProvider>
  );
}

export default App;
