import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// Main Event Logger Component
const EventLogger = () => {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [editingId, setEditingId] = useState(null);

  // Event types with colors
  const eventTypes = {
    info: { label: 'Info', color: '#3B82F6' },
    warning: { label: 'Warning', color: '#F59E0B' },
    error: { label: 'Error', color: '#EF4444' },
    success: { label: 'Success', color: '#10B981' },
    debug: { label: 'Debug', color: '#6B7280' }
  };

  // Load events from localStorage
  useEffect(() => {
    const savedEvents = JSON.parse(localStorage.getItem('events')) || [];
    setEvents(savedEvents);
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  // Add or update event
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    const newEvent = {
      id: editingId || Date.now(),
      name: eventName,
      description: eventDescription,
      type: eventType,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    if (editingId) {
      setEvents(events.map(event => 
        event.id === editingId ? newEvent : event
      ));
      setEditingId(null);
    } else {
      setEvents([newEvent, ...events]);
    }

    // Reset form
    setEventName('');
    setEventDescription('');
    setEventType('info');
  };

  // Delete event
  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  // Delete all events
  const clearAllEvents = () => {
    if (window.confirm('Are you sure you want to delete all events?')) {
      setEvents([]);
    }
  };

  // Edit event
  const editEvent = (event) => {
    setEventName(event.name);
    setEventDescription(event.description);
    setEventType(event.type);
    setEditingId(event.id);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.type === filterType;
    
    // Date filtering
    const eventDate = new Date(event.timestamp);
    const now = new Date();
    let matchesDate = true;
    
    switch (dateRange) {
      case 'today':
        matchesDate = eventDate.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        matchesDate = eventDate >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        matchesDate = eventDate >= monthAgo;
        break;
      default:
        matchesDate = true;
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Export events as JSON
  const exportEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Get stats
  const getStats = () => {
    const total = events.length;
    const byType = {};
    Object.keys(eventTypes).forEach(type => {
      byType[type] = events.filter(event => event.type === type).length;
    });
    return { total, byType };
  };

  const stats = getStats();

  return (
    <div className="event-logger">
      <header className="logger-header">
        <div className="header-content">
          <h1>📊 Event Logger</h1>
          <div className="stats">
            <span>Total: {stats.total}</span>
            {Object.entries(stats.byType).map(([type, count]) => (
              <span key={type} style={{ color: eventTypes[type].color }}>
                {eventTypes[type].label}: {count}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="container">
        {/* Event Form */}
        <div className="form-section">
          <h2>{editingId ? 'Edit Event' : 'Log New Event'}</h2>
          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="event-input"
                required
              />
              <select 
                value={eventType} 
                onChange={(e) => setEventType(e.target.value)}
                className="type-select"
              >
                {Object.entries(eventTypes).map(([key, { label, color }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <textarea
              placeholder="Event description (optional)"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="description-input"
              rows="3"
            />
            
            <div className="form-actions">
              <button type="submit" className="log-btn">
                {editingId ? 'Update Event' : 'Log Event'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setEditingId(null);
                    setEventName('');
                    setEventDescription('');
                    setEventType('info');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Filters and Controls */}
        <div className="controls-section">
          <div className="filters">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {Object.entries(eventTypes).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          
          <div className="actions">
            <button onClick={exportEvents} className="export-btn">
              Export JSON
            </button>
            <button onClick={clearAllEvents} className="clear-btn">
              Clear All
            </button>
          </div>
        </div>

        {/* Events List */}
        <div className="events-section">
          <h2>Event Log ({filteredEvents.length})</h2>
          
          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              {events.length === 0 ? 'No events logged yet' : 'No events match your filters'}
            </div>
          ) : (
            <div className="events-list">
              {filteredEvents.map(event => (
                <div key={event.id} className="event-card">
                  <div 
                    className="event-type-bar"
                    style={{ backgroundColor: eventTypes[event.type].color }}
                  ></div>
                  
                  <div className="event-content">
                    <div className="event-header">
                      <h3 className="event-name">{event.name}</h3>
                      <span className="event-type-tag" style={{ 
                        backgroundColor: eventTypes[event.type].color 
                      }}>
                        {eventTypes[event.type].label}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="event-description">{event.description}</p>
                    )}
                    
                    <div className="event-footer">
                      <span className="event-time">
                        {event.date} at {event.time}
                      </span>
                      <div className="event-actions">
                        <button 
                          onClick={() => editEvent(event)}
                          className="edit-btn"
                          title="Edit event"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => deleteEvent(event.id)}
                          className="delete-btn"
                          title="Delete event"
                        >
                          🗑️
                        </button>
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
  );
};

// Styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    background-color: #f8fafc;
    color: #334155;
  }

  .event-logger {
    min-height: 100vh;
  }

  .logger-header {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    padding: 1.5rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .logger-header h1 {
    font-size: 2rem;
    font-weight: 700;
  }

  .stats {
    display: flex;
    gap: 1.5rem;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .stats span {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    backdrop-filter: blur(10px);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .form-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .form-section h2 {
    margin-bottom: 1.5rem;
    color: #1e293b;
    font-size: 1.5rem;
  }

  .event-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-row {
    display: flex;
    gap: 1rem;
  }

  .event-input, .description-input, .search-input {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    flex: 1;
  }

  .event-input:focus, .description-input:focus, .search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  .type-select, .filter-select, .date-select {
    padding: 0.75rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    background: white;
    min-width: 140px;
  }

  .description-input {
    resize: vertical;
    min-height: 80px;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
  }

  .log-btn, .cancel-btn, .export-btn, .clear-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .log-btn {
    background: #6366f1;
    color: white;
  }

  .log-btn:hover {
    background: #4f46e5;
  }

  .cancel-btn {
    background: #64748b;
    color: white;
  }

  .cancel-btn:hover {
    background: #475569;
  }

  .export-btn {
    background: #10b981;
    color: white;
  }

  .export-btn:hover {
    background: #059669;
  }

  .clear-btn {
    background: #ef4444;
    color: white;
  }

  .clear-btn:hover {
    background: #dc2626;
  }

  .controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .filters {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-input {
    min-width: 250px;
  }

  .actions {
    display: flex;
    gap: 1rem;
  }

  .events-section {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .events-section h2 {
    margin-bottom: 1.5rem;
    color: #1e293b;
    font-size: 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #64748b;
    font-style: italic;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .event-card {
    display: flex;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }

  .event-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .event-type-bar {
    width: 6px;
    flex-shrink: 0;
  }

  .event-content {
    flex: 1;
    padding: 1.5rem;
  }

  .event-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .event-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
  }

  .event-type-tag {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .event-description {
    color: #64748b;
    margin-bottom: 1rem;
    line-height: 1.5;
  }

  .event-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .event-time {
    color: #94a3b8;
    font-size: 0.9rem;
  }

  .event-actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit-btn, .delete-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .edit-btn:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  @media (max-width: 768px) {
    .container {
      padding: 1rem;
    }
    
    .header-content {
      flex-direction: column;
      text-align: center;
    }
    
    .stats {
      justify-content: center;
    }
    
    .form-section, .events-section {
      padding: 1.5rem;
    }
    
    .form-row {
      flex-direction: column;
    }
    
    .controls-section {
      flex-direction: column;
      align-items: stretch;
    }
    
    .filters {
      flex-direction: column;
    }
    
    .search-input {
      min-width: auto;
    }
    
    .event-header {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .event-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .event-actions {
      align-self: flex-end;
    }
  }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<EventLogger />);