import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import LiveMonitoringPage from './pages/LiveMonitoringPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveMonitoringPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
