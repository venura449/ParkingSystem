import { useState, useEffect, useRef } from 'react';
import ParkingSlot from './parkingslot';

// ThingSpeak API configuration
const THINGSPEAK_API_KEY = 'U7IAR5I3VYW88UCJ';
const THINGSPEAK_API_URL = 'https://api.thingspeak.com/update';

const ParkingLot = () => {
  // Initialize state for 3 parking slots
  const [slots, setSlots] = useState([
    { id: 1, isReserved: false, reservationEndTime: null },
    { id: 2, isReserved: false, reservationEndTime: null },
    { id: 3, isReserved: false, reservationEndTime: null }
  ]);

  // Timer reference for updating countdown
  const timerRef = useRef(null);

  // Function to send data to ThingSpeak for a specific slot
  const sendSlotStatusToThingSpeak = async (slotId, value) => {
    try {
      // Map slot ID to the corresponding ThingSpeak field
      const fieldName = `field${slotId}`;
      const url = `${THINGSPEAK_API_URL}?api_key=${THINGSPEAK_API_KEY}&${fieldName}=${value}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(`ThingSpeak response for Slot ${slotId}:`, data);
    } catch (error) {
      console.error(`Error sending data to ThingSpeak for Slot ${slotId}:`, error);
    }
  };

  // Function to send data to ThingSpeak for all slots
  const sendAllSlotsStatusToThingSpeak = async (value) => {
    try {
      // Create URL with all three fields
      const url = `${THINGSPEAK_API_URL}?api_key=${THINGSPEAK_API_KEY}&field1=${value}&field2=${value}&field3=${value}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('ThingSpeak response for all slots:', data);
    } catch (error) {
      console.error('Error sending data to ThingSpeak for all slots:', error);
    }
  };

  // Function to handle slot reservation with time
  const handleReserve = (slotId, minutes) => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);

    // Send value 100 to ThingSpeak for the specific slot
    sendSlotStatusToThingSpeak(slotId, 100);

    setSlots(slots.map(slot =>
      slot.id === slotId ? {
        ...slot,
        isReserved: true,
        reservationEndTime: endTime
      } : slot
    ));
  };

  // Function to handle reservation cancellation
  const handleCancel = (slotId) => {
    // Send value 0 to ThingSpeak for the specific slot
    sendSlotStatusToThingSpeak(slotId, 0);

    setSlots(slots.map(slot =>
      slot.id === slotId ? {
        ...slot,
        isReserved: false,
        reservationEndTime: null
      } : slot
    ));
  };

  // Check for expired reservations
  const checkReservations = () => {
    const now = new Date();
    let updated = false;
    const expiredSlotIds = [];

    const updatedSlots = slots.map(slot => {
      if (slot.isReserved && slot.reservationEndTime && new Date(slot.reservationEndTime) <= now) {
        updated = true;
        expiredSlotIds.push(slot.id);
        return { ...slot, isReserved: false, reservationEndTime: null };
      }
      return slot;
    });

    if (updated) {
      // For each expired slot, send value 0 to ThingSpeak
      expiredSlotIds.forEach(slotId => {
        sendSlotStatusToThingSpeak(slotId, 0);
      });

      setSlots(updatedSlots);
    }
  };

  // Set up timer to check reservations and update countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      checkReservations();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        {/* Header with futuristic styling */}
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Quantum Parking System
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-300">Advanced slot management with real-time monitoring</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-2xl border border-gray-700 transform transition-all hover:scale-[1.005] hover:shadow-lg">
              <h2 className="text-xl md:text-3xl font-semibold mb-5 md:mb-7 text-blue-300 flex items-center">
                <span className="mr-3">🚗</span> Parking Slots
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
                {slots.map(slot => (
                  <ParkingSlot
                    key={slot.id}
                    id={slot.id}
                    isReserved={slot.isReserved}
                    reservationEndTime={slot.reservationEndTime}
                    onReserve={handleReserve}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-gray-800 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-2xl border border-gray-700 h-full">
              <h2 className="text-xl md:text-3xl font-semibold mb-5 md:mb-7 text-purple-300 flex items-center">
                <span className="mr-3">📊</span> Dashboard
              </h2>

              <div className="space-y-5 md:space-y-7">
                <div className="bg-gray-700 p-4 md:p-6 rounded-lg md:rounded-xl border-l-4 border-blue-500 transform transition-all hover:scale-[1.02]">
                  <h3 className="text-lg md:text-xl font-medium mb-3">Slot Availability</h3>
                  <div className="h-3 md:h-4 bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                      style={{ width: `${(slots.filter(slot => !slot.isReserved).length / slots.length * 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-gray-300">
                    {slots.filter(slot => !slot.isReserved).length} of {slots.length} slots available
                  </p>

                  {/* Show slots that will be available soon */}
                  {slots.some(slot => slot.isReserved && slot.reservationEndTime) && (
                    <div className="mt-2 text-xs md:text-sm">
                      <p className="text-yellow-300">
                        {slots.filter(slot => {
                          if (!slot.isReserved || !slot.reservationEndTime) return false;
                          const now = new Date().getTime();
                          const endTime = new Date(slot.reservationEndTime).getTime();
                          const minutesLeft = Math.floor((endTime - now) / (1000 * 60));
                          return minutesLeft <= 5 && minutesLeft > 0;
                        }).length} slots available soon
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-700 p-4 md:p-6 rounded-lg md:rounded-xl border-l-4 border-purple-500 transform transition-all hover:scale-[1.02]">
                  <h3 className="text-lg md:text-xl font-medium mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white py-2 md:py-2.5 px-3 md:px-4 text-sm md:text-base rounded-lg transition-all transform hover:scale-105"
                      onClick={() => {
                        // Send value 0 to ThingSpeak for all slots
                        sendAllSlotsStatusToThingSpeak(0);
                        setSlots(slots.map(slot => ({
                          ...slot,
                          isReserved: false,
                          reservationEndTime: null
                        })));
                      }}
                    >
                      Release All
                    </button>
                    <button
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 md:py-2.5 px-3 md:px-4 text-sm md:text-base rounded-lg transition-all transform hover:scale-105"
                      onClick={() => {
                        // Send value 100 to ThingSpeak for all slots
                        sendAllSlotsStatusToThingSpeak(100);
                        const endTime = new Date();
                        endTime.setMinutes(endTime.getMinutes() + 30); // Default 30 minutes
                        setSlots(slots.map(slot => ({
                          ...slot,
                          isReserved: true,
                          reservationEndTime: endTime
                        })));
                      }}
                    >
                      Reserve All (30m)
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 md:p-6 rounded-lg md:rounded-xl border-l-4 border-indigo-500">
                  <h3 className="text-lg md:text-xl font-medium mb-3">System Status</h3>
                  <div className="flex items-center mb-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                    <span className="text-sm md:text-base">Online</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-xs md:text-sm">Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 md:mt-12 text-center text-gray-400 py-4">
          <p className="text-xs md:text-sm">© {new Date().getFullYear()} Quantum Parking Systems</p>
          <p className="text-xs mt-2">Powered by React & Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
};

export default ParkingLot;