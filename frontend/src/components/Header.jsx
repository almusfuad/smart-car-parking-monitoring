import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              Smart Car Parking Monitoring
            </h1>
          </div>
          
          <nav className="flex gap-6">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            
            <Link
              to="/live"
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                isActive('/live')
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live Monitoring
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
