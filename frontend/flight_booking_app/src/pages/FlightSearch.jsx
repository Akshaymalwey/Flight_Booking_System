import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../App.css";

function FlightSearch() {
  const [searchParams, setSearchParams] = useState({
    from_date: "",
    to_date: "",
    source_airport: "",
    destination_airport: "",
  });
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Autocomplete states
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const sourceInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const sourceSuggestionsRef = useRef(null);
  const destinationSuggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (term, setSuggestions) => {
    if (!term || term.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await fetch(
        `http://localhost:8001/autocomplete_suggestions?term=${encodeURIComponent(term)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSuggestions(data || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Debounced version of fetchSuggestions
  const debouncedFetchSourceSuggestions = useRef(
    debounce((term) => fetchSuggestions(term, setSourceSuggestions), 300)
  ).current;

  const debouncedFetchDestinationSuggestions = useRef(
    debounce((term) => fetchSuggestions(term, setDestinationSuggestions), 300)
  ).current;

  // Handle source airport input change
  const handleSourceAirportChange = (e) => {
    const value = e.target.value;
    setSearchParams({
      ...searchParams,
      source_airport: value,
    });
    
    if (value.trim().length >= 2) {
      setShowSourceSuggestions(true);
      debouncedFetchSourceSuggestions(value);
    } else {
      setShowSourceSuggestions(false);
      setSourceSuggestions([]);
    }
  };

  // Handle destination airport input change
  const handleDestinationAirportChange = (e) => {
    const value = e.target.value;
    setSearchParams({
      ...searchParams,
      destination_airport: value,
    });
    
    if (value.trim().length >= 2) {
      setShowDestinationSuggestions(true);
      debouncedFetchDestinationSuggestions(value);
    } else {
      setShowDestinationSuggestions(false);
      setDestinationSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSourceSuggestionSelect = (suggestion) => {
    setSearchParams({
      ...searchParams,
      source_airport: suggestion.apt_code,
    });
    setShowSourceSuggestions(false);
    setSourceSuggestions([]);
  };

  const handleDestinationSuggestionSelect = (suggestion) => {
    setSearchParams({
      ...searchParams,
      destination_airport: suggestion.apt_code,
    });
    setShowDestinationSuggestions(false);
    setDestinationSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sourceSuggestionsRef.current &&
        !sourceSuggestionsRef.current.contains(event.target) &&
        sourceInputRef.current &&
        !sourceInputRef.current.contains(event.target)
      ) {
        setShowSourceSuggestions(false);
      }
      
      if (
        destinationSuggestionsRef.current &&
        !destinationSuggestionsRef.current.contains(event.target) &&
        destinationInputRef.current &&
        !destinationInputRef.current.contains(event.target)
      ) {
        setShowDestinationSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    // Only handle non-airport fields here
    if (e.target.name !== "source_airport" && e.target.name !== "destination_airport") {
      setSearchParams({
        ...searchParams,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Validate all fields are filled
    if (
      !searchParams.from_date ||
      !searchParams.to_date ||
      !searchParams.source_airport ||
      !searchParams.destination_airport
    ) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);
    setFlights([]);
    setShowSourceSuggestions(false);
    setShowDestinationSuggestions(false);

    try {
      const response = await fetch(
        `http://localhost:8001/get_flight_details?from_date=${searchParams.from_date}&to_date=${searchParams.to_date}&source_airport=${searchParams.source_airport}&destination_airport=${searchParams.destination_airport}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setFlights(data);
      } else {
        setFlights([]);
        setError("No flights found for the selected criteria.");
      }
    } catch (err) {
      console.error("Error fetching flights:", err);
      setError("Failed to search flights. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFlight = (flight) => {
    // Store selected flight in localStorage or navigate to booking page
    localStorage.setItem("selectedFlight", JSON.stringify(flight));
    navigate("/booking");
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            ✈️ Flight Booking System
          </Link>
          <div className="navbar-nav">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Signup
            </Link>
            <Link to="/my-bookings" className="nav-link">
              My Bookings
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <div className="search-container">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>

          <div className="search-header">
            <h1>Search Flights</h1>
            <p>Find the perfect flight for your journey</p>
          </div>

          <div className="search-form-card">
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-group">
                <label htmlFor="from_date">From Date</label>
                <input
                  type="date"
                  id="from_date"
                  name="from_date"
                  value={searchParams.from_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="to_date">To Date</label>
                <input
                  type="date"
                  id="to_date"
                  name="to_date"
                  value={searchParams.to_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="source_airport">Source Airport</label>
                <input
                  ref={sourceInputRef}
                  type="text"
                  id="source_airport"
                  name="source_airport"
                  value={searchParams.source_airport}
                  onChange={handleSourceAirportChange}
                  onFocus={() => {
                    if (sourceSuggestions.length > 0) {
                      setShowSourceSuggestions(true);
                    }
                  }}
                  placeholder="e.g., JFK, LAX, DEL"
                  required
                  autoComplete="off"
                />
                {showSourceSuggestions && (
                  <div
                    ref={sourceSuggestionsRef}
                    className="autocomplete-suggestions"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      maxHeight: "200px",
                      overflowY: "auto",
                      zIndex: 1000,
                      marginTop: "4px",
                    }}
                  >
                    {loadingSuggestions ? (
                      <div style={{ padding: "10px", textAlign: "center" }}>
                        Loading...
                      </div>
                    ) : sourceSuggestions.length > 0 ? (
                      sourceSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSourceSuggestionSelect(suggestion)}
                          style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#f0f0f0";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "white";
                          }}
                        >
                          <div style={{ fontWeight: "bold", color: "#333" }}>
                            {suggestion.apt_code}
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            {suggestion.airport_name}, {suggestion.country}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "10px", color: "#666" }}>
                        No airports found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: "relative" }}>
                <label htmlFor="destination_airport">Destination Airport</label>
                <input
                  ref={destinationInputRef}
                  type="text"
                  id="destination_airport"
                  name="destination_airport"
                  value={searchParams.destination_airport}
                  onChange={handleDestinationAirportChange}
                  onFocus={() => {
                    if (destinationSuggestions.length > 0) {
                      setShowDestinationSuggestions(true);
                    }
                  }}
                  placeholder="e.g., JFK, LAX, DEL"
                  required
                  autoComplete="off"
                />
                {showDestinationSuggestions && (
                  <div
                    ref={destinationSuggestionsRef}
                    className="autocomplete-suggestions"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      maxHeight: "200px",
                      overflowY: "auto",
                      zIndex: 1000,
                      marginTop: "4px",
                    }}
                  >
                    {loadingSuggestions ? (
                      <div style={{ padding: "10px", textAlign: "center" }}>
                        Loading...
                      </div>
                    ) : destinationSuggestions.length > 0 ? (
                      destinationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleDestinationSuggestionSelect(suggestion)}
                          style={{
                            padding: "10px 15px",
                            cursor: "pointer",
                            borderBottom: "1px solid #eee",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#f0f0f0";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "white";
                          }}
                        >
                          <div style={{ fontWeight: "bold", color: "#333" }}>
                            {suggestion.apt_code}
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            {suggestion.airport_name}, {suggestion.country}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: "10px", color: "#666" }}>
                        No airports found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="search-submit">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search Flights"}
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Searching for flights...</p>
            </div>
          )}

          {flights.length > 0 && (
            <div className="flights-container">
              <div className="flights-header">
                <h2>Available Flights ({flights.length})</h2>
              </div>
              {flights.map((flight, index) => (
                <div key={index} className="flight-card">
                  <div className="flight-card-header">
                    <div>
                      <h3 className="flight-card-title">Flight #{index + 1}</h3>
                    </div>
                    <div className="flight-id">
                      <strong>Flight ID:</strong> {flight.flight_id}
                    </div>
                  </div>

                  <div className="flight-details">
                    <div className="flight-detail-section">
                      <h4>Route</h4>
                      <div className="flight-route">
                        {flight.start_ap}{" "}
                        <span className="flight-route-arrow">→</span>{" "}
                        {flight.dest_ap}
                      </div>
                      <p className="flight-info">
                        <strong>Distance:</strong> {flight.distance} km
                      </p>
                    </div>

                    <div className="flight-detail-section">
                      <h4>Schedule</h4>
                      <p className="flight-info">
                        <strong>Date:</strong> {flight.schedule_date}
                      </p>
                      <p className="flight-info">
                        <strong>Departure:</strong> {flight.dep_time}
                      </p>
                      <p className="flight-info">
                        <strong>Arrival:</strong> {flight.arrival_time}
                      </p>
                    </div>

                    <div className="flight-detail-section">
                      <h4>Details</h4>
                      <p className="flight-info">
                        <strong>Route ID:</strong> {flight.route_id}
                      </p>
                      <p className="flight-info">
                        <strong>Schedule ID:</strong> {flight.schedule_id}
                      </p>
                    </div>
                  </div>

                  <div className="flight-actions">
                    <button
                      onClick={() => handleSelectFlight(flight)}
                      className="btn btn-primary"
                    >
                      Select This Flight
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightSearch;
