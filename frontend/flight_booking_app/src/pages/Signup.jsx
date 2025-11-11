import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "../App.css";

function Signup() {
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);
  const [formData, setFormData] = useState({
    gov_id_type: "",
    doc_id_number: "",
    name: "",
    DOB: "",
    gender: "",
    nationality: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  const [existingPassenger, setExistingPassenger] = useState(null);

  // If already logged in, show guard UI instead of redirecting
  useEffect(() => {
    const savedPassengerId = localStorage.getItem("passengerId");
    const savedPassengerData = localStorage.getItem("passengerData");
    if (savedPassengerId && savedPassengerData) {
      setAlreadyLoggedIn(true);
      try {
        setExistingPassenger(JSON.parse(savedPassengerData));
      } catch {
        setExistingPassenger(null);
      }
    }
  }, [navigate]);

  const handleLogoutForSignup = () => {
    localStorage.removeItem("passengerId");
    localStorage.removeItem("passengerData");
    setAlreadyLoggedIn(false);
    setExistingPassenger(null);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) return;

    // Basic client-side validation
    if (
      !formData.gov_id_type.trim() ||
      !formData.doc_id_number.trim() ||
      !formData.name.trim() ||
      !formData.DOB ||
      !formData.gender ||
      !formData.nationality.trim() ||
      !formData.email.trim()
    ) {
      setError("Please fill all fields.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        "http://localhost:8001/insert_into_passenger",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        // Surface backend error message when available
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson?.error || errJson?.detail) {
            errorMessage = errJson.error || errJson.detail;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data?.status === "200" && data?.passenger_id) {
        setResult(data);
        console.log("Passenger created:", data);

        // Persist new user for immediate login experience
        const newPassenger = {
          passenger_id: data.passenger_id,
          gov_id_type: formData.gov_id_type,
          doc_id_number: formData.doc_id_number,
          name: formData.name,
          DOB: formData.DOB,
          gender: formData.gender,
          nationality: formData.nationality,
          email: formData.email,
        };
        localStorage.setItem("passengerId", data.passenger_id);
        localStorage.setItem("passengerData", JSON.stringify(newPassenger));
      } else {
        throw new Error("Invalid response from server");
      }

      // Reset form after successful submission
      setFormData({
        gov_id_type: "",
        doc_id_number: "",
        name: "",
        DOB: "",
        gender: "",
        nationality: "",
        email: "",
      });
    } catch (err) {
      console.error("Error creating passenger:", err);
      if (String(err.message).includes("Failed to fetch")) {
        setError(
          "Cannot connect to server. Please make sure the backend is running on port 8001."
        );
      } else {
        setError(err.message || "Failed to create passenger. Please try again.");
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
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
            <h1>Create Account</h1>
            <p>Fill in your details to create a new account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <p>{error}</p>
            </div>
          )}

          {alreadyLoggedIn && !result ? (
            <div className="alert alert-info">
              <h2>You are already logged in</h2>
              <p style={{ marginTop: "8px" }}>
                {existingPassenger?.name
                  ? `Logged in as ${existingPassenger.name} (${existingPassenger.passenger_id}).`
                  : "You are currently logged in."}
              </p>
              <p style={{ marginTop: "8px" }}>
                To create a new account, please logout first.
              </p>
              <div className="form-actions" style={{ marginTop: "1rem", display: "flex", gap: "12px" }}>
                <button type="button" className="btn btn-danger" onClick={handleLogoutForSignup}>
                  Logout and Create New Account
                </button>
                <Link to="/" className="btn btn-secondary">
                  Go to Home
                </Link>
              </div>
            </div>
          ) : result ? (
            <div className="alert alert-success">
              <h2>Account Created Successfully!</h2>
              <p>
                <strong>Status:</strong> {result.status}
              </p>
              <p>
                <strong>Your Passenger ID:</strong>{" "}
                <span
                  style={{
                    fontSize: "1.25rem",
                    color: "#0066cc",
                    fontWeight: "600",
                  }}
                >
                  {result.passenger_id}
                </span>
              </p>
              <p style={{ marginTop: "10px", fontSize: "0.875rem" }}>
                Please save this Passenger ID. You'll need it to login!
              </p>
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <Link to="/login" className="btn btn-primary">
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gov_id_type">Government ID Type</label>
                  <input
                    type="text"
                    id="gov_id_type"
                    name="gov_id_type"
                    value={formData.gov_id_type}
                    onChange={handleChange}
                    placeholder="e.g., Passport, Driver's License"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc_id_number">Document ID Number</label>
                  <input
                    type="text"
                    id="doc_id_number"
                    name="doc_id_number"
                    value={formData.doc_id_number}
                    onChange={handleChange}
                    placeholder="Enter document number"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="DOB">Date of Birth</label>
                  <input
                    type="date"
                    id="DOB"
                    name="DOB"
                    value={formData.DOB}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nationality">Nationality</label>
                  <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    placeholder="e.g., Indian, American"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Signup;
