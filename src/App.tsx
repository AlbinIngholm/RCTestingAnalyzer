import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
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
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const tracksRef = collection(db, `users/${user.uid}/tracks`);
    const unsubscribe = onSnapshot(tracksRef, (snapshot) => {
      const trackData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Track[];
      setTracks(trackData);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedTrack) {
      setSessions([]); // Clear sessions if no track is selected
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
      // Sync selectedSession only if it still exists in the updated data
      if (selectedSession) {
        const updatedSession = sessionData.find((s) => s.id === selectedSession.id);
        setSelectedSession(updatedSession || null);
      }
    });
    return () => unsubscribe();
  }, [user, selectedTrack]); // Removed selectedSession from dependencies

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Check your credentials.');
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Sign-up error:', error);
      alert('Sign-up failed. Check your email/password (min 6 characters).');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedTrack(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addTrack = async () => {
    if (!user || !newTrackName) return;
    try {
      const track = { name: newTrackName };
      await addDoc(collection(db, `users/${user.uid}/tracks`), track);
      setNewTrackName('');
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
    } catch (error) {
      console.error('Error deleting track:', error);
    }
  };

  const fetchWeather = async (): Promise<{ temp: number; condition: string }> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject)
      );
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'RC-Testing-Analyzer/1.0 (your-email@example.com)', // Replace with your email
          },
        }
      );
      if (!response.ok) throw new Error('Weather API request failed');
      const data = await response.json();
      const current = data.properties.timeseries[0].data.instant.details;
      const temp = current.air_temperature;
      const conditionSymbol = data.properties.timeseries[0].data.next_1_hours?.summary.symbol_code || 'unknown';
      const condition = conditionSymbol.split('_')[0];
      return { temp, condition };
    } catch (error) {
      console.error('Error fetching weather:', error);
      return { temp: 0, condition: 'Unknown' };
    }
  };

  const createSession = async () => {
    if (!user || !selectedTrack) return;
    console.log('Creating session with name:', sessionName);
    try {
      const weather = await fetchWeather();
      const session: Partial<Session> = {
        date: new Date().toISOString(),
        runs: [],
        weather,
      };
      if (sessionName) session.name = sessionName;
      console.log('Session object:', session);
      const docRef = await addDoc(
        collection(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`),
        session
      );
      console.log('Session created with ID:', docRef.id);
      setSessionName('');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Check console for details.');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!user || !selectedTrack) return;
    try {
      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, sessionId);
      await deleteDoc(sessionRef);
      setShowDeleteSessionConfirm(null);
      if (selectedSession?.id === sessionId) setIsModalOpen(false);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const openModal = (session: Session) => {
    setSelectedSession(session);
    setRunData({ bestLap: '', avgLap: '', fiveMinuteStint: '', tires: '', favorite: false, notes: '' });
    setIsModalOpen(true);
  };

  const addRun = async () => {
    if (!selectedSession || !user || !selectedTrack) {
      console.log('Cannot add run: No session/track selected or user not logged in');
      return;
    }
    console.log('Adding run to session:', selectedSession.id, 'with data:', runData);
    try {
      const newRun: Run = {
        bestLap: parseFloat(runData.bestLap) || 0,
        avgLap: parseFloat(runData.avgLap) || 0,
        fiveMinuteStint: runData.fiveMinuteStint || undefined,
        notes: runData.notes || undefined,
        setup: runData.tires ? { tires: runData.tires, favorite: runData.favorite } : undefined,
      };
      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, selectedSession.id);
      const updatedRuns = [...selectedSession.runs, newRun];
      console.log('Updating session with new run:', newRun);
      await updateDoc(sessionRef, {
        runs: updatedRuns,
      });
      console.log('Run added successfully to session:', selectedSession.id);
      setRunData({ bestLap: '', avgLap: '', fiveMinuteStint: '', tires: '', favorite: false, notes: '' });
    } catch (error) {
      console.error('Error adding run:', error);
      alert('Failed to add run. Check console for details.');
    }
  };

  const deleteRun = async (runIndex: number) => {
    if (!selectedSession || !user || !selectedTrack) return;
    try {
      const updatedRuns = selectedSession.runs.filter((_, index) => index !== runIndex);
      const sessionRef = doc(db, `users/${user.uid}/tracks/${selectedTrack.id}/sessions`, selectedSession.id);
      await updateDoc(sessionRef, {
        runs: updatedRuns,
      });
      setShowDeleteRunConfirm(null);
    } catch (error) {
      console.error('Error deleting run:', error);
    }
  };

  const filteredTracks = tracks.filter((track) =>
    track.name.toLowerCase().includes(trackSearch.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1 className="header-title">RC Testing Analyzer</h1>
          <p className="header-subtitle">
            {selectedTrack ? `Sessions for ${selectedTrack.name}` : 'Manage your tracks and sessions'}
          </p>
        </div>
        <div className="auth-container">
          {user ? (
            <button onClick={handleLogout} className="text-light-pink hover:text-bright-pink">
              Logout ({user.email})
            </button>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="modal-input"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="modal-input"
              />
              <button onClick={handleLogin} className="save-button">
                Login
              </button>
              <button onClick={handleSignUp} className="save-button">
                Sign Up
              </button>
            </>
          )}
        </div>
      </header>

      <main className="main">
        {isLoading ? (
          <p className="empty-text">Loading...</p>
        ) : !user ? (
          <p className="empty-text">Please log in to manage tracks and sessions.</p>
        ) : !selectedTrack ? (
          <div className="p-6">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTrackName}
                onChange={(e) => setNewTrackName(e.target.value)}
                placeholder="New Track Name"
                className="modal-input flex-grow"
              />
              <button onClick={addTrack} className="save-button">
                Add Track
              </button>
            </div>
            <input
              type="text"
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              placeholder="Search Tracks"
              className="modal-input w-full mb-4"
            />
            <section className="sessions-grid">
              {filteredTracks.length === 0 ? (
                <p className="empty-text">No tracks found. Add one to start!</p>
              ) : (
                filteredTracks.map((track) => (
                  <div key={track.id} className="session-card">
                    <h2 className="session-title">{track.name}</h2>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => setSelectedTrack(track)}
                        className="details-button"
                      >
                        View Sessions
                      </button>
                      {showDeleteTrackConfirm === track.id ? (
                        <div className="flex gap-1">
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
            </section>
          </div>
        ) : (
          <>
            <div className="p-6 flex gap-2">
              <button
                onClick={() => setSelectedTrack(null)}
                className="bg-deep-blue hover:bg-slate-blue px-4 py-2 rounded text-white"
              >
                Back to Tracks
              </button>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Session Name"
                className="modal-input flex-grow"
              />
              <button onClick={createSession} className="new-session-button">
                + New Session
              </button>
            </div>
            <section className="sessions-grid">
              {sessions.length === 0 ? (
                <p className="empty-text">No sessions yet. Add one to start!</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="session-card">
                    <h2 className="session-title">
                      {session.name || new Date(session.date).toLocaleDateString()}
                    </h2>
                    <p className="session-info">Runs: {session.runs.length}</p>
                    <p className="session-info">
                      Weather: {session.weather.condition}, {session.weather.temp}°F
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-blue">
                        {session.runs.filter((run) => run.setup?.favorite).length} Favorite(s)
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(session)} className="details-button">
                          View Runs
                        </button>
                        {showDeleteSessionConfirm === session.id ? (
                          <div className="flex gap-1">
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
            </section>
          </>
        )}

        {isModalOpen && selectedSession && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">
                {selectedSession.name || new Date(selectedSession.date).toLocaleDateString()} Runs
              </h2>
              <div className="space-y-4">
                {selectedSession.runs.map((run, index) => (
                  <div key={index} className="p-2 bg-slate-blue/20 rounded flex justify-between items-start">
                    <div>
                      <p className="text-gray-blue">Run {index + 1}</p>
                      <p className="text-white">Best Lap: {run.bestLap}s</p>
                      <p className="text-white">Avg Lap: {run.avgLap}s</p>
                      {run.fiveMinuteStint && <p className="text-white">5-Min Stint: {run.fiveMinuteStint}</p>}
                      {run.setup && (
                        <p className="text-white">
                          Tires: {run.setup.tires}
                          {run.setup.favorite && <span className="text-light-pink"> ★</span>}
                        </p>
                      )}
                      {run.notes && <p className="text-gray-blue italic">Notes: {run.notes}</p>}
                    </div>
                    {showDeleteRunConfirm === index ? (
                      <div className="flex gap-1">
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
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDeleteRunConfirm(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}

                <div className="border-t border-light-pink/20 pt-4">
                  <h3 className="text-lg text-white mb-2">Add New Run</h3>
                  <div>
                    <label className="block text-gray-blue">Best Lap (s)</label>
                    <input
                      type="number"
                      value={runData.bestLap}
                      onChange={(e) => setRunData({ ...runData, bestLap: e.target.value })}
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-blue">Average Lap (s)</label>
                    <input
                      type="number"
                      value={runData.avgLap}
                      onChange={(e) => setRunData({ ...runData, avgLap: e.target.value })}
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-blue">5-Min Stint (e.g., 23:5:04.2)</label>
                    <input
                      type="text"
                      value={runData.fiveMinuteStint}
                      onChange={(e) => setRunData({ ...runData, fiveMinuteStint: e.target.value })}
                      className="modal-input"
                      placeholder="xLaps:minutes:seconds"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-blue">Tires</label>
                    <input
                      type="text"
                      value={runData.tires}
                      onChange={(e) => setRunData({ ...runData, tires: e.target.value })}
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-blue">Notes</label>
                    <textarea
                      value={runData.notes}
                      onChange={(e) => setRunData({ ...runData, notes: e.target.value })}
                      className="modal-textarea"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={runData.favorite}
                      onChange={(e) => setRunData({ ...runData, favorite: e.target.checked })}
                      className="text-light-pink focus:ring-light-pink"
                    />
                    <label className="modal-checkbox-label">Favorite Setup</label>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={addRun} className="save-button">
                  Add Run
                </button>
                <button onClick={() => setIsModalOpen(false)} className="close-button">
                  Close
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