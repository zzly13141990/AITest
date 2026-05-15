
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ConnectionsPage from './pages/ConnectionsPage';
import SqlEditorPage from './pages/SqlEditorPage';
import SettingsPage from './pages/SettingsPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<SqlEditorPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
