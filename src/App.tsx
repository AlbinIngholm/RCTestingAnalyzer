import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import './App.css';

interface Track {
  id: string;
  name: string;
  location?: { lat: number; lon: number };
}

interface Run {
  bestLap: number;
  avgLap: number;
  fiveMinuteStint?: string;
  notes?: string;
  setup?: { tires: string; favorite: boolean };
}

interface Session {
  id: string;
  date: string;
  name?: string;
  runs: Run[];
  weather: { temp: number; condition: string };
  notes?: string;
}

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackSearch, setTrackSearch] = useState('');
  const [newTrackName, setNewTrackName] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [runData, setRunData] = useState({ bestLap: '', avgLap: '', fiveMinuteStint: '', tires: '', favorite: false, notes: '' });
  const [showDeleteTrackConfirm, setShowDeleteTrackConfirm] = useState<string | null>(null);
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState<string | null>(null);
  const [showDeleteRunConfirm, setShowDeleteRunConfirm] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [showRetryLocation, setShowRetryLocation] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log('User authenticated:', currentUser.email);
        setShowTutorial(true);
      } else {
        setUser(null);
        console.log('No user authenticated, redirecting to login...');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const tracksRef = collection(db, `users/${user.uid}/tracks`);
    const unsubscribe = onSnapshot(tracksRef, (snapshot) => {
      const trackData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Track[];
      setTracks(trackData);
      console.log('Tracks fetched:', trackData);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedTrack) {
      setSessions([]);
      setSelectedSession(null);
      return;
    }

    const sessionsRef = collection(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`);
    const unsubscribe = onSnapshot(sessionsRef, (snapshot) => {
      const sessionData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date || new Date().toISOString(),
          name: data.name,
          runs: data.runs || [],
          weather: data.weather || { temp: 0, condition: 'Unknown' },
          notes: data.notes,
        } as Session;
      });
      setSessions(sessionData);
      console.log('Sessions fetched:', sessionData);
      setSelectedSession((prev) => prev ? sessionData.find((s) => s.id === prev.id) || null : null);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
    });
    return () => unsubscribe();
  }, [user, selectedTrack]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('Logged out successfully');
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout error:', error);
      });
  };

  const addTrack = async () => {
    if (!user || !newTrackName) return;
    try {
      const track = { name: newTrackName };
      await addDoc(collection(db, `users/${user.uid}/tracks`), track);
      setNewTrackName('');
      console.log('Track added:', newTrackName);
    } catch (error) {
      console.error('Error adding track:', error);
    }
  };

  const deleteTrack = async (trackId: string) => {
    if (!user) return;
    try {
      const trackRef = doc(db, `users/${user.uid}/tracks`, trackId);
      await deleteDoc(trackRef);
      setShowDeleteTrackConfirm(null);
      if (selectedTrack?.id === trackId) setSelectedTrack(null);
      console.log('Track deleted:', trackId);
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const fetchWeather = async (): Promise<{ temp: number; condition: string }> => {
    setLocationStatus('Requesting location...');
    console.log('fetchWeather: Starting geolocation request at', new Date().toISOString());

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        console.log('fetchWeather: Calling getCurrentPosition');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('fetchWeather: Geolocation success:', pos.coords.latitude, pos.coords.longitude, 'accuracy:', pos.coords.accuracy);
            resolve(pos);
          },
          (error) => {
            console.error('fetchWeather: Geolocation error:', {
              code: error.code,
              message: error.message,
              timestamp: new Date().toISOString(),
            });
            let errorMessage = 'Unable to fetch location.';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location permission denied. Please allow location access for testinganalyzer.netlify.app in Safari settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location unavailable. Ensure Location Services are enabled and try again.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false,
            timeout: 60000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log(`fetchWeather: Geolocation fetched: lat=${latitude}, lon=${longitude}`);
      setLocationStatus(`Location fetched: ${latitude}, ${longitude}`);

      console.log('fetchWeather: Fetching weather data from api.met.no');
      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`,
        { headers: { 'User-Agent': 'RC-Testing-Analyzer/1.0 (your-email@example.com)' } }
      );
      if (!response.ok) {
        console.error('fetchWeather: Weather API failed:', response.status, response.statusText);
        throw new Error(`Weather API failed with status: ${response.status}`);
      }
      const data = await response.json();
      console.log('fetchWeather: Weather API response:', data);

      const current = data.properties.timeseries[0].data.instant.details;
      const temp = current.air_temperature;
      const conditionSymbol = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code || 'unknown';
      const condition = conditionSymbol.split('_')[0];
      setLocationStatus('Weather data retrieved successfully');
      return { temp, condition };
    } catch (error) {
      console.error('fetchWeather: Failed:', error);
      setLocationStatus(error instanceof Error ? error.message : 'Unknown error fetching location.');
      setShowRetryLocation(true);
      const fallbackLat = 59.9245;
      const fallbackLon = 10.9540;
      console.log(`fetchWeather: Using fallback coordinates: lat=${fallbackLat}, lon=${fallbackLon}`);
      try {
        const response = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${fallbackLat}&lon=${fallbackLon}`,
          { headers: { 'User-Agent': 'RC-Testing-Analyzer/1.0 (your-email@example.com)' } }
        );
        if (!response.ok) {
          throw new Error(`Fallback Weather API failed with status: ${response.status}`);
        }
        const data = await response.json();
        const current = data.properties.timeseries[0].data.instant.details;
        const temp = current.air_temperature;
        const conditionSymbol = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code || 'unknown';
        const condition = conditionSymbol.split('_')[0];
        setLocationStatus('Using fallback weather data (Lørenskog)');
        return { temp, condition };
      } catch (fallbackError) {
        console.error('fetchWeather: Fallback failed:', fallbackError);
        setLocationStatus('Failed to retrieve weather data');
        return { temp: 0, condition: 'Unknown' };
      }
    }
  };

  const createSession = async () => {
    if (!user || !selectedTrack) return;
    console.log('createSession: Starting with name:', sessionName);
    try {
      setLocationStatus('');
      setShowRetryLocation(false);
      const weather = await fetchWeather();
      console.log('createSession: Weather data:', weather);
      const session: Partial<Session> = {
        date: new Date().toISOString(),
        runs: [],
        weather,
      };
      if (sessionName) session.name = sessionName;
      console.log('createSession: Session object:', session);
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`),
        session
      );
      console.log('createSession: Session created with ID:', docRef.id);
      setSessionName('');
      setLocationStatus('Session created successfully');
    } catch (error) {
      console.error('createSession: Error:', error);
      setLocationStatus('Failed to create session');
      alert('Failed to create session. Check console for details.');
    }
  };

  const retryLocation = async () => {
    console.log('retryLocation: Attempting to retry geolocation');
    setShowRetryLocation(false);
    await createSession();
  };

  const useDefaultWeather = () => {
    console.log('useDefaultWeather: Proceeding with default weather');
    if (!user || !selectedTrack) {
      setLocationStatus('Cannot create session: No track selected');
      return;
    }
    setShowRetryLocation(false);
    setLocationStatus('Using default weather data');
    const session: Partial<Session> = {
      date: new Date().toISOString(),
      runs: [],
      weather: { temp: 0, condition: 'Unknown' },
    };
    if (sessionName) session.name = sessionName;
    addDoc(collection(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`), session)
      .then((docRef) => {
        console.log('useDefaultWeather: Session created with ID:', docRef.id);
        setSessionName('');
        setLocationStatus('Session created with default weather');
      })
      .catch((error) => {
        console.error('useDefaultWeather: Error:', error);
        setLocationStatus('Failed to create session with default weather');
        alert('Failed to create session with default weather');
      });
  };

  const deleteSession = async (sessionId: string) => {
    if (!user || !selectedTrack) return;
    try {
      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, sessionId);
      await deleteDoc(sessionRef);
      setShowDeleteSessionConfirm(null);
      if (selectedSession?.id === sessionId) setSelectedSession(null);
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const openAddRunModal = () => {
    if (!selectedSession) return;
    setRunData({ bestLap: '', avgLap: '', fiveMinuteStint: '', tires: '', favorite: false, notes: '' });
    setIsModalOpen(true);
  };

  const addRun = async () => {
    if (!user || !selectedSession || !selectedTrack) return;
    console.log('Adding run to session:', selectedSession.id, 'with data:', runData);
    try {
      const newRun: Run = {
        bestLap: parseFloat(runData.bestLap) || 0,
        avgLap: parseFloat(runData.avgLap) || 0,
      };
      if (runData.fiveMinuteStint) newRun.fiveMinuteStint = runData.fiveMinuteStint;
      if (runData.notes) newRun.notes = runData.notes;
      if (runData.tires) {
        newRun.setup = { tires: runData.tires, favorite: runData.favorite };
      }

      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, selectedSession.id);
      const updatedRuns = [...selectedSession.runs, newRun];
      await updateDoc(sessionRef, { runs: updatedRuns });
      console.log('Run added successfully to session:', selectedSession.id);
      setRunData({ bestLap: '', avgLap: '', fiveMinuteStint: '', tires: '', favorite: false, notes: '' });
    } catch (error) {
      console.error('Error adding run:', error);
      alert('Failed to add run. Check console for details.');
    }
  };

  const deleteRun = async (runIndex: number) => {
    if (!user || !selectedSession || !selectedTrack) return;
    try {
      const updatedRuns = selectedSession.runs.filter((_, index) => index !== runIndex);
      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, selectedSession.id);
      await updateDoc(sessionRef, { runs: updatedRuns });
      setShowDeleteRunConfirm(null);
      console.log('Run deleted at index:', runIndex);
    } catch (error) {
      console.error('Error deleting run:', error);
    }
  };

  const filteredTracks = tracks.filter((track) =>
    track.name.toLowerCase().includes(trackSearch.toLowerCase())
  );

  if (!user) {
    return <div className="min-h-screen bg-dark-navy flex items-center justify-center text-gray-blue">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-deep-blue text-white flex flex-col">
      <header className="p-4 sm:p-6 shadow-lg flex flex-col sm:flex-row justify-between items-center bg-deep-blue/90 backdrop-blur-sm">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">RC Testing Analyzer</h1>
          <p className="text-sm text-gray-blue">
            {selectedTrack ? `Sessions for ${selectedTrack.name}` : 'Manage your tracks and sessions'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleLogout} className="text-light-pink hover:text-bright-pink text-sm sm:text-base">
            Logout ({user.email})
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        {!selectedTrack ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="New Track Name"
                className="flex-1 p-2 rounded bg-dark-blue text-white focus:ring-2 focus:ring-light-pink outline-none"
              />
              <button onClick={addTrack} className="bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-2 px-4 rounded transition-colors">
                Add Track
              </button>
            </div>
            <input
              type="text"
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              placeholder="Search Tracks"
              className="w-full p-2 rounded bg-dark-blue text-white focus:ring-2 focus:ring-light-pink outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTracks.length === 0 ? (
                <p className="text-gray-blue col-span-full text-center">No tracks found. Add one to start!</p>
              ) : (
                filteredTracks.map((track) => (
                  <div key={track.id} className="p-4 rounded-lg bg-dark-blue/80 shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-semibold truncate">{track.name}</h2>
                    <div className="flex justify-between items-center mt-2">
                      <button
                        onClick={() => setSelectedTrack(track)}
                        className="text-light-pink hover:text-bright-pink text-sm"
                      >
                        View Sessions
                      </button>
                      {showDeleteTrackConfirm === track.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteTrack(track.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowDeleteTrackConfirm(null)}
                            className="text-gray-blue hover:text-white text-sm"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowDeleteTrackConfirm(track.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={() => setSelectedTrack(null)}
                className="bg-deep-blue hover:bg-slate-blue text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                Back to Tracks
              </button>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Session Name"
                className="flex-1 p-2 rounded bg-dark-blue text-white focus:ring-2 focus:ring-light-pink outline-none"
              />
              <button onClick={createSession} className="bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-2 px-4 rounded transition-colors">
                + New Session
              </button>
            </div>
            {locationStatus && (
              <p className={`text-sm mb-4 ${locationStatus.includes('failed') || locationStatus.includes('denied') || locationStatus.includes('unavailable') ? 'text-red-400' : 'text-gray-blue'}`}>
                {locationStatus}
                {showRetryLocation && (
                  <span>
                    <button
                      onClick={retryLocation}
                      className="ml-2 text-light-pink hover:text-bright-pink underline"
                    >
                      Retry
                    </button>
                    <button
                      onClick={useDefaultWeather}
                      className="ml-2 text-light-pink hover:text-bright-pink underline"
                    >
                      Use Default
                    </button>
                  </span>
                )}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.length === 0 ? (
                <p className="text-gray-blue col-span-full text-center">No sessions yet. Add one to start!</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="p-4 rounded-lg bg-dark-blue/80 shadow-md hover:shadow-lg transition-shadow">
                    <h2 className="text-lg font-semibold truncate">{session.name || new Date(session.date).toLocaleDateString()}</h2>
                    <p className="text-sm text-gray-blue">Runs: {session.runs.length}</p>
                    <p className="text-sm text-gray-blue">Weather: {session.weather.condition}, {session.weather.temp}°C</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-blue text-sm">
                        {session.runs.filter((run) => run.setup?.favorite).length} Favorite(s)
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="text-light-pink hover:text-bright-pink text-sm"
                        >
                          View Runs
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            openAddRunModal();
                          }}
                          className="text-light-pink hover:text-bright-pink text-sm"
                        >
                          Add Run
                        </button>
                        {showDeleteSessionConfirm === session.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteSession(session.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setShowDeleteSessionConfirm(null)}
                              className="text-gray-blue hover:text-white text-sm"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowDeleteSessionConfirm(session.id)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Add Run Modal */}
        {isModalOpen && selectedSession && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-dark-blue rounded-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Add Run to {selectedSession.name || new Date(selectedSession.date).toLocaleDateString()}
              </h2>
              <div className="space-y-4">
                <div className="border-t border-light-pink/20 pt-4">
                  <h3 className="text-lg font-semibold mb-2">New Run</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-blue text-sm mb-1">Best Lap (s)</label>
                      <input
                        type="number"
                        value={runData.bestLap}
                        onChange={(e) => setRunData({ ...runData, bestLap: e.target.value })}
                        className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-blue text-sm mb-1">Average Lap</label>
                      <input
                        type="number"
                        value={runData.avgLap}
                        onChange={(e) => setRunData({ ...runData, avgLap: e.target.value })}
                        className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-blue text-sm mb-1">
                        5-Min Run (e.g., 23:5:04.2)
                      </label>
                      <input
                        type="text"
                        value={runData.fiveMinuteStint}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\D/g, "");
                          if (value.length > 7) value = value.slice(0, 7);
                          if (value.length >= 7) {
                            value = `${value.slice(0, 2)}:${value.slice(2, 3)}:${value.slice(3, 5)}.${value.slice(5, 6)}`;
                          } else if (value.length >= 6) {
                            value = `${value.slice(0, 2)}:${value.slice(2, 3)}:${value.slice(3, 5)}.${value.slice(5)}`;
                          } else if (value.length >= 5) {
                            value = `${value.slice(0, 2)}:${value.slice(2, 3)}:${value.slice(3, 5)}`;
                          } else if (value.length >= 3) {
                            value = `${value.slice(0, 2)}:${value.slice(2)}`;
                          }
                          setRunData({ ...runData, fiveMinuteStint: value });
                        }}
                        placeholder="23:5:04.2"
                        className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-blue text-sm mb-1">Tires</label>
                      <input
                        type="text"
                        value={runData.tires}
                        onChange={(e) => setRunData({ ...runData, tires: e.target.value })}
                        className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-blue text-sm mb-1">Notes</label>
                      <textarea
                        value={runData.notes}
                        onChange={(e) => setRunData({ ...runData, notes: e.target.value })}
                        className="w-full p-3 rounded bg-dark-blue text-white border border-light-pink/20 focus:ring-2 focus:ring-light-pink outline-none"
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={runData.favorite}
                        onChange={(e) => setRunData({ ...runData, favorite: e.target.checked })}
                        className="text-light-pink focus:ring-light-pink"
                      />
                      <label className="text-gray-blue text-sm">Favorite Setup</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={addRun} className="bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-2 px-4 rounded transition-colors">
                  Add Run
                </button>
                <button onClick={() => setIsModalOpen(false)} className="bg-deep-blue hover:bg-slate-blue text-white font-semibold py-2 px-4 rounded transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Runs Modal */}
        {selectedSession && !isModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-dark-blue rounded-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                Runs for {selectedSession.name || new Date(selectedSession.date).toLocaleDateString()}
              </h2>
              <div className="space-y-4">
                {selectedSession.runs.length === 0 ? (
                  <p className="text-gray-blue text-center">No runs recorded yet.</p>
                ) : (
                  selectedSession.runs.map((run, index) => (
                    <div key={index} className="p-3 bg-slate-blue/20 rounded flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div>
                        <p className="text-gray-blue text-sm">Run {index + 1}</p>
                        <p className="text-white text-sm">Best Lap: {run.bestLap}s</p>
                        <p className="text-white text-sm">Avg Lap: {run.avgLap}s</p>
                        {run.fiveMinuteStint && <p className="text-white text-sm">5-Min Stint: {run.fiveMinuteStint}</p>}
                        {run.setup && (
                          <p className="text-white text-sm">
                            Tires: {run.setup.tires}
                            {run.setup.favorite && <span className="text-light-pink"> ★</span>}
                          </p>
                        )}
                        {run.notes && <p className="text-gray-blue italic text-sm">Notes: {run.notes}</p>}
                      </div>
                      <div className="flex gap-2 mt-2 sm:mt-0">
                        {showDeleteRunConfirm === index ? (
                          <>
                            <button
                              onClick={() => deleteRun(index)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setShowDeleteRunConfirm(null)}
                              className="text-gray-blue hover:text-white text-sm"
                            >
                              No
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setShowDeleteRunConfirm(index)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={openAddRunModal}
                  className="bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-2 px-4 rounded transition-colors"
                >
                  Add New Run
                </button>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="bg-deep-blue hover:bg-slate-blue text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-dark-blue rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Welcome to RC Testing Analyzer!</h2>
              <p className="text-gray-blue mb-4">Here’s a quick guide to get you started:</p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Create a track by entering a name and clicking "Add Track".</li>
                <li>Select a track to view or add sessions.</li>
                <li>Add a session with a name and weather data will auto-fetch.</li>
                <li>Click "View Runs" on a session to see runs, or "Add Run" to log new ones.</li>
                <li>Use the "Logout" button when you’re done.</li>
              </ul>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="bg-light-pink hover:bg-bright-pink text-dark-blue font-semibold py-2 px-4 rounded transition-colors"
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;