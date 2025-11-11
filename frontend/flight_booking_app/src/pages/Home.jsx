import { Link } from "react-router-dom";
import "../App.css";

function Home() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            ✈️ Flight Booking System
          </Link>
          <div className="navbar-nav">
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              Signup
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

      <div className="home-hero">
        <h1>Welcome to Flight Booking System</h1>
        <p>
          Book your flights with ease and convenience. Search, compare, and book
          the best flights for your journey.
        </p>
        <div className="home-nav">
          <Link to="/search" className="btn btn-primary">
            Search Flights
          </Link>
          <Link
            to="/login"
            className="btn btn-outline"
            style={{ color: "white", borderColor: "white" }}
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="btn btn-outline"
            style={{ color: "white", borderColor: "white" }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
