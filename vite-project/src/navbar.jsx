import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="bg-gray-800 border-b border-gray-700 py-3 px-4 sm:px-6 md:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            Quantum Parking
          </span>
        </div>
        
        <div className="flex space-x-4">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === '/' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Parking Lot
          </Link>
          
          <Link 
            to="/driver-details" 
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === '/driver-details' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            Driver Details API
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
