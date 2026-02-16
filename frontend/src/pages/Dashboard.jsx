// Dashboard page - main page that integrates all components
// TODO: Implement dashboard with date filter, metrics, and alerts

import DashboardSummary from '../components/DashboardSummary';
import DateFilter from '../components/DateFilter';
import AlertsList from '../components/AlertsList';

const Dashboard = () => {
  return (
    <div>
      <h2>Dashboard</h2>
      <DateFilter />
      <DashboardSummary />
      <AlertsList />
    </div>
  );
};

export default Dashboard;
