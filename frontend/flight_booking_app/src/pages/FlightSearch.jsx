import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value,
    });
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

              <div className="form-group">
                <label htmlFor="source_airport">Source Airport</label>
                <input
                  type="text"
                  id="source_airport"
                  name="source_airport"
                  value={searchParams.source_airport}
                  onChange={handleChange}
                  placeholder="e.g., JFK, LAX, DEL"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="destination_airport">Destination Airport</label>
                <input
                  type="text"
                  id="destination_airport"
                  name="destination_airport"
                  value={searchParams.destination_airport}
                  onChange={handleChange}
                  placeholder="e.g., JFK, LAX, DEL"
                  required
                />
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
