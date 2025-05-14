import { useState, useEffect, useRef } from 'react';
import ParkingSlot from './parkingslot';

// ThingSpeak API configuration
const THINGSPEAK_WRITE_API_KEY = 'U7IAR5I3VYW88UCJ';
const THINGSPEAK_READ_API_KEY = 'OF2Q21QN289QG34M';
const THINGSPEAK_CHANNEL_ID = '2959501';
const THINGSPEAK_UPDATE_URL = 'https://api.thingspeak.com/update';
const THINGSPEAK_FEEDS_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json`;
const THINGSPEAK_FIELDS_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/fields`;
const THINGSPEAK_STATUS_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/status.json`;

const ParkingLot = () => {
  // Initialize state for 3 parking slots
  const [slots, setSlots] = useState([
    { id: 1, isReserved: false, reservationEndTime: null },
    { id: 2, isReserved: false, reservationEndTime: null },
    { id: 3, isReserved: false, reservationEndTime: null }
  ]);

  // State for ThingSpeak data
  const [thingSpeakData, setThingSpeakData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Timer references
  const timerRef = useRef(null);
  const thingSpeakTimerRef = useRef(null);

  // Function to send data to ThingSpeak for a specific slot
  const sendSlotStatusToThingSpeak = async (slotId, value) => {
    try {
      // Map slot ID to the corresponding ThingSpeak field
      const fieldName = `field${slotId}`;
      const url = `${THINGSPEAK_UPDATE_URL}?api_key=${THINGSPEAK_WRITE_API_KEY}&${fieldName}=${value}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log(`ThingSpeak response for Slot ${slotId}:`, data);

      // Update last updated timestamp
      setLastUpdated(new Date());

      // Fetch updated data after sending
      fetchThingSpeakData();
    } catch (error) {
      console.error(`Error sending data to ThingSpeak for Slot ${slotId}:`, error);
      setError(`Failed to update slot ${slotId}`);
    }
  };

  // Function to send data to ThingSpeak for all slots
  const sendAllSlotsStatusToThingSpeak = async (value) => {
    try {
      // Create URL with all three fields
      const url = `${THINGSPEAK_UPDATE_URL}?api_key=${THINGSPEAK_WRITE_API_KEY}&field1=${value}&field2=${value}&field3=${value}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('ThingSpeak response for all slots:', data);

      // Update last updated timestamp
      setLastUpdated(new Date());

      // Fetch updated data after sending
      fetchThingSpeakData();
    } catch (error) {
      console.error('Error sending data to ThingSpeak for all slots:', error);
      setError('Failed to update all slots');
    }
  };

  // Function to fetch data from ThingSpeak
  const fetchThingSpeakData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch channel feeds
      const url = `${THINGSPEAK_FEEDS_URL}?api_key=${THINGSPEAK_READ_API_KEY}&results=2`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('ThingSpeak feed data:', data);
      setThingSpeakData(data);
      setLastUpdated(new Date());

      // Update local state based on ThingSpeak data
      if (data && data.feeds && data.feeds.length > 0) {
        const latestFeed = data.feeds[data.feeds.length - 1];

        // Update slots based on ThingSpeak data
        const updatedSlots = slots.map(slot => {
          const fieldValue = latestFeed[`field${slot.id}`];
          const isReserved = fieldValue && parseInt(fieldValue) > 0;

          // Only update if the state is different
          if (isReserved !== slot.isReserved) {
            // If newly reserved, set a default reservation time
            let reservationEndTime = slot.reservationEndTime;
            if (isReserved && !slot.isReserved) {
              reservationEndTime = new Date();
              reservationEndTime.setMinutes(reservationEndTime.getMinutes() + 30); // Default 30 minutes
            } else if (!isReserved) {
              reservationEndTime = null;
            }

            return {
              ...slot,
              isReserved,
              reservationEndTime
            };
          }

          return slot;
        });

        setSlots(updatedSlots);
      }
    } catch (error) {
      console.error('Error fetching ThingSpeak data:', error);
      setError('Failed to fetch data from ThingSpeak');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch channel status
  const fetchChannelStatus = async () => {
    try {
      const url = `${THINGSPEAK_STATUS_URL}?api_key=${THINGSPEAK_READ_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      console.log('ThingSpeak channel status:', data);
      return data;
    } catch (error) {
      console.error('Error fetching ThingSpeak channel status:', error);
      setError('Failed to fetch channel status');
      return null;
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

  // Set up timer to fetch ThingSpeak data periodically
  useEffect(() => {
    // Fetch data immediately on component mount
    fetchThingSpeakData();

    // Then set up interval to fetch data every 15 seconds
    thingSpeakTimerRef.current = setInterval(() => {
      fetchThingSpeakData();
    }, 15000); // 15 seconds

    return () => {
      if (thingSpeakTimerRef.current) {
        clearInterval(thingSpeakTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="text-white font-sans w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Parking Lot Management
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
                  <div className="flex items-center mb-3">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-xs md:text-sm">
                      Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                  <button
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 text-sm rounded-lg transition-all transform hover:scale-105 flex items-center justify-center"
                    onClick={fetchThingSpeakData}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Refreshing...
                      </>
                    ) : (
                      <>Refresh Data</>
                    )}
                  </button>
                  {error && (
                    <div className="mt-3 text-xs text-red-400">
                      {error}
                    </div>
                  )}
                </div>

                {/* ThingSpeak Data */}
                <div className="bg-gray-700 p-4 md:p-6 rounded-lg md:rounded-xl border-l-4 border-yellow-500 transform transition-all hover:scale-[1.02]">
                  <h3 className="text-lg md:text-xl font-medium mb-3">ThingSpeak Channel</h3>

                  {thingSpeakData && thingSpeakData.feeds && thingSpeakData.feeds.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs md:text-sm">
                        <p className="text-gray-300 mb-1">Channel: {thingSpeakData.channel?.name || 'Parking System'}</p>
                        <p className="text-gray-300 mb-1">Last Entry: {new Date(thingSpeakData.feeds[thingSpeakData.feeds.length - 1].created_at).toLocaleString()}</p>
                      </div>

                      <div className="bg-gray-800 p-3 rounded-lg">
                        <h4 className="text-sm font-medium mb-2 text-yellow-300">Current Slot Values</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {[1, 2, 3].map(slotId => {
                            const latestFeed = thingSpeakData.feeds[thingSpeakData.feeds.length - 1];
                            const value = latestFeed[`field${slotId}`];
                            const isReserved = value && parseInt(value) > 0;
                            const status = isReserved ? 'Reserved' : 'Available';
                            const statusColor = isReserved ? 'text-purple-300' : 'text-green-300';

                            return (
                              <div key={slotId} className="text-center p-2 bg-gray-900 rounded">
                                <div className="text-xs font-medium">Slot #{slotId}</div>
                                <div className={`text-sm font-bold ${statusColor}`}>{status}</div>
                                <div className="text-xs text-gray-400">Value: {value || '0'}</div>
                                {isReserved && (
                                  <button
                                    className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white py-1 px-2 text-xs rounded transition-all transform hover:scale-105"
                                    onClick={() => handleCancel(slotId)}
                                  >
                                    Release
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 bg-gray-800 p-3 rounded-lg">
                        <h4 className="text-sm font-medium mb-2 text-yellow-300">Channel Information</h4>
                        <div className="text-xs text-gray-300">
                          <p>Channel ID: {thingSpeakData.channel?.id || THINGSPEAK_CHANNEL_ID}</p>
                          <p>Total Entries: {thingSpeakData.channel?.last_entry_id || 'Unknown'}</p>
                          <p>Created: {thingSpeakData.channel?.created_at ? new Date(thingSpeakData.channel.created_at).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      {isLoading ? 'Loading ThingSpeak data...' : 'No ThingSpeak data available'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkingLot;