
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ConnectionsPage from './pages/ConnectionsPage';
import SqlEditorPage from './pages/SqlEditorPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SqlEditorPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
