import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

const ParkingSlot = ({ id, isReserved, onReserve, onCancel, reservationEndTime }) => {
  const [showTimeSelect, setShowTimeSelect] = useState(false);
  const [selectedTime, setSelectedTime] = useState(30); // Default 30 minutes

  // State for the countdown timer
  const [remainingTime, setRemainingTime] = useState("");

  // Update the countdown timer
  useEffect(() => {
    if (!isReserved || !reservationEndTime) {
      setRemainingTime("");
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = reservationEndTime.getTime();
      const remainingMs = endTime - now;

      if (remainingMs <= 0) {
        setRemainingTime("Expired");
        return;
      }

      const minutes = Math.floor(remainingMs / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      setRemainingTime(`${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const timerId = setInterval(updateTimer, 1000);

    // Clean up interval on unmount or when reservation changes
    return () => clearInterval(timerId);
  }, [isReserved, reservationEndTime]);

  const handleReserveClick = () => {
    setShowTimeSelect(true);
  };

  const handleTimeSubmit = () => {
    setShowTimeSelect(false);
    onReserve(id, selectedTime);
  };

  return (
    <div className={`relative overflow-hidden rounded-lg md:rounded-xl p-5 md:p-6 shadow-lg transition-all duration-300 transform hover:scale-105 ${isReserved ? 'bg-gradient-to-br from-purple-600 to-purple-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
      <div className="absolute top-0 right-0 bg-black bg-opacity-30 px-3 py-1 rounded-bl-lg md:rounded-bl-xl text-xs sm:text-sm">
        #{id}
      </div>

      <div className="flex flex-col items-center justify-center h-full py-3 md:py-4">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 mb-3 md:mb-4 rounded-full flex items-center justify-center ${isReserved ? 'bg-purple-400' : 'bg-blue-400'} shadow-inner`}>
          {isReserved ? (
            <span className="text-xl md:text-2xl">🔒</span>
          ) : (
            <span className="text-xl md:text-2xl">🅿️</span>
          )}
        </div>

        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
          {isReserved ? 'Reserved' : 'Available'}
        </h3>

        {isReserved && reservationEndTime && (
          <div className="text-xs md:text-sm text-white mb-3 bg-black bg-opacity-30 px-3 py-1 rounded-full">
            Time left: {remainingTime}
          </div>
        )}

        {showTimeSelect ? (
          <div className="flex flex-col items-center space-y-2 w-full">
            <div className="flex items-center justify-center w-full">
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(Number(e.target.value))}
                className="bg-white text-gray-800 rounded px-2 py-1 text-sm w-full"
              >
                <option value={5}>5 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleTimeSubmit}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg font-medium transition-all hover:bg-green-600 transform hover:scale-105 active:scale-95"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowTimeSelect(false)}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded-lg font-medium transition-all hover:bg-gray-600 transform hover:scale-105 active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          isReserved ? (
            <button
              onClick={() => onCancel(id)}
              className="px-4 sm:px-5 py-2 text-sm md:text-base bg-white text-purple-800 rounded-lg font-medium transition-all hover:bg-opacity-90 transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={handleReserveClick}
              className="px-4 sm:px-5 py-2 text-sm md:text-base bg-white text-blue-800 rounded-lg font-medium transition-all hover:bg-opacity-90 transform hover:scale-105 active:scale-95"
            >
              Reserve
            </button>
          )
        )}
      </div>

      {/* Animated border effect */}
      <div className={`absolute inset-0 rounded-lg md:rounded-xl pointer-events-none ${isReserved ? 'border-2 border-purple-300' : 'border-2 border-blue-300'} opacity-0 hover:opacity-100 transition-opacity duration-300`}></div>
    </div>
  );
};

ParkingSlot.propTypes = {
  id: PropTypes.number.isRequired,
  isReserved: PropTypes.bool.isRequired,
  onReserve: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  reservationEndTime: PropTypes.instanceOf(Date)
};

export default ParkingSlot;