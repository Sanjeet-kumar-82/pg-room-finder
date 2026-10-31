
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OwnerDashboard.css";

const API = "http://localhost:5000/api";
const SERVER = "http://localhost:5000";

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

function getImageUrl(value) {
  if (!value || typeof value !== "string") return "";

  const path = value.trim();
  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  return `${SERVER}/${path.replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

function getOwnerPhoto(user) {
  return getImageUrl(
    user?.photo || user?.profilePhoto || user?.avatar || user?.image
  );
}

function getPropertyPhoto(property) {
  const photos =
    property?.pgPhotos || property?.photos || property?.images;

  const firstPhoto = Array.isArray(photos) ? photos[0] : photos;

  return getImageUrl(property?.image || property?.photo || firstPhoto);
}

function getPropertyOwnerId(property) {
  return getId(
    property?.ownerId || property?.owner || property?.userId
  );
}

function getPropertyTitle(property) {
  return (
    property?.title ||
    property?.pgName ||
    property?.propertyName ||
    property?.name ||
    "PG / Room"
  );
}

function getPropertyLocation(property) {
  return (
    property?.city ||
    property?.location ||
    property?.address ||
    "Location not specified"
  );
}

export default function OwnerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);

  useEffect(() => {
    let savedUser = null;

    try {
      savedUser = JSON.parse(
        localStorage.getItem("pgRoomUser") || "null"
      );
    } catch {
      savedUser = null;
    }

    if (!savedUser || savedUser.role !== "owner" || !savedUser.token) {
      navigate("/owner-auth", { replace: true });
      return;
    }

    setUser(savedUser);
    fetchProperties(savedUser);
    fetchBookings(savedUser);
  }, [navigate]);

  async function fetchProperties(savedUser) {
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.get(`${API}/properties`, {
        headers: {
          Authorization: `Bearer ${savedUser.token}`,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.properties)
        ? response.data.properties
        : [];

      const loggedInOwnerId = getId(
        savedUser.id || savedUser._id || savedUser.userId
      );

      console.log("Logged-in owner ID:", loggedInOwnerId);
      console.log("Properties from API:", data);

      const ownProperties = data.filter((property) => {
        const propertyOwnerId = getPropertyOwnerId(property);

        return (
          loggedInOwnerId !== "" &&
          propertyOwnerId !== "" &&
          loggedInOwnerId === propertyOwnerId
        );
      });

      console.log("My properties:", ownProperties);
      setProperties(ownProperties);

      if (data.length > 0 && ownProperties.length === 0) {
        setMessage(
       
        );
      } else if (data.length === 0) {
        setMessage("");
      }
    } catch (error) {
      console.error("Fetch properties error:", error);
      setMessage(
        error.response?.data?.message ||
          "Properties load nahi hui. Backend check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookings(savedUser) {
    setBookingLoading(true);

    try {
      const response = await axios.get(`${API}/owner/bookings`, {
        headers: {
          Authorization: `Bearer ${savedUser.token}`,
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.bookings)
        ? response.data.bookings
        : [];
console.log("Booking statuses:", data.map((b) => b.status));
setBookings(data);
      
      
    } catch (error) {
      console.error("Fetch bookings error:", error);
      setMessage(
        error.response?.data?.message ||
          "Booking requests load nahi hui."
      );
    } finally {
      setBookingLoading(false);
    }
  }


  async function updateBookingStatus(bookingId, status) {
    if (!user?.token) {
      navigate("/owner-auth");
      return;
    }

    setUpdatingBookingId(bookingId);
    setMessage("");

    try {
      const response = await axios.patch(
        `${API}/owner/bookings/${bookingId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const savedStatus =
        response.data?.booking?.status ||
        response.data?.status ||
        status;

     setBookings((previous) =>
  savedStatus === "Cancelled"
    ? previous.filter(
        (booking) => String(booking._id) !== String(bookingId)
      )
    : previous.map((booking) =>
        String(booking._id) === String(bookingId)
          ? { ...booking, status: savedStatus }
          : booking
      )
);

      setMessage(
        savedStatus === "Confirmed"
          ? "Booking confirm ho gayi!"
          : savedStatus === "Cancelled"
          ? "Booking reject ho gayi."
          : "Booking status update ho gaya."
      );
    } catch (error) {
      console.error("Update booking error:", error);

      setMessage(
        error.response?.data?.message ||
          "Booking status update nahi hua. Backend check karein."
      );
    } finally {
      setUpdatingBookingId(null);
    }
  }


  async function deleteConfirmedBooking(bookingId) {
    if (!user?.token) {
      navigate("/owner-auth");
      return;
    }

    const confirmed = window.confirm(
      "Kya tenant ke jaane ke baad is confirmed booking ko delete karna hai?"
    );

    if (!confirmed) return;

    setUpdatingBookingId(bookingId);
    setMessage("");

    try {
      const response = await axios.delete(
        `${API}/owner/bookings/${bookingId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setBookings((previous) =>
        previous.filter(
          (booking) => String(booking._id) !== String(bookingId)
        )
      );

      setMessage(
        response.data?.message || "Confirmed booking delete ho gayi."
      );
    } catch (error) {
      console.error("Delete confirmed booking error:", error);

      setMessage(
        error.response?.data?.message ||
          "Booking delete nahi hui. Backend route check karein."
      );
    } finally {
      setUpdatingBookingId(null);
    }
  }

  async function deleteProperty(id) {
    if (!user?.token) {
      navigate("/owner-auth");
      return;
    }

    const confirmed = window.confirm(
      "Kya aap sach mein ye property delete karna chahte hain?"
    );

    if (!confirmed) return;

    setDeletingId(id);
    setMessage("");

    try {
      const response = await axios.delete(`${API}/properties/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setProperties((previous) =>
        previous.filter((property) => property._id !== id)
      );

      setMessage(
        response.data?.message || "Property delete ho gayi!"
      );
    } catch (error) {
      console.error("Delete property error:", error);
      setMessage(
        error.response?.data?.message ||
          "Property delete nahi hui. Backend check karein."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("pgRoomToken");
    localStorage.removeItem("pgRoomUser");
    navigate("/owner-auth", { replace: true });
  }

  if (!user) {
    return <div className="owner-loading">Dashboard loading...</div>;
  }

  const ownerPhoto =
  getOwnerPhoto(user) ||
  getImageUrl(properties.find((property) => property.ownerPhoto)?.ownerPhoto);

  const pending = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const confirmed = bookings.filter(
    (booking) => booking.status === "Confirmed"
  ).length;

  return (
    <div className="owner-layout">
      <aside className="owner-sidebar">
        <Link to="/" className="owner-brand">
          Room<span>Finder</span>
        </Link>

        <p className="owner-nav-label">WORKSPACE</p>

        <a className="owner-nav active" href="#overview">
          <span className="owner-nav-icon">▦</span>
          Dashboard
        </a>

        <a className="owner-nav" href="#properties">
          <span className="owner-nav-icon">⌂</span>
          My Properties
        </a>

        <a className="owner-nav" href="#bookings">
          <span className="owner-nav-icon">▤</span>
          Booking Requests
        </a>

        <button
          className="owner-nav owner-add-link"
          onClick={() => navigate("/add-property")}
        >
          <span className="owner-nav-icon">＋</span>
          Add Property
        </button>

        <div className="owner-sidebar-bottom">
          <div className="owner-avatar">
            {ownerPhoto ? (
              <img
                src={ownerPhoto}
                alt="Owner profile"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || "O"
            )}
          </div>

          <div className="owner-profile">
            <strong>{user.name || "Property Owner"}</strong>
            <span>Property Owner</span>
          </div>

       
        </div>

        <button className="owner-logout-full" onClick={logout}>
          ⇥ Logout
        </button>
      </aside>

      <main className="owner-main">
        <header className="owner-topbar">
          <div>
            <span className="owner-eyebrow">OWNER WORKSPACE</span>
            <h1>Dashboard</h1>
          </div>

          <div className="owner-top-actions">
            <div className="owner-account">
              <span className="owner-online-dot" />
              Account active
            </div>

      
          </div>
        </header>

        <section id="overview" className="owner-welcome">
          <div className="owner-welcome-copy">
            <span className="owner-eyebrow">
              YOUR SPACE, YOUR BUSINESS
            </span>
            <h2>Welcome back, {user.name || "Owner"}!</h2>
            <p>
              Manage your PG listings and stay updated on customer bookings.
            </p>
          </div>

          <div className="owner-welcome-art">⌂</div>
        </section>

        {message && (
          <div className="owner-message" role="status">
            <span>ⓘ</span>
            {message}
          </div>
        )}

        <section className="owner-stats">
          <article className="owner-stat">
            <div className="owner-stat-icon purple">⌂</div>
            <span>Total Properties</span>
            <strong>{loading ? "—" : properties.length}</strong>
            <small>Your listed spaces</small>
          </article>

          <article className="owner-stat">
            <div className="owner-stat-icon orange">▤</div>
            <span>Total Bookings</span>
            <strong>{bookingLoading ? "—" : bookings.length}</strong>
            <small>All booking requests</small>
          </article>

          <article className="owner-stat">
            <div className="owner-stat-icon blue">◷</div>
            <span>Pending Requests</span>
            <strong>{bookingLoading ? "—" : pending}</strong>
            <small>Awaiting your response</small>
          </article>

          <article className="owner-stat">
            <div className="owner-stat-icon green">✓</div>
            <span>Confirmed</span>
            <strong>{bookingLoading ? "—" : confirmed}</strong>
            <small>Accepted bookings</small>
          </article>
        </section>

        <section className="owner-section" id="properties">
          <div className="owner-section-heading">
            <div>
              <span className="owner-eyebrow">YOUR LISTINGS</span>
              <h2>My Listed Properties</h2>
        
            </div>

         
          </div>

          {loading ? (
            <div className="owner-empty">
              <div className="owner-spinner" />
              <p>Properties load ho rahi hain...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="owner-empty">
              <div className="owner-empty-icon">⌂</div>
              <h3>No property is listed right now.</h3>
           

              <button
                className="owner-btn owner-btn-dark"
                onClick={() => fetchProperties(user)}
              >
                ↻ Refresh Properties
              </button>

              <button
                className="owner-btn owner-btn-light"
                onClick={() => navigate("/add-property")}
              >
                + List a Property
              </button>
            </div>
          ) : (
            <div className="owner-card-grid">
              {properties.map((property) => {
                const photo = getPropertyPhoto(property);

                return (
                  <article
                    className="owner-property-card"
                    key={property._id}
                  >
                    <div className="owner-property-image">
                      {photo ? (
                        <img
                          src={photo}
                          alt={getPropertyTitle(property)}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement.classList.add(
                              "owner-no-photo"
                            );
                          }}
                        />
                      ) : (
                        <div className="owner-property-placeholder">
                          <span>⌂</span>
                          <small>ROOMFINDER LISTING</small>
                        </div>
                      )}

                      <span className="owner-listing-badge">
                        My Listed Property
                      </span>
                    </div>

                    <div className="owner-property-body">
                      <h3>{getPropertyTitle(property)}</h3>

                      <p className="owner-location">
                        <span>⌖</span>
                        {getPropertyLocation(property)}
                      </p>

                      <p className="owner-address">
                        {property.address || "Address not specified"}
                      </p>

                      <div className="owner-rent-list">
                        <div>
                          <span>Single</span>
                          <strong>₹{property.singleRent ?? 0}</strong>
                          <small>/month</small>
                        </div>

                        <div>
                          <span>Double</span>
                          <strong>₹{property.doubleRent ?? 0}</strong>
                          <small>/month</small>
                        </div>

                        <div>
                          <span>Triple</span>
                          <strong>₹{property.tripleRent ?? 0}</strong>
                          <small>/month</small>
                        </div>
                      </div>

                      <div className="owner-card-actions">
                        <button
                          className="owner-btn owner-btn-light"
                          onClick={() =>
                            navigate(`/edit-property/${property._id}`)
                          }
                        >
                          ✎ Edit
                        </button>

                        <button
                          className="owner-btn owner-btn-red"
                          disabled={deletingId === property._id}
                          onClick={() => deleteProperty(property._id)}
                        >
                          {deletingId === property._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="owner-section" id="bookings">
          <div className="owner-section-heading">
            <div>
              <span className="owner-eyebrow">STAY CONNECTED</span>
              <h2>Booking Requests</h2>
              <p>
Manage customer requests here</p>
            </div>

            <span className="owner-count">
              {bookings.length} requests
            </span>
          </div>

          {bookingLoading ? (
            <div className="owner-empty">Bookings load ho rahi hain...</div>
          ) : bookings.length === 0 ? (
            <div className="owner-empty">
              <div className="owner-empty-icon">▤</div>
              <h3>No booking requests yet</h3>
              <p>
When a customer's booking request arrives, it will appear here</p>
            </div>
          ) : (
            <div className="owner-card-grid">
              {bookings.map((booking) => (
                <article className="owner-booking-card" key={booking._id}>
                  <div className="owner-card-top">
                    <div className="owner-stat-icon purple">⌂</div>

                    <span
                      className={`owner-status ${String(
                        booking.status || "Pending"
                      ).toLowerCase()}`}
                    >
                      {booking.status || "Pending"}
                    </span>
                  </div>

                  <h3>
                    {booking.propertyId?.title ||
                      booking.propertyId?.pgName ||
                      "PG / Room"}
                  </h3>

                  <p className="owner-location">
                    {booking.propertyId?.city || "Location not available"}
                  </p>

                  <div className="owner-detail-row">
                    <span>Customer</span>
                    <strong>{booking.customerName || "—"}</strong>
                  </div>

                  <div className="owner-detail-row">
                    <span>Phone</span>
                    <strong>
                      {booking.customerPhone || booking.customerPhoneNumber || "—"}
                    </strong>
                  </div>

                  <div className="owner-detail-row">
                    <span>Room type</span>
                    <strong>{booking.roomType || "—"}</strong>
                  </div>

                  <div className="owner-detail-row">
                    <span>Monthly rent</span>
                    <strong className="owner-rent">
                      ₹{booking.monthlyRent ?? booking.rent ?? 0}
                    </strong>
                  </div>

                  <div className="owner-detail-row">
                    <span>Requested</span>
                    <strong>
                      {booking.createdAt
                        ? new Date(booking.createdAt).toLocaleDateString("en-IN")
                        : "—"}
                    </strong>
                  </div>
                  
{String(booking.status || "").trim().toLowerCase() === "confirmed" && (
  <div className="owner-card-actions">
    <button
      className="owner-btn owner-btn-red"
      disabled={updatingBookingId === booking._id}
      onClick={() => deleteConfirmedBooking(booking._id)}
    >
      {updatingBookingId === booking._id
        ? "Deleting..."
        : "Delete Booking"}
    </button>
  </div>
)}


                {String(booking.status || "Pending").trim().toLowerCase() === "pending" && (
                    <div className="owner-card-actions">
                      <button
                        className="owner-btn owner-btn-green"
                        disabled={updatingBookingId === booking._id}
                        onClick={() =>
                          updateBookingStatus(booking._id, "Confirmed")
                        }
                      >
                        ✓ Accept
                      </button>

                      <button
                        className="owner-btn owner-btn-red"
                        disabled={updatingBookingId === booking._id}
                        onClick={async () => {
  await updateBookingStatus(booking._id, "Cancelled");

}}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="owner-footer">
          <span>RoomFinder Owner Workspace</span>
          <Link to="/">Back to Home ↗</Link>
        </footer>
      </main>
    </div>
  );
}
