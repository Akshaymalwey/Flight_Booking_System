import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../App.css";

function Booking() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengerId, setPassengerId] = useState(null);
  const [passengerData, setPassengerData] = useState(null);
  const [availableSeats, setAvailableSeats] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(false);
  // Change booking state to support multiple passengers
  const [bookings, setBookings] = useState([
    {
      passenger_id: "", // Will be filled with logged-in user's ID or entered manually
      class_code: "ECO",
      seat_number: "",
      price: 0,
      status_code: "CNF",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const isSubmittingRef = useRef(false);

  // Price map based on class codes
  const priceMap = {
    ECO: 5000,
    BUS: 10000,
    FRST: 20000,
    PREM: 7500,
    SPCL: 3000,
  };

  useEffect(() => {
    const flight = localStorage.getItem("selectedFlight");
    const pid = localStorage.getItem("passengerId");
    const pData = localStorage.getItem("passengerData");

    if (flight) {
      setSelectedFlight(JSON.parse(flight));
    } else {
      navigate("/search");
    }

    if (pid) {
      setPassengerId(pid);
      // Auto-fill first passenger with logged-in user's ID
      setBookings([
        {
          passenger_id: pid,
          class_code: "ECO",
          seat_number: "",
          price: priceMap.ECO,
          status_code: "CNF",
        },
      ]);
    }

    if (pData) {
      setPassengerData(JSON.parse(pData));
    }
  }, [navigate]);

  // Fetch available seats when flight is selected
  useEffect(() => {
    if (selectedFlight && selectedFlight.schedule_id) {
      fetchAvailableSeats();
    }
  }, [selectedFlight]);

  // Initialize prices when component mounts
  useEffect(() => {
    if (bookings.length > 0 && bookings[0].price === 0) {
      setBookings((prev) =>
        prev.map((booking) => ({
          ...booking,
          price: priceMap[booking.class_code] || 0,
        }))
      );
    }
  }, []);

  const fetchAvailableSeats = async () => {
    if (!selectedFlight || !selectedFlight.schedule_id) return;

    setLoadingSeats(true);
    try {
      const response = await fetch(
        `http://localhost:8001/get_available_seats?schedule_id=${selectedFlight.schedule_id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAvailableSeats(data || {});
    } catch (err) {
      console.error("Error fetching available seats:", err);
      setError("Failed to load available seats. Please try again.");
    } finally {
      setLoadingSeats(false);
    }
  };

  // Add functions to manage multiple passengers
  const addPassenger = () => {
    setBookings((prev) => [
      ...prev,
      {
        passenger_id: "",
        class_code: "ECO",
        seat_number: "",
        price: priceMap.ECO,
        status_code: "CNF",
      },
    ]);
  };

  const removePassenger = (index) => {
    if (bookings.length > 1) {
      setBookings((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleBookingChange = (index, e) => {
    const { name, value } = e.target;
    setBookings((prev) =>
      prev.map((booking, i) =>
        i === index
          ? {
              ...booking,
              [name]: value,
              price:
                name === "class_code" ? priceMap[value] || 0 : booking.price,
            }
          : booking
      )
    );
  };

  const handleSeatSelect = (index, seatNumber) => {
    setBookings((prev) =>
      prev.map((booking, i) =>
        i === index
          ? {
              ...booking,
              seat_number: booking.seat_number === seatNumber ? "" : seatNumber,
            }
          : booking
      )
    );
  };

  // Check if seat is selected by another passenger
  const isSeatSelectedByOther = (seatNumber, currentIndex) => {
    return bookings.some(
      (booking, index) =>
        index !== currentIndex && booking.seat_number === seatNumber
    );
  };

  const handleSeatDoubleClick = (seatNumber) => {
    if (bookings.some((booking) => booking.seat_number === seatNumber)) {
      setBookings((prev) =>
        prev.map((booking) => ({
          ...booking,
          seat_number:
            booking.seat_number === seatNumber ? "" : booking.seat_number,
        }))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmittingRef.current || loading) return;

    if (!passengerId) {
      setError("Please login to complete your booking.");
      return;
    }

    // Validate all bookings and prepare final booking data
    const finalBookings = bookings.map((booking, i) => {
      // Use logged-in user's ID if passenger_id is empty for first passenger
      if (i === 0 && (!booking.passenger_id || !booking.passenger_id.trim())) {
        return { ...booking, passenger_id: passengerId };
      }
      return booking;
    });

    for (let i = 0; i < finalBookings.length; i++) {
      if (
        !finalBookings[i].passenger_id ||
        !finalBookings[i].passenger_id.trim()
      ) {
        setError(`Please enter a passenger ID for passenger ${i + 1}.`);
        return;
      }
      if (!finalBookings[i].seat_number) {
        setError(`Please select a seat for passenger ${i + 1}.`);
        return;
      }
      if (!finalBookings[i].class_code) {
        setError(`Please select a class for passenger ${i + 1}.`);
        return;
      }
    }

    // Check for duplicate seats
    const selectedSeats = finalBookings
      .map((b) => b.seat_number)
      .filter((s) => s);
    const uniqueSeats = new Set(selectedSeats);
    if (selectedSeats.length !== uniqueSeats.size) {
      setError("Each passenger must have a unique seat.");
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare booking data array - all passengers in one group booking
      const bookingData = finalBookings.map((booking) => ({
        booker_id: passengerId, // The logged-in user making the booking
        passenger_id: booking.passenger_id.trim(), // Each passenger's ID
        status_code: booking.status_code,
        schedule_id: selectedFlight.schedule_id,
        class_code: booking.class_code,
        price: parseFloat(booking.price),
        seat_number: booking.seat_number,
      }));

      const response = await fetch("http://localhost:8001/generate_ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData), // Send array for group booking
      });

      const data = await response.json();

      if (data.status === "200" && data.pnr && data.pnr.length > 0) {
        const pnrText =
          data.pnr.length === 1
            ? `Your PNR is: ${data.pnr[0]}`
            : `Your PNRs are: ${data.pnr.join(", ")}`;
        setSuccess(
          `Group booking successful! ${pnrText} (${finalBookings.length} ticket${finalBookings.length > 1 ? "s" : ""})`
        );
        localStorage.removeItem("selectedFlight");
        setTimeout(() => {
          navigate("/my-bookings");
        }, 2000);
      } else {
        setError(data.error || "Failed to book the ticket. Please try again.");
        isSubmittingRef.current = false;
        setLoading(false);
      }
    } catch (err) {
      console.error("Error creating booking:", err);
      if (err.message.includes("Failed to fetch")) {
        setError(
          "Cannot connect to server. Please make sure the backend is running on port 8001."
        );
      } else {
        setError("Failed to book the ticket. Please try again.");
      }
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  // Generate seat grid
  const generateSeatGrid = (currentPassengerIndex = 0) => {
    const rows = [];
    const seatConfig = [
      { letter: "A", type: "window", side: "left" },
      { letter: "B", type: "middle", side: "left" },
      { letter: "C", type: "aisle", side: "left" },
      { letter: "D", type: "aisle", side: "right" },
      { letter: "E", type: "middle", side: "right" },
      { letter: "F", type: "window", side: "right" },
    ];

    for (let row = 1; row <= 30; row++) {
      const leftSeats = [];
      const rightSeats = [];

      seatConfig.forEach((config) => {
        const seatNumber = `${row}${config.letter}`;
        const isAvailable = availableSeats[seatNumber] !== false;
        const isSelected =
          bookings[currentPassengerIndex]?.seat_number === seatNumber;
        const isSelectedByOther = isSeatSelectedByOther(
          seatNumber,
          currentPassengerIndex
        );

        const seatButton = (
          <button
            key={seatNumber}
            type="button"
            className={`seat-button seat-${config.type} ${isSelected ? "selected" : ""} ${!isAvailable || isSelectedByOther ? "occupied" : ""}`}
            onClick={() => {
              if (isAvailable && !isSelectedByOther) {
                handleSeatSelect(currentPassengerIndex, seatNumber);
              }
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              if (isSelected && isAvailable) {
                handleSeatSelect(currentPassengerIndex, seatNumber);
              }
            }}
            disabled={!isAvailable || isSelectedByOther}
            title={
              !isAvailable
                ? "Seat already booked"
                : isSelectedByOther
                  ? "Seat selected by another passenger"
                  : `Select seat ${seatNumber} (${config.type === "window" ? "Window" : config.type === "aisle" ? "Aisle" : "Middle"}) - Double-click to deselect`
            }
          >
            <span className="seat-letter">{config.letter}</span>
            <span className="seat-number">{row}</span>
          </button>
        );

        if (config.side === "left") {
          leftSeats.push(seatButton);
        } else {
          rightSeats.push(seatButton);
        }
      });

      rows.push(
        <div key={row} className="airplane-row">
          <div className="row-number">{row}</div>
          <div className="seat-group left-group">{leftSeats}</div>
          <div className="aisle-divider">
            <span className="aisle-label">AISLE</span>
          </div>
          <div className="seat-group right-group">{rightSeats}</div>
        </div>
      );
    }
    return rows;
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
        <div className="bookings-container">
          <Link to="/search" className="back-link">
            ← Back to Search
          </Link>

          <div className="bookings-header">
            <h1>Complete Your Booking</h1>
            <p>Review your flight details and complete the booking process</p>
          </div>

          {selectedFlight ? (
            <>
              <div className="flight-card">
                <div className="flight-card-header">
                  <h2>Selected Flight</h2>
                </div>

                <div className="flight-details">
                  <div className="flight-detail-section">
                    <h4>Route</h4>
                    <div className="flight-route">
                      {selectedFlight.start_ap}{" "}
                      <span className="flight-route-arrow">→</span>{" "}
                      {selectedFlight.dest_ap}
                    </div>
                    <p className="flight-info">
                      <strong>Distance:</strong> {selectedFlight.distance} km
                    </p>
                  </div>

                  <div className="flight-detail-section">
                    <h4>Schedule</h4>
                    <p className="flight-info">
                      <strong>Date:</strong> {selectedFlight.schedule_date}
                    </p>
                    <p className="flight-info">
                      <strong>Departure:</strong> {selectedFlight.dep_time}
                    </p>
                    <p className="flight-info">
                      <strong>Arrival:</strong> {selectedFlight.arrival_time}
                    </p>
                  </div>
                </div>
              </div>

              {!passengerId ? (
                <div
                  className="alert alert-info"
                  style={{ marginTop: "1.5rem" }}
                >
                  <p>Please login to complete your booking.</p>
                  <div className="form-actions" style={{ marginTop: "1rem" }}>
                    <Link to="/login" className="btn btn-primary">
                      Login
                    </Link>
                    <Link to="/signup" className="btn btn-outline">
                      Sign Up
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="booking-form">
                  <div
                    className="form-section"
                    style={{ marginBottom: "2rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h3>
                        Group Booking ({bookings.length}{" "}
                        {bookings.length === 1 ? "passenger" : "passengers"})
                      </h3>
                      <button
                        type="button"
                        onClick={addPassenger}
                        className="btn btn-outline"
                        style={{ padding: "0.5rem 1rem" }}
                      >
                        + Add Passenger
                      </button>
                    </div>
                  </div>

                  {bookings.map((booking, index) => (
                    <div
                      key={index}
                      className="form-section"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        marginBottom: "1.5rem",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "1rem",
                        }}
                      >
                        <h4>Passenger {index + 1}</h4>
                        {bookings.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(index)}
                            className="btn btn-danger"
                            style={{ padding: "0.5rem 1rem" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Passenger ID input */}
                      <div
                        className="form-group"
                        style={{ marginBottom: "1rem" }}
                      >
                        <label htmlFor={`passenger_id_${index}`}>
                          Passenger ID:
                        </label>
                        <input
                          type="text"
                          id={`passenger_id_${index}`}
                          name="passenger_id"
                          value={booking.passenger_id}
                          onChange={(e) => handleBookingChange(index, e)}
                          placeholder={
                            index === 0
                              ? `Your ID (${passengerId || "enter ID"})`
                              : "Enter passenger ID"
                          }
                          required
                        />
                        {index === 0 && passengerId && (
                          <small
                            style={{
                              color: "#666",
                              display: "block",
                              marginTop: "0.25rem",
                            }}
                          >
                            Pre-filled with your ID. You can change it to book
                            for another passenger.
                          </small>
                        )}
                        {index > 0 && (
                          <small
                            style={{
                              color: "#666",
                              display: "block",
                              marginTop: "0.25rem",
                            }}
                          >
                            This ticket will appear in the selected passenger's
                            booking list
                          </small>
                        )}
                      </div>

                      {/* Class selection */}
                      <div
                        className="form-group"
                        style={{ marginBottom: "1rem" }}
                      >
                        <label htmlFor={`class_code_${index}`}>Class:</label>
                        <select
                          id={`class_code_${index}`}
                          name="class_code"
                          value={booking.class_code}
                          onChange={(e) => handleBookingChange(index, e)}
                          required
                        >
                          <option value="ECO">Economy (₹{priceMap.ECO})</option>
                          <option value="BUS">
                            Business (₹{priceMap.BUS})
                          </option>
                          <option value="FRST">
                            First Class (₹{priceMap.FRST})
                          </option>
                          <option value="PREM">
                            Premium Economy (₹{priceMap.PREM})
                          </option>
                          <option value="SPCL">
                            Special Fare (₹{priceMap.SPCL})
                          </option>
                        </select>
                        <p>Price: ₹{booking.price}</p>
                      </div>

                      {/* Seat selection for this passenger */}
                      {loadingSeats ? (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <p>Loading available seats...</p>
                        </div>
                      ) : (
                        <div className="seat-selection-container">
                          <div className="seat-legend">
                            <div className="legend-item">
                              <span className="legend-box available"></span>
                              <span>Available</span>
                            </div>
                            <div className="legend-item">
                              <span className="legend-box occupied"></span>
                              <span>Occupied</span>
                            </div>
                            <div className="legend-item">
                              <span className="legend-box selected"></span>
                              <span>Selected</span>
                            </div>
                          </div>
                          <div className="airplane-cabin">
                            <div className="cabin-header">
                              <div className="cabin-direction">
                                <span className="direction-arrow">⬆</span>
                                <span>Front of Aircraft</span>
                              </div>
                            </div>
                            <div className="airplane-seat-map">
                              <div className="window-indicator left-window">
                                🪟 Window
                              </div>
                              <div className="seat-map-container">
                                <div className="seat-map-header">
                                  <div className="row-label"></div>
                                  <div className="seat-group-header left-group">
                                    <span className="seat-type-label">
                                      Window
                                    </span>
                                    <span className="seat-type-label">
                                      Middle
                                    </span>
                                    <span className="seat-type-label">
                                      Aisle
                                    </span>
                                  </div>
                                  <div className="aisle-header"></div>
                                  <div className="seat-group-header right-group">
                                    <span className="seat-type-label">
                                      Aisle
                                    </span>
                                    <span className="seat-type-label">
                                      Middle
                                    </span>
                                    <span className="seat-type-label">
                                      Window
                                    </span>
                                  </div>
                                </div>
                                <div className="seat-map-body">
                                  {generateSeatGrid(index)}
                                </div>
                              </div>
                              <div className="window-indicator right-window">
                                Window 🪟
                              </div>
                            </div>
                            <div className="cabin-footer">
                              <div className="cabin-direction">
                                <span className="direction-arrow">⬇</span>
                                <span>Rear of Aircraft</span>
                              </div>
                            </div>
                          </div>
                          {booking.seat_number && (
                            <p className="selected-seat-info">
                              Selected: <strong>{booking.seat_number}</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {error && (
                    <div className="alert alert-error">
                      <p>{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <p>{success}</p>
                      <p>Redirecting to My Bookings...</p>
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        loading ||
                        !bookings.every(
                          (b) => b.passenger_id && b.seat_number && b.class_code
                        ) ||
                        success
                      }
                    >
                      {loading ? "Booking..." : "Confirm Booking"}
                    </button>
                    <Link to="/search" className="btn btn-outline">
                      Cancel
                    </Link>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✈️</div>
              <h3>No Flight Selected</h3>
              <p>Please select a flight to continue with booking.</p>
              <Link
                to="/search"
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Search Flights
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Booking;
