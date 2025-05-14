import { useState, useEffect } from 'react';

// ThingSpeak API configuration for driver details
const THINGSPEAK_READ_API_KEY = '2IZXG22CENLRU67A';
const THINGSPEAK_CHANNEL_ID = '2962592';
const THINGSPEAK_FEEDS_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=2`;

const DriverDetailsApi = () => {
  // State for ThingSpeak data
  const [thingSpeakData, setThingSpeakData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to get the latest non-empty value for a field
  const getLatestFieldValue = (feeds, fieldNumber) => {
    // Reverse the feeds to start from the most recent
    const reversedFeeds = [...feeds].reverse();

    // Find the first feed that has a non-empty value for this field
    for (const feed of reversedFeeds) {
      const fieldValue = feed[`field${fieldNumber}`];
      if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
        return fieldValue;
      }
    }

    // Default to '0' if no value is found
    return '0';
  };

  // Function to fetch data from ThingSpeak
  const fetchThingSpeakData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch more results to see the history
      const url = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=10`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('ThingSpeak data:', data);

      // Process the data to get the latest values for each field
      if (data && data.feeds && data.feeds.length > 0) {
        // Log the raw feed data
        console.log('Feed history:');
        data.feeds.forEach((feed, index) => {
          console.log(`Feed ${index}:`, feed);
          console.log(`  Created at: ${feed.created_at}`);
          console.log(`  Field 1: ${feed.field1}`);
          console.log(`  Field 2: ${feed.field2}`);
          console.log(`  Field 3: ${feed.field3}`);
        });

        // Get the latest values for each field
        const latestFeed = data.feeds[data.feeds.length - 1];
        console.log('Latest feed:', latestFeed);

        // Get the latest non-empty values for each field
        const field1Value = getLatestFieldValue(data.feeds, 1);
        const field2Value = getLatestFieldValue(data.feeds, 2);
        const field3Value = getLatestFieldValue(data.feeds, 3);

        console.log('Latest non-empty values:');
        console.log('Field 1 value:', field1Value);
        console.log('Field 2 value:', field2Value);
        console.log('Field 3 value:', field3Value);

        // Create a modified version of the latest feed with the latest non-empty values
        const enhancedLatestFeed = {
          ...latestFeed,
          field1: field1Value,
          field2: field2Value,
          field3: field3Value
        };

        // Replace the latest feed in the data with our enhanced version
        const enhancedData = {
          ...data,
          feeds: [...data.feeds.slice(0, -1), enhancedLatestFeed]
        };

        setThingSpeakData(enhancedData);
      } else {
        setThingSpeakData(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching ThingSpeak data:', error);
      setError('Failed to fetch data from ThingSpeak');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchThingSpeakData();
  }, []);

  // Set up auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchThingSpeakData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="text-white font-sans w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        {/* Header with futuristic styling */}
        <header className="mb-8 md:mb-12 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-5 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Vehicle Status
          </h1>
          <p className="text-sm sm:text-base md:text-xl text-gray-300">Track vehicles in real-time: In Park (100) or Left Park (0)</p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {/* Driver Status Dashboard */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-xl md:rounded-2xl p-5 md:p-8 shadow-2xl border border-gray-700 h-full">
              <h2 className="text-xl md:text-3xl font-semibold mb-5 md:mb-7 text-purple-300 flex items-center">
                <span className="mr-3">🚗</span> Vehicle Tracking
              </h2>

              <div className="space-y-5 md:space-y-7">
                {/* ThingSpeak Data */}
                <div className="bg-gray-700 p-4 md:p-6 rounded-lg md:rounded-xl border-l-4 border-yellow-500 transform transition-all hover:scale-[1.02]">
                  <h3 className="text-lg md:text-xl font-medium mb-3">Vehicle Status</h3>

                  {thingSpeakData && thingSpeakData.feeds && thingSpeakData.feeds.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs md:text-sm">
                        <p className="text-gray-300 mb-1">Channel: {thingSpeakData.channel?.name || 'Vehicle Tracking'}</p>
                        <p className="text-gray-300 mb-1">Last Updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}</p>
                      </div>

                      <div className="space-y-6">
                        {/* Current Vehicle Status */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-sm font-medium mb-4 text-yellow-300">Current Vehicle Status</h4>
                          <div className="space-y-4">
                            {[1, 2, 3].map(vehicleId => {
                              const latestFeed = thingSpeakData.feeds[thingSpeakData.feeds.length - 1];

                              // Get the field value and handle it properly
                              let value = latestFeed[`field${vehicleId}`];

                              // Log the raw value for debugging
                              console.log(`Vehicle #${vehicleId} raw value:`, value);

                              // Check if the value is exactly 100 (as a string or number)
                              const inPark = value === '100' || value === 100;

                              // If value is undefined, null, or empty string, display as '0'
                              if (value === undefined || value === null || value === '') {
                                value = '0';
                              }

                              const statusText = inPark ? 'In the park' : 'Left the park';
                              const statusColor = inPark ? 'bg-green-500' : 'bg-red-500';
                              const lastUpdatedTime = new Date(latestFeed.created_at).toLocaleTimeString();

                              return (
                                <div key={vehicleId} className="p-4 bg-gray-700 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className={`w-4 h-4 ${statusColor} rounded-full mr-3 animate-pulse`}></div>
                                      <div>
                                        <div className="font-medium text-lg">Vehicle #{vehicleId}</div>
                                        <div className="text-sm text-gray-300 mt-1">
                                          Value: <span className="font-mono bg-gray-800 px-2 py-1 rounded ml-1">{value}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">Updated: {lastUpdatedTime}</div>
                                      </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${inPark ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                      {statusText}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Feed History */}
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <h4 className="text-sm font-medium mb-4 text-yellow-300">Feed History (Last 5 Updates)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-gray-700">
                                  <th className="py-2 px-2 text-left">Time</th>
                                  <th className="py-2 px-2 text-center">Vehicle #1</th>
                                  <th className="py-2 px-2 text-center">Vehicle #2</th>
                                  <th className="py-2 px-2 text-center">Vehicle #3</th>
                                </tr>
                              </thead>
                              <tbody>
                                {thingSpeakData.feeds.slice(-5).reverse().map((feed, index) => {
                                  // For the first row (latest feed), we're already showing the enhanced values
                                  const isLatestFeed = index === 0;

                                  return (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-750' : 'bg-gray-800'}>
                                      <td className="py-2 px-2">
                                        {new Date(feed.created_at).toLocaleString()}
                                        {isLatestFeed && (
                                          <div className="text-xs text-blue-400 mt-1">(Enhanced with latest values)</div>
                                        )}
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span className={`inline-block px-2 py-1 rounded ${feed.field1 === '100' || feed.field1 === 100 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                          {feed.field1 || '0'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span className={`inline-block px-2 py-1 rounded ${feed.field2 === '100' || feed.field2 === 100 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                          {feed.field2 || '0'}
                                        </span>
                                      </td>
                                      <td className="py-2 px-2 text-center">
                                        <span className={`inline-block px-2 py-1 rounded ${feed.field3 === '100' || feed.field3 === 100 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                          {feed.field3 || '0'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 text-xs text-gray-400">
                            <p className="mb-1"><strong>Note:</strong> When one vehicle's status is updated, ThingSpeak creates a new entry with only that field's value.</p>
                            <p>The "Enhanced with latest values" row shows each vehicle's most recent status, even if it wasn't updated in the latest entry.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">
                      {isLoading ? 'Loading vehicle data...' : 'No vehicle data available'}
                    </div>
                  )}

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDetailsApi;
