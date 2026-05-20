import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import LogQueryPage from './pages/LogQueryPage';
import ErrorQueryPage from './pages/ErrorQueryPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/logs" element={<LogQueryPage />} />
        <Route path="/errors" element={<ErrorQueryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
