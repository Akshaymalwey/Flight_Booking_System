import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "../App.css";

function Login() {
  const [passengerId, setPassengerId] = useState("");
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const savedPassengerId = localStorage.getItem("passengerId");
    const savedPassengerData = localStorage.getItem("passengerData");

    if (savedPassengerId && savedPassengerData) {
      setPassengerId(savedPassengerId);
      setPassenger(JSON.parse(savedPassengerData));
      console.log("User already logged in:", savedPassengerId);
    }
  }, []);

  const fetch_passenger_details = () => {
    if (!passengerId) {
      setError("Please enter a Passenger ID");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:8001/check_user_exists?passenger_id=${passengerId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setPassenger(data);

          // Store passenger data in localStorage
          localStorage.setItem("passengerId", data.passenger_id);
          localStorage.setItem("passengerData", JSON.stringify(data));

          console.log("Passenger found and saved to localStorage:", data);
          setError(null);
        } else {
          setError("Passenger not found");
          setPassenger(null);
          // Clear localStorage if passenger not found
          localStorage.removeItem("passengerId");
          localStorage.removeItem("passengerData");
        }
      })
      .catch((err) => {
        console.error("Error fetching passenger:", err);
        setError(
          "Error: Could not connect to server. Make sure FastAPI is running."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Logout function to clear localStorage
  const handleLogout = () => {
    localStorage.removeItem("passengerId");
    localStorage.removeItem("passengerData");
    setPassenger(null);
    setPassengerId("");
    setError(null);
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
            <Link to="/signup" className="nav-link">
              Signup
            </Link>
            <Link to="/search" className="nav-link">
              Search Flights
            </Link>
          </div>
        </div>
      </nav>

      <div className="auth-container">
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>

        <div className="auth-card">
          <div className="auth-header">
            <h1>Login</h1>
            <p>Enter your Passenger ID to access your account</p>
          </div>

          {error && !passenger && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {!passenger ? (
            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                fetch_passenger_details();
              }}
            >
              <div className="form-group">
                <label htmlFor="passengerId">Passenger ID</label>
                <input
                  type="text"
                  id="passengerId"
                  placeholder="Enter your Passenger ID"
                  value={passengerId}
                  onChange={(e) => setPassengerId(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </form>
          ) : (
            <div className="card">
              <h2>Welcome, {passenger.name}!</h2>
              <div
                className="user-info"
                style={{ marginTop: "1rem", marginBottom: "1rem" }}
              >
                <p>
                  <strong>Passenger ID:</strong> {passenger.passenger_id}
                </p>
                <p>
                  <strong>Email:</strong> {passenger.email_address}
                </p>
                <p>
                  <strong>Date of Birth:</strong> {passenger.dob}
                </p>
                <p>
                  <strong>Gender:</strong> {passenger.gender}
                </p>
                <p>
                  <strong>Nationality:</strong> {passenger.nationality}
                </p>
              </div>
              <div className="form-actions">
                <button onClick={handleLogout} className="btn btn-danger">
                  Logout
                </button>
                <Link to="/search" className="btn btn-primary">
                  Search Flights
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
