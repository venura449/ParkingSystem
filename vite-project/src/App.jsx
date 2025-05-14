import './App.css'
import { useState } from 'react'
import ParkingLot from './parkingLot'
import DriverDetailsApi from './driverDetailsApi'
import Footer from './footer'

function App() {
  const [currentPage, setCurrentPage] = useState('parking')

  // Simple navigation component
  const Navigation = () => {
    return (
      <nav className="bg-gray-800 border-b border-gray-700 py-3 px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Parking Management System
            </span>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('parking')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'parking'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Parking Lot
            </button>

            <button
              onClick={() => setCurrentPage('driver-details')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentPage === 'driver-details'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Vehicle Status
            </button>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <div className="App flex flex-col min-h-screen bg-gray-900">
      <Navigation />
      <main className="flex-grow">
        {currentPage === 'parking' ? <ParkingLot /> : <DriverDetailsApi />}
      </main>
      <Footer />
    </div>
  )
}

export default App
