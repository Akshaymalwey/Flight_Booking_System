import { Link } from "react-router-dom";
import "../App.css";

function SearchResults() {
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
            <Link to="/search" className="nav-link">
              Search Flights
            </Link>
            <Link to="/my-bookings" className="nav-link">
              My Bookings
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <div className="search-container">
          <Link to="/search" className="back-link">
            ← Back to Search
          </Link>

          <div className="search-header">
            <h1>Search Results</h1>
            <p>This page will display search results</p>
          </div>

          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No Results Yet</h3>
            <p>Use the search page to find flights.</p>
            <Link
              to="/search"
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
            >
              Search Flights
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResults;
