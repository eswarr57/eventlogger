import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// API base URL - adjust to your backend URL
const API_BASE_URL = 'https://eventlogger-yu3g.onrender.com/api';

function App() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventPlace, setEventPlace] = useState('');
  const [eventStatus, setEventStatus] = useState('upcoming');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');

  // Event status configuration
  const eventStatuses = {
    upcoming: { label: 'Upcoming', color: '#3B82F6', icon: '📅' },
    success: { label: 'Completed', color: '#10B981', icon: '✅' },
    cancelled: { label: 'Cancelled', color: '#EF4444', icon: '❌' }
  };

  // API functions with better error handling
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000,
  });

  // Check backend connection
  const checkBackendConnection = async () => {
    try {
      setBackendStatus('checking');
      const response = await api.get('/health');
      setBackendStatus('connected');
      return true;
    } catch (err) {
      setBackendStatus('disconnected');
      setError('Backend server is not running. Please start your backend server on port 5000.');
      console.error('Backend connection error:', err);
      return false;
    }
  };

  // Load events from MongoDB
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError('Failed to fetch events: ' + errorMessage);
      console.error('Error fetching events:', err);
      
      // Auto-check backend connection on error
      await checkBackendConnection();
    } finally {
      setLoading(false);
    }
  };

  // Create new event in MongoDB
  const createEvent = async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      throw new Error(errorMessage);
    }
  };

  // Update event in MongoDB
  const updateEvent = async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      throw new Error(errorMessage);
    }
  };

  // Delete event from MongoDB
  const deleteEvent = async (id) => {
    try {
      await api.delete(`/events/${id}`);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      throw new Error(errorMessage);
    }
  };

  // Update event status in MongoDB
  const updateEventStatus = async (id, status) => {
    try {
      const response = await api.patch(`/events/${id}/status`, { status });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      throw new Error(errorMessage);
    }
  };

  // Load events on component mount and check backend
  useEffect(() => {
    const initializeApp = async () => {
      const isConnected = await checkBackendConnection();
      if (isConnected) {
        await fetchEvents();
      }
    };
    initializeApp();
  }, []);

  // Add or update event
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventName.trim() || !eventDate || !eventPlace.trim()) {
      setError('Please fill in all required fields: Event Name, Date, and Place.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Validate date is not in the past
      const selectedDate = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError('Please select a date in the future.');
        setLoading(false);
        return;
      }

      const eventData = {
        name: eventName.trim(),
        description: eventDescription.trim(),
        date: eventDate,
        time: eventTime,
        place: eventPlace.trim(),
        status: eventStatus
      };

      console.log('Sending event data:', eventData);

      if (editingId) {
        await updateEvent(editingId, eventData);
        setEditingId(null);
      } else {
        await createEvent(eventData);
      }

      // Refresh events list
      await fetchEvents();
      resetForm();
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError('Failed to save event: ' + errorMessage);
      console.error('Error saving event:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEventName('');
    setEventDescription('');
    setEventDate('');
    setEventTime('');
    setEventPlace('');
    setEventStatus('upcoming');
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setError('');
        await deleteEvent(id);
        await fetchEvents(); // Refresh list
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message;
        setError('Failed to delete event: ' + errorMessage);
        console.error('Error deleting event:', err);
      }
    }
  };

  // Edit event
  const handleEditEvent = (event) => {
    setEventName(event.name);
    setEventDescription(event.description);
    setEventDate(event.date.split('T')[0]); // Format date for input
    setEventTime(event.time || '');
    setEventPlace(event.place);
    setEventStatus(event.status);
    setEditingId(event._id);
  };

  // Change event status
  const handleStatusChange = async (id, newStatus) => {
    try {
      setError('');
      await updateEventStatus(id, newStatus);
      await fetchEvents(); // Refresh list
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError('Failed to update status: ' + errorMessage);
      console.error('Error updating status:', err);
    }
  };

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    if (activeTab === 'all') return true;
    return event.status === activeTab;
  });

  // Get stats
  const getStats = () => {
    const total = events.length;
    const byStatus = {};
    Object.keys(eventStatuses).forEach(status => {
      byStatus[status] = events.filter(event => event.status === status).length;
    });
    return { total, byStatus };
  };

  const stats = getStats();

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return -1;
    if (a.status !== 'upcoming' && b.status === 'upcoming') return 1;
    return new Date(a.date) - new Date(b.date);
  });

  // Backend status indicator
  const getBackendStatusColor = () => {
    switch (backendStatus) {
      case 'connected': return '#10B981';
      case 'disconnected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  return (
    <div className="event-manager">
      {/* Header */}
      <header className="manager-header">
        <div className="header-content">
          <div className="header-main">
            <h1>🎯 Event Manager</h1>
            <p>Organize your events efficiently</p>
            <div className="backend-status">
              <span 
                className="status-dot"
                style={{ backgroundColor: getBackendStatusColor() }}
              ></span>
              Backend: {backendStatus}
              {backendStatus === 'disconnected' && (
                <button 
                  onClick={checkBackendConnection}
                  className="retry-btn"
                >
                  Retry Connection
                </button>
              )}
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Events</span>
            </div>
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="stat-card" style={{ borderLeftColor: eventStatuses[status].color }}>
                <span className="stat-number">{count}</span>
                <span className="stat-label">{eventStatuses[status].label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="container">
        {/* Error Message */}
        {error && (
          <div className="error-message">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
            <button onClick={() => setError('')} className="error-close">×</button>
          </div>
        )}

        {/* Backend Connection Warning */}
        {backendStatus === 'disconnected' && (
          <div className="connection-warning">
            <h3>Backend Server Not Connected</h3>
            <p>Please make sure your backend server is running on port 5000.</p>
            <div className="troubleshooting">
              <h4>To fix this:</h4>
              <ol>
                <li>Open a new terminal in your <code>event-manager-backend</code> folder</li>
                <li>Run: <code>npm run dev</code></li>
                <li>Wait for "Server running on http://localhost:5000" message</li>
                <li>Then click "Retry Connection" above</li>
              </ol>
            </div>
          </div>
        )}

        <div className="main-layout">
          {/* Sidebar - Event Form */}
          <div className="sidebar">
            <div className="form-section">
              <h2>{editingId ? 'Edit Event' : 'Create New Event'}</h2>
              <form onSubmit={handleSubmit} className="event-form">
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    placeholder="Enter event name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="form-input"
                    required
                    disabled={loading || backendStatus === 'disconnected'}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    placeholder="Event description..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="form-textarea"
                    rows="3"
                    disabled={loading || backendStatus === 'disconnected'}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="form-input"
                      required
                      disabled={loading || backendStatus === 'disconnected'}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="form-input"
                      disabled={loading || backendStatus === 'disconnected'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Place/Location *</label>
                  <input
                    type="text"
                    placeholder="Where is the event?"
                    value={eventPlace}
                    onChange={(e) => setEventPlace(e.target.value)}
                    className="form-input"
                    required
                    disabled={loading || backendStatus === 'disconnected'}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={eventStatus} 
                    onChange={(e) => setEventStatus(e.target.value)}
                    className="form-select"
                    disabled={loading || backendStatus === 'disconnected'}
                  >
                    {Object.entries(eventStatuses).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={loading || backendStatus === 'disconnected'}
                  >
                    {loading ? 'Saving...' : (editingId ? 'Update Event' : 'Create Event')}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={resetForm}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Main Content - Events List */}
          <div className="main-content">
            {/* Navigation Tabs */}
            <nav className="tabs-navigation">
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Events
              </button>
              {Object.entries(eventStatuses).map(([key, { label, icon }]) => (
                <button 
                  key={key}
                  className={`tab-btn ${activeTab === key ? 'active' : ''}`}
                  onClick={() => setActiveTab(key)}
                >
                  {icon} {label}
                </button>
              ))}
            </nav>

            {/* Events List */}
            <div className="events-section">
              <div className="section-header">
                <h2>
                  {activeTab === 'all' ? 'All Events' : eventStatuses[activeTab].label + ' Events'} 
                  <span className="events-count">({sortedEvents.length})</span>
                </h2>
                {loading && <div className="loading-spinner">🔄 Loading...</div>}
              </div>

              {sortedEvents.length === 0 && !loading ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No events found</h3>
                  <p>
                    {activeTab === 'all' 
                      ? "You haven't created any events yet." 
                      : `No ${eventStatuses[activeTab].label.toLowerCase()} events.`
                    }
                  </p>
                </div>
              ) : (
                <div className="events-grid">
                  {sortedEvents.map(event => (
                    <div key={event._id} className="event-card">
                      <div 
                        className="event-status-bar"
                        style={{ backgroundColor: eventStatuses[event.status].color }}
                      ></div>
                      
                      <div className="event-content">
                        <div className="event-header">
                          <h3 className="event-name">{event.name}</h3>
                          <div className="event-actions">
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="icon-btn"
                              title="Edit event"
                              disabled={loading || backendStatus === 'disconnected'}
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event._id)}
                              className="icon-btn"
                              title="Delete event"
                              disabled={loading || backendStatus === 'disconnected'}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        {event.description && (
                          <p className="event-description">{event.description}</p>
                        )}
                        
                        <div className="event-details">
                          <div className="detail-item">
                            <span className="detail-icon">📅</span>
                            <span className="detail-text">{event.displayDate}</span>
                          </div>
                          {event.time && (
                            <div className="detail-item">
                              <span className="detail-icon">⏰</span>
                              <span className="detail-text">{event.time}</span>
                            </div>
                          )}
                          <div className="detail-item">
                            <span className="detail-icon">📍</span>
                            <span className="detail-text">{event.place}</span>
                          </div>
                        </div>
                        
                        <div className="event-footer">
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: eventStatuses[event.status].color,
                              color: 'white'
                            }}
                          >
                            {eventStatuses[event.status].icon} {eventStatuses[event.status].label}
                          </span>
                          
                          <div className="status-actions">
                            {event.status !== 'success' && (
                              <button 
                                onClick={() => handleStatusChange(event._id, 'success')}
                                className="status-btn success"
                                title="Mark as completed"
                                disabled={loading || backendStatus === 'disconnected'}
                              >
                                ✅
                              </button>
                            )}
                            {event.status !== 'cancelled' && (
                              <button 
                                onClick={() => handleStatusChange(event._id, 'cancelled')}
                                className="status-btn cancel"
                                title="Mark as cancelled"
                                disabled={loading || backendStatus === 'disconnected'}
                              >
                                ❌
                              </button>
                            )}
                            {event.status !== 'upcoming' && (
                              <button 
                                onClick={() => handleStatusChange(event._id, 'upcoming')}
                                className="status-btn upcoming"
                                title="Mark as upcoming"
                                disabled={loading || backendStatus === 'disconnected'}
                              >
                                📅
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;