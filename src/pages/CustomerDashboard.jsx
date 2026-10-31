
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CustomerDashboard.css";

const API = "http://localhost:5000/api";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [roomTypes, setRoomTypes] = useState({});
  const [phones, setPhones] = useState({});
  const [bookingInProgress, setBookingInProgress] = useState(null);

  useEffect(() => {
    let savedUser;

    try {
      savedUser = JSON.parse(
        localStorage.getItem("pgRoomUser") || "null"
      );
    } catch {
      savedUser = null;
    }

    if (
      !savedUser ||
      savedUser.role?.toLowerCase() !== "customer" ||
      !savedUser.token
    ) {
      navigate("/customer-auth", { replace: true });
      return;
    }

    setUser(savedUser);
    fetchProperties();
    fetchBookings(savedUser);
  }, [navigate]);

  async function fetchProperties() {
    setLoading(true);

    try {
      const response = await axios.get(`${API}/properties`);
      setProperties(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Fetch properties error:", error);
      setMessage(
        error.response?.data?.message ||
        "Rooms load nahi ho paaye. Backend check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookings(savedUser) {
    setBookingLoading(true);

    try {
      const response = await axios.get(`${API}/customer/bookings`, {
        headers: {
          Authorization: `Bearer ${savedUser.token}`,
        },
      });

      setBookings(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Fetch bookings error:", error);
      console.error("Fetch bookings response:", error.response?.data);

      setMessage(
        error.response?.data?.message ||
        "My Bookings load nahi hui."
      );
    } finally {
      setBookingLoading(false);
    }
  }

async function cancelBooking(bookingId) {
  if (!user?.token) return;

  const confirmed = window.confirm(
    "Kya aap sach mein is booking ko cancel karna chahte hain?"
  );

  if (!confirmed) return;

  try {
    const response = await axios.patch(
      `${API}/customer/bookings/${bookingId}/cancel`,
      {},
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    setBookings((previous) =>
      previous.map((booking) =>
        String(booking._id) === String(bookingId)
          ? { ...booking, status: "Cancelled" }
          : booking
      )
    );

    setMessage(
      response.data?.message || "Booking successfully cancel ho gayi."
    );
  } catch (error) {
    console.error("Cancel booking error:", error);
    setMessage(
      error.response?.data?.message ||
        "Booking cancel nahi hui. Backend check karein."
    );
  }
}

async function deleteBooking(bookingId) {
  if (!user?.token) return;

  const confirmed = window.confirm(
    "Kya aap is cancelled booking ko delete karna chahte hain?"
  );

  if (!confirmed) return;

  try {
    await axios.delete(`${API}/customer/bookings/${bookingId}`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    setBookings((previous) =>
      previous.filter(
        (booking) => String(booking._id) !== String(bookingId)
      )
    );

    setMessage("Cancelled booking delete ho gayi.");
  } catch (error) {
    console.error("Delete booking error:", error);
    setMessage(
      error.response?.data?.message ||
        "Booking delete nahi hui. Backend route check karein."
    );
  }
}

  async function bookProperty(property) {
    if (!user?.token) {
      navigate("/customer-auth");
      return;
    }

    const roomType = roomTypes[property._id] || "Single";
    const customerPhone = (phones[property._id] || "").trim();
    const confirmed = window.confirm(
  "Are you sure you want to book this room?"
);

if (!confirmed) return;

    if (!/^[0-9]{10}$/.test(customerPhone)) {
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    const rentField = {
      Single: "singleRent",
      Double: "doubleRent",
      Triple: "tripleRent",
    }[roomType];

    const monthlyRent = Number(property[rentField]);

    if (!Number.isFinite(monthlyRent) || monthlyRent <= 0) {
      setMessage(`${roomType} room ka rent available nahi hai.`);
      return;
    }

    setBookingInProgress(property._id);
    setMessage("");

    try {
      const response = await axios.post(
        `${API}/bookings`,
        {
          propertyId: property._id,
          roomType,
          customerName: user.name,
          customerPhone,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

     setMessage("Booking Successful! Your request has been sent to the owner.");

     await fetchBookings(user);
    } catch (error) {
      console.error("Booking error:", error);
      console.error("Server response:", error.response?.data);
      console.error("HTTP status:", error.response?.status);

      const serverData = error.response?.data;
      const serverMessage =
        serverData?.message ||
        serverData?.error ||
        error.message ||
        "Booking failed.";

      const details = serverData?.details;
      const detailsText = Array.isArray(details)
        ? details.join(" ")
        : typeof details === "string"
        ? details
        : "";

      const fullMessage = detailsText
        ? `${serverMessage} ${detailsText}`
        : serverMessage;

      setMessage(`Booking failed: ${fullMessage}`);

      alert(
        `Booking failed\n\n${fullMessage}\n\nHTTP Status: ${
          error.response?.status || "No response from server"
        }`
      );
    } finally {
      setBookingInProgress(null);
    }
  }

  function logout() {
    localStorage.removeItem("pgRoomToken");
    localStorage.removeItem("pgRoomUser");
    navigate("/customer-auth", { replace: true });
  }

  if (!user) {
    return <div className="cd-loading">Dashboard loading...</div>;
  }

  return (
    <main className="cd-page">
      <header className="cd-header">
        <Link to="/" className="cd-brand">
          Room<span>Finder</span>
        </Link>

       <div className="cd-header-right">
  <div className="cd-user-profile">
    <span className="cd-user-avatar">
      {(user.name || "C").trim().charAt(0).toUpperCase()}
    </span>

    <div className="cd-user-label">
      <small>Welcome back</small>
      <strong>{user.name || "Customer"}</strong>
    </div>
  </div>

  <button className="cd-logout" onClick={logout}>
    <span>↪</span> Logout
  </button>
</div>
      </header>

      <div className="cd-container">
        <section className="cd-hero">
          <div className="cd-hero-content">
            <span className="cd-kicker">CUSTOMER DASHBOARD</span>
            <h1>Welcome, {user.name || "Customer"}!</h1>
            <p>
         Explore suitable PGs and rooms for yourself. Choose a room according to your budget.
            </p>

            <button
              className="cd-primary-btn"
              onClick={() =>
                document
                  .getElementById("available-properties")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Rooms <span>→</span>
            </button>
          </div>

          <div className="cd-hero-decoration" aria-hidden="true">
            <div className="cd-house-icon">⌂</div>
            <span>Find a place</span>
            <strong>Feel at home.</strong>
          </div>
        </section>

        {message && (
          <div className="cd-message" role="status">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <section className="cd-account-grid">
          <article className="cd-panel cd-account-card">
            <div className="cd-section-heading">
              <div className="cd-icon-box">♙</div>
              <div>
                <h2>My Account</h2>
                <p>Your personal information</p>
              </div>
            </div>

            <div className="cd-info-row">
              <span>Name</span>
              <strong>{user.name || "Customer"}</strong>
            </div>

            <div className="cd-info-row">
              <span>Email</span>
              <strong className="cd-email">
                {user.email || "Not available"}
              </strong>
            </div>

            <div className="cd-info-row">
              <span>Account type</span>
              <span className="cd-role-badge">Customer</span>
            </div>
          </article>

          <article className="cd-panel cd-booking-summary">
            <div className="cd-section-heading">
              <div className="cd-icon-box cd-icon-purple">▣</div>
              <div>
                <h2>My Bookings</h2>
                <p>Track your room requests</p>
              </div>
            </div>

            <div className="cd-booking-count">
              <strong>{bookingLoading ? "…" : bookings.length}</strong>
              <span>
                {bookings.length === 1
                  ? "Booking request"
                  : "Booking requests"}
              </span>
            </div>

            <p className="cd-muted">
              {bookingLoading
                ? "Bookings load ho rahi hain..."
                : bookings.length === 0
                ? "You have not booked any room yet."
                : "View your booking details and status below."}
            </p>

            <button
              className="cd-secondary-btn"
              onClick={() =>
                document
                  .getElementById("my-bookings")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              View Bookings <span>↓</span>
            </button>
          </article>
        </section>

        <section className="cd-section" id="my-bookings">
          <div className="cd-section-title">
            <div>
              <span className="cd-kicker">YOUR ACTIVITY</span>
              <h2>My Bookings</h2>
              <p>Check the status of your booking here.</p>
            </div>
          </div>

          {bookingLoading ? (
            <div className="cd-empty">Bookings load ho rahi hain...</div>
          ) : bookings.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon">▣</div>
              <h3>No bookings yet</h3>
              <p>
              You have not booked a room yet. Please choose your room from the available rooms.
              </p>
              <button
                className="cd-primary-btn"
                onClick={() =>
                  document
                    .getElementById("available-properties")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Find a Room →
              </button>
            </div>
          ) : (
            <div className="cd-bookings-grid">
              {bookings.map((booking) => (
                <article
                  className="cd-panel cd-booking-card"
                  key={booking._id}
                >
                  <div className="cd-booking-card-top">
                    <h3>
                      {booking.propertyId?.title ||
                        booking.propertyId?.pgName ||
                        "PG / Room"}
                    </h3>
                    <span
                      className={`cd-status cd-status-${String(
                        booking.status || "Pending"
                      ).toLowerCase()}`}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </div>

                  <p>
                    <strong>City:</strong>{" "}
                    {booking.propertyId?.city || "Not available"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {booking.propertyId?.address || "Not available"}
                  </p>
                  <p>
                    <strong>Room:</strong> {booking.roomType || "—"}
                  </p>
                  <p>
                    <strong>Monthly rent:</strong>{" "}
                    ₹{booking.monthlyRent ?? "—"}
                  </p>
                  <p>
                    <strong>Booking date:</strong>{" "}
                    {booking.createdAt
                      ? new Date(booking.createdAt).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
            
{["pending", "confirmed"].includes(
  String(booking.status || "Pending").trim().toLowerCase()
) && (
  <button
    type="button"
    className="cd-explore-btn"
    onClick={() => cancelBooking(booking._id)}
  >
    Cancel Booking
  </button>
)}
      
{String(booking.status || "").trim().toLowerCase() === "cancelled" && (
  <button
    type="button"
    className="cd-explore-btn"
    onClick={() => deleteBooking(booking._id)}
  >
    Delete Booking
  </button>
)}

                </article>
              ))}
            </div>
          )}
        </section>

        <section className="cd-section" id="available-properties">
          <div className="cd-section-title">
            <div>
              <span className="cd-kicker">FIND YOUR SPACE</span>
              <h2>Available PGs & Rooms</h2>
              <p>
                Choose according to your budget and room preferences.
              </p>
            </div>
            {!loading && (
              <span className="cd-property-count">
                {properties.length} properties
              </span>
            )}
          </div>

          {loading ? (
            <div className="cd-empty">Rooms load ho rahe hain...</div>
          ) : properties.length === 0 ? (
            <div className="cd-empty">
              <h3>No properties available</h3>
              <p>
                Abhi koi property available nahi hai. Baad mein
                dobara check karein.
              </p>
            </div>
          ) : (
            <div className="cd-properties-grid">
              {properties.map((property) => {
                const title =
                  property.title || property.pgName || "PG / Room";

                const rawImage =
                  property.image ||
                  property.pgPhotos?.[0] ||
                  property.images?.[0];

                const image = rawImage
                  ? rawImage.startsWith("http")
                    ? rawImage
                    : `http://localhost:5000${
                        rawImage.startsWith("/") ? "" : "/"
                      }${rawImage}`
                  : "";

                const selectedRoom = roomTypes[property._id] || "Single";

                return (
                  <article
                    className="cd-property-card"
                    key={property._id}
                  >
                    <div className="cd-property-image">
                      {image ? (
                        <img src={image} alt={title} />
                      ) : (
                        <div className="cd-image-placeholder">
                          <span>⌂</span>
                          <p>Your next home</p>
                        </div>
                      )}
                      <span className="cd-image-tag">Available</span>
                    </div>

                    <div className="cd-property-body">
                      <div className="cd-property-location">
                        <span>⌖</span>
                        {property.city || "City not specified"}
                      </div>

                      <h3>{title}</h3>

                      <p className="cd-property-address">
                        {property.address || "Address not available"}
                      </p>

                      <div className="cd-rent-grid">
                        <div>
                          <span>Single</span>
                          <strong>₹{property.singleRent || 0}</strong>
                          <small>/ month</small>
                        </div>
                        <div>
                          <span>Double</span>
                          <strong>₹{property.doubleRent || 0}</strong>
                          <small>/ month</small>
                        </div>
                        <div>
                          <span>Triple</span>
                          <strong>₹{property.tripleRent || 0}</strong>
                          <small>/ month</small>
                        </div>
                      </div>

                      <div className="cd-booking-form">
                        <label htmlFor={`room-${property._id}`}>
                          Select room type
                        </label>
                        <select
                          id={`room-${property._id}`}
                          value={selectedRoom}
                          onChange={(event) =>
                            setRoomTypes((previous) => ({
                              ...previous,
                              [property._id]: event.target.value,
                            }))
                          }
                        >
                          <option
                            value="Single"
                            disabled={Number(property.singleRent) <= 0}
                          >
                            Single Room — ₹{property.singleRent || 0}
                          </option>
                          <option
                            value="Double"
                            disabled={Number(property.doubleRent) <= 0}
                          >
                            Double Room — ₹{property.doubleRent || 0}
                          </option>
                          <option
                            value="Triple"
                            disabled={Number(property.tripleRent) <= 0}
                          >
                            Triple Room — ₹{property.tripleRent || 0}
                          </option>
                        </select>

                        <label htmlFor={`phone-${property._id}`}>
                          10-digit phone number
                        </label>
                        <input
                          id={`phone-${property._id}`}
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="Enter phone number"
                          value={phones[property._id] || ""}
                          onChange={(event) =>
                            setPhones((previous) => ({
                              ...previous,
                              [property._id]: event.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            }))
                          }
                        />

                        <button
                          type="button"
                          className="cd-primary-btn cd-book-btn"
                          disabled={bookingInProgress === property._id}
                          onClick={() => bookProperty(property)}
                        >
                          {bookingInProgress === property._id
                            ? "Sending request..."
                            : "Book Now →"}
                        </button>

                        <button
                          type="button"
                          className="cd-explore-btn"
                          onClick={() =>
                            navigate(`/property/${property._id}`)
                          }
                        >
                          Explore Property
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Link className="cd-back-home" to="/">
          ← Back to Home
        </Link>
      </div>

      <footer className="cd-footer">
        <span className="cd-brand">
          Room<span>Finder</span>
        </span>
        <p>Find a place you can call home.</p>
      </footer>
    </main>
  );
}
