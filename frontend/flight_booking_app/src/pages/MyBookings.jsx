import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "../App.css";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passengerId, setPassengerId] = useState(null);
  const [passengerData, setPassengerData] = useState(null);

  // PNR search state
  const [searchPNR, setSearchPNR] = useState("");
  const [searchedTicket, setSearchedTicket] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Cancel ticket state
  const [cancelingPNR, setCancelingPNR] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);

  // Seat change state
  const [changingSeat, setChangingSeat] = useState(null); // PNR of booking being changed
  const [availableSeats, setAvailableSeats] = useState({});
  const [newSeatNumber, setNewSeatNumber] = useState("");
  const [changeSuccess, setChangeSuccess] = useState(false);
  const [updatingSeat, setUpdatingSeat] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Get passenger ID from localStorage on component mount
  useEffect(() => {
    const savedPassengerId = localStorage.getItem("passengerId");
    const savedPassengerData = localStorage.getItem("passengerData");

    if (savedPassengerId && savedPassengerData) {
      setPassengerId(savedPassengerId);
      setPassengerData(JSON.parse(savedPassengerData));
      // Automatically fetch bookings when component loads
      fetchBookings(savedPassengerId);
    } else {
      setError("Please login to view your bookings");
    }
  }, []);

  const fetchBookings = async (pid = passengerId) => {
    if (!pid) {
      setError("Passenger ID not found. Please login first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8001/get_passenger_tickets?passenger_id=${pid}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        setBookings(data);
        setError(null); // Clear any previous errors
      } else {
        setBookings([]);
        setError(null); // No bookings is not an error, just an empty state
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const searchTicketByPNR = async (e) => {
    e.preventDefault();

    if (!searchPNR.trim()) {
      setSearchError("Please enter a PNR number.");
      return;
    }

    if (!passengerId) {
      setSearchError("Please login to search for tickets.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchedTicket(null);

    try {
      const response = await fetch(
        `http://localhost:8001/get_ticket_by_pnr?passenger_id=${passengerId}&pnr=${searchPNR.trim()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && Object.keys(data).length > 0) {
        setSearchedTicket(data);
        setSearchError(null);
      } else {
        setSearchError("No ticket found with this PNR.");
        setSearchedTicket(null);
      }
    } catch (err) {
      console.error("Error searching ticket:", err);
      setSearchError("Failed to search ticket. Please try again.");
      setSearchedTicket(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchPNR("");
    setSearchedTicket(null);
    setSearchError(null);
  };

  // Handle opening seat change modal - fetch available seats from backend
  const handleChangeSeat = async (booking) => {
    setChangingSeat(booking.pnr);
    setNewSeatNumber("");
    setChangeSuccess(false);
    setUpdateError(null);
    setUpdatingSeat(false);
    setLoadingSeats(true);

    // First, get the schedule_id from the ticket
    try {
      const ticketResponse = await fetch(
        `http://localhost:8001/get_ticket_by_pnr?passenger_id=${passengerId}&pnr=${booking.pnr}`
      );

      if (!ticketResponse.ok) {
        throw new Error(`HTTP error! status: ${ticketResponse.status}`);
      }

      const ticketData = await ticketResponse.json();

      if (ticketData && ticketData.schedule_id) {
        // Fetch available seats from backend
        try {
          const response = await fetch(
            `http://localhost:8001/get_available_seats?schedule_id=${ticketData.schedule_id}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          // Make current seat available for selection (user can keep their current seat)
          const seats = { ...data };
          seats[booking.seat_number] = true; // Allow selecting current seat
          setAvailableSeats(seats);
        } catch (err) {
          console.error("Error fetching available seats:", err);
          setUpdateError("Failed to load available seats. Please try again.");
          // Fallback: mark all seats as available if API fails
          const fallbackSeats = {};
          for (let row = 1; row <= 30; row++) {
            for (const letter of ["A", "B", "C", "D", "E", "F"]) {
              const seatNumber = `${row}${letter}`;
              fallbackSeats[seatNumber] = true;
            }
          }
          setAvailableSeats(fallbackSeats);
        }
      } else {
        setUpdateError("Schedule ID not found. Cannot load available seats.");
      }
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      setUpdateError("Failed to load ticket details. Please try again.");
    } finally {
      setLoadingSeats(false);
    }
  };

  // Handle seat change - calls backend API
  const handleConfirmSeatChange = async (pnr, oldSeat) => {
    if (!newSeatNumber) {
      setUpdateError("Please select a new seat.");
      return;
    }

    if (newSeatNumber === oldSeat) {
      setUpdateError("Please select a different seat.");
      return;
    }

    if (!passengerId) {
      setUpdateError("Please login to change your seat.");
      return;
    }

    setUpdatingSeat(true);
    setUpdateError(null);
    setChangeSuccess(false);

    try {
      const response = await fetch("http://localhost:8001/update_ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passenger_id: passengerId,
          pnr: pnr,
          new_seat_number: newSeatNumber,
        }),
      });

      const data = await response.json();

      if (data.message === "Success!") {
        // Update booking in local state after successful API call
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.pnr === pnr
              ? { ...booking, seat_number: newSeatNumber }
              : booking
          )
        );

        setChangeSuccess(true);
        setUpdateError(null);

        // Close modal after 2 seconds
        setTimeout(() => {
          setChangingSeat(null);
          setNewSeatNumber("");
          setChangeSuccess(false);
          setAvailableSeats({});
        }, 2000);
      } else if (data.error) {
        setUpdateError(data.error);
      } else {
        setUpdateError("Failed to update seat. Please try again.");
      }
    } catch (err) {
      console.error("Error updating seat:", err);
      if (err.message.includes("Failed to fetch")) {
        setUpdateError(
          "Cannot connect to server. Please make sure the backend is running on port 8001."
        );
      } else {
        setUpdateError("Failed to update seat. Please try again.");
      }
    } finally {
      setUpdatingSeat(false);
    }
  };

  const cancelChangeSeat = () => {
    setChangingSeat(null);
    setNewSeatNumber("");
    setChangeSuccess(false);
    setUpdateError(null);
    setAvailableSeats({});
  };

  // Generate seat grid for change seat modal
  const generateSeatGrid = (currentSeat) => {
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
        // Only mark as occupied if explicitly false in database response
        // If undefined or true, treat as available (defaults to available)
        const isAvailable = availableSeats[seatNumber] !== false;
        const isCurrentSeat = seatNumber === currentSeat;
        const seatButton = (
          <button
            key={seatNumber}
            type="button"
            className={`seat-button seat-${config.type} ${newSeatNumber === seatNumber ? "selected" : ""} ${!isAvailable && !isCurrentSeat ? "occupied" : ""} ${isCurrentSeat ? "current-seat" : ""}`}
            onClick={() => {
              if (isAvailable || isCurrentSeat) {
                setNewSeatNumber(seatNumber);
              }
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              // Deselect if this seat is already selected
              if (
                newSeatNumber === seatNumber &&
                (isAvailable || isCurrentSeat)
              ) {
                setNewSeatNumber("");
              }
            }}
            disabled={!isAvailable && !isCurrentSeat}
            title={
              isCurrentSeat
                ? `Current seat: ${seatNumber} (Double-click to deselect)`
                : !isAvailable
                  ? "Seat already booked"
                  : `Select seat ${seatNumber} (${config.type === "window" ? "Window" : config.type === "aisle" ? "Aisle" : "Middle"}) - Double-click to deselect`
            }
          >
            <span className="seat-letter">{config.letter}</span>
            <span className="seat-number">{row}</span>
            {isCurrentSeat && <span className="current-badge">Current</span>}
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

  const handleCancelTicket = async (pnr) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this ticket? This action cannot be undone."
      )
    ) {
      return;
    }

    if (!passengerId) {
      setCancelError("Please login to cancel tickets.");
      return;
    }

    setCancelingPNR(pnr);
    setCancelLoading(true);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      const response = await fetch("http://localhost:8001/cancel_ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          passenger_id: passengerId,
          pnr: pnr,
        }),
      });

      const data = await response.json();

      if (data.message === "Success") {
        // Remove booking from local state
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking.pnr !== pnr)
        );

        setCancelSuccess("Ticket cancelled successfully!");
        setCancelError(null);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setCancelSuccess(null);
        }, 3000);
      } else if (data.error) {
        setCancelError(
          data.error || "Failed to cancel ticket. Please try again."
        );
        setCancelingPNR(null);
      }
    } catch (err) {
      console.error("Error cancelling ticket:", err);
      if (err.message.includes("Failed to fetch")) {
        setCancelError(
          "Cannot connect to server. Please make sure the backend is running on port 8001."
        );
      } else {
        setCancelError("Failed to cancel ticket. Please try again.");
      }
      setCancelingPNR(null);
    } finally {
      setCancelLoading(false);
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
            <Link to="/search" className="nav-link">
              Search Flights
            </Link>
          </div>
        </div>
      </nav>

      <div className="page-container">
        <div className="bookings-container">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>

          <div className="bookings-header">
            <h1>My Bookings</h1>
          </div>

          {/* PNR Search Bar */}
          {passengerId && (
            <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
              <form
                onSubmit={searchTicketByPNR}
                style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}
              >
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <input
                    type="text"
                    id="pnr-search"
                    placeholder="Enter PNR (e.g., ABC123)"
                    value={searchPNR}
                    onChange={(e) => setSearchPNR(e.target.value.toUpperCase())}
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="form-actions" style={{ margin: 0 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSearching}
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                  {searchedTicket && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="btn btn-outline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
              {searchError && (
                <div
                  className="alert alert-error"
                  style={{ marginTop: "1rem" }}
                >
                  <p>{searchError}</p>
                </div>
              )}
            </div>
          )}

          {/* Display Searched Ticket */}
          {searchedTicket && (
            <div className="flights-container" style={{ marginBottom: "2rem" }}>
              <div className="flights-header">
                <h2>Search Result</h2>
                <button onClick={clearSearch} className="btn btn-secondary">
                  Clear Search
                </button>
              </div>
              <div className="booking-card">
                <div className="booking-header">
                  <h3>Ticket Details</h3>
                  <div className="booking-pnr">
                    <strong>PNR:</strong> {searchedTicket.pnr}
                  </div>
                </div>
                <div className="booking-details">
                  <div className="flight-detail-section">
                    <h4>Ticket Information</h4>
                    <p className="flight-info">
                      <strong>Status:</strong> {searchedTicket.status_code}
                    </p>
                    <p className="flight-info">
                      <strong>Class:</strong> {searchedTicket.class_code}
                    </p>
                    <p className="flight-info">
                      <strong>Seat Number:</strong> {searchedTicket.seat_number}
                    </p>
                    <p className="flight-info">
                      <strong>Price:</strong> ₹{searchedTicket.price}
                    </p>
                    {searchedTicket.booking_timestamp && (
                      <p className="flight-info">
                        <strong>Booking Date:</strong>{" "}
                        {new Date(
                          searchedTicket.booking_timestamp
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your bookings...</p>
            </div>
          )}

          {error && passengerId && (
            <div className="alert alert-error">
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="btn btn-outline"
                style={{ marginTop: "0.5rem" }}
              >
                Dismiss
              </button>
            </div>
          )}

          {!passengerId && (
            <div className="empty-state">
              <div className="empty-state-icon">🔒</div>
              <h3>Please Login</h3>
              <p>
                You need to login to view your bookings. Please login or signup
                to continue.
              </p>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <Link to="/login" className="btn btn-primary">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-outline">
                  Signup
                </Link>
              </div>
            </div>
          )}

          {cancelError && (
            <div className="alert alert-error">
              <p>{cancelError}</p>
              <button
                onClick={() => setCancelError(null)}
                className="btn btn-outline"
                style={{ marginTop: "0.5rem" }}
              >
                Dismiss
              </button>
            </div>
          )}

          {cancelSuccess && (
            <div className="alert alert-success">
              <p>{cancelSuccess}</p>
            </div>
          )}

          {!loading && !error && bookings.length === 0 && passengerId && (
            <div className="empty-state">
              <div className="empty-state-icon">✈️</div>
              <h3>No Bookings Yet</h3>
              <p>
                You haven't made any bookings yet. Start by searching for
                flights!
              </p>
              <Link
                to="/search"
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Search Flights
              </Link>
            </div>
          )}

          {!loading && bookings.length > 0 && !searchedTicket && (
            <div className="flights-container">
              <div className="flights-header">
                <h2>Your Flight Bookings ({bookings.length})</h2>
                {passengerId && (
                  <button
                    onClick={() => fetchBookings()}
                    className="btn btn-secondary"
                  >
                    Refresh
                  </button>
                )}
              </div>
              {bookings.map((booking, index) => (
                <div key={index} className="booking-card">
                  <div className="booking-header">
                    <h3>Booking #{index + 1}</h3>
                    <div className="booking-pnr">
                      <strong>PNR:</strong> {booking.pnr}
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="flight-detail-section">
                      <h4>Route</h4>
                      <div className="flight-route">
                        {booking.start_ap}{" "}
                        <span className="flight-route-arrow">→</span>{" "}
                        {booking.dest_ap}
                      </div>
                      <p className="flight-info">
                        <strong>Date:</strong> {booking.schedule_date}
                      </p>
                      <p className="flight-info">
                        <strong>Departure:</strong> {booking.dep_time}
                      </p>
                      <p className="flight-info">
                        <strong>Arrival:</strong> {booking.arrival_time}
                      </p>
                    </div>
                    <div className="flight-detail-section">
                      <h4>Booking Details</h4>
                      <p className="flight-info">
                        <strong>Class:</strong> {booking.class_code}
                      </p>
                      <p className="flight-info">
                        <strong>Seat Number:</strong> {booking.seat_number}
                      </p>
                      <p className="booking-price">₹{booking.price}</p>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <button
                      onClick={() => handleChangeSeat(booking)}
                      className="btn btn-outline"
                    >
                      Change Seat
                    </button>
                    <button
                      onClick={() => handleCancelTicket(booking.pnr)}
                      className="btn btn-danger"
                      disabled={cancelLoading && cancelingPNR === booking.pnr}
                    >
                      {cancelLoading && cancelingPNR === booking.pnr
                        ? "Cancelling..."
                        : "Cancel Ticket"}
                    </button>
                  </div>
                </div>
              ))}

              {/* Change Seat Modal */}
              {changingSeat && (
                <div className="modal-overlay" onClick={cancelChangeSeat}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h2>Change Seat</h2>
                      <button
                        className="modal-close"
                        onClick={cancelChangeSeat}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                    <div className="modal-body">
                      {loadingSeats && (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <p>Loading available seats...</p>
                        </div>
                      )}
                      {changeSuccess && (
                        <div className="alert alert-success">
                          <p>Seat changed successfully!</p>
                        </div>
                      )}
                      {updateError && (
                        <div className="alert alert-error">
                          <p>{updateError}</p>
                        </div>
                      )}
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
                          <div className="legend-item">
                            <span className="legend-box current-seat"></span>
                            <span>Current Seat</span>
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
                                  <span className="seat-type-label">Aisle</span>
                                </div>
                                <div className="aisle-header"></div>
                                <div className="seat-group-header right-group">
                                  <span className="seat-type-label">Aisle</span>
                                  <span className="seat-type-label">
                                    Middle
                                  </span>
                                  <span className="seat-type-label">
                                    Window
                                  </span>
                                </div>
                              </div>
                              <div className="seat-map-body">
                                {generateSeatGrid(
                                  bookings.find((b) => b.pnr === changingSeat)
                                    ?.seat_number
                                )}
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
                        {newSeatNumber && (
                          <p className="selected-seat-info">
                            Selected: <strong>{newSeatNumber}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button
                        onClick={() =>
                          handleConfirmSeatChange(
                            changingSeat,
                            bookings.find((b) => b.pnr === changingSeat)
                              ?.seat_number
                          )
                        }
                        className="btn btn-primary"
                        disabled={updatingSeat || !newSeatNumber}
                      >
                        {updatingSeat ? "Updating..." : "Confirm Change"}
                      </button>
                      <button
                        onClick={cancelChangeSeat}
                        className="btn btn-outline"
                        disabled={updatingSeat}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyBookings;
