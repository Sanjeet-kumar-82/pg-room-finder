import OwnerAuth from "./pages/OwnerAuth.jsx";
import CustomerAuth from "./pages/CustomerAuth.jsx";
import OwnerDashboard from "./pages/OwnerDashboard.jsx";
import CustomerDashboard from "./pages/CustomerDashboard.jsx";
import { useEffect, useMemo, useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";
import axios from "axios";
import AddProperty from "./pages/AddProperty.jsx";
import EditProperty from "./pages/EditProperty";
import "./App.css";

const API = "https://pg-room-finder-backend.onrender.com/api";

const cities = [
  "Delhi",
  "Noida",
  "Gurgaon",
  "Mumbai",
  "Pune",
  "Bengaluru",
];

function HomePage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [maxRent, setMaxRent] = useState("");
    const [bookingProperty, setBookingProperty] = useState(null);
  const [bookingRoomType, setBookingRoomType] = useState("Single");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pgRoomSaved") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    async function loadProperties() {
      try {
        const response = await axios.get(`${API}/properties`);
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.properties || [];

        setProperties(data);
      } catch (err) {
        console.error(err);
        setError(
          "Properties load nahi hui. Backend server check karein."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const text = [
        property.title,
        property.pgName,
        property.city,
        property.address,
        property.roomType,
        property.description,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(
        search.trim().toLowerCase()
      );

      const matchesCity =
        city === "All" ||
        (property.city || "").toLowerCase() === city.toLowerCase();

      const rent = Number(
        property.rent || property.singleRent || 0
      );

      const matchesRent = !maxRent || rent <= Number(maxRent);

      return matchesSearch && matchesCity && matchesRent;
    });
  }, [properties, search, city, maxRent]);

  function toggleSaved(property) {
    const id = property._id || property.id || property.title;

    setSavedIds((previous) => {
      const next = previous.includes(id)
        ? previous.filter((savedId) => savedId !== id)
        : [...previous, id];

      localStorage.setItem("pgRoomSaved", JSON.stringify(next));
      return next;
    });
  }
    async function handleBookNow(property) {
    setBookingMessage("");

    let loggedInUser;

    try {
      loggedInUser = JSON.parse(
        localStorage.getItem("pgRoomUser") || "null"
      );
    } catch {
      loggedInUser = null;
    }

    if (!loggedInUser?.token || loggedInUser.role !== "customer") {
      navigate("/customer-auth");
      return;
    }

    if (!/^\d{10}$/.test(bookingPhone.trim())) {
      setBookingMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    const rentMap = {
      Single: Number(property.singleRent || property.rent || 0),
      Double: Number(property.doubleRent || 0),
      Triple: Number(property.tripleRent || 0),
    };

    if (!rentMap[bookingRoomType]) {
      setBookingMessage("This room type is not available.");
      return;
    }

    try {
      setBookingLoading(true);

      console.log("Confirm Booking clicked:", property._id);
console.log("Logged in user:", loggedInUser);

const response = await axios.post(
  `${API}/bookings`,
  {
    propertyId: property._id,
    roomType: bookingRoomType,
    customerName: loggedInUser.name,
    customerPhone: bookingPhone.trim(),
  },
  {
    headers: {
      Authorization: `Bearer ${loggedInUser.token}`,
    },
  }
);
      setBookingMessage(
        response.data?.message || "Booking request sent successfully!"
      );
      setBookingProperty(null);
      setBookingPhone("");
    } catch (err) {
      setBookingMessage(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  function goToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  }

  function getPhoto(property) {
    const photo = property.pgPhotos?.[0]?.url
      ? property.pgPhotos[0].url
      : typeof property.pgPhotos?.[0] === "string"
        ? property.pgPhotos[0]
        : property.image || "";

    if (!photo) return "";

    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      return photo;
    }

    return `http://localhost:5000${
      photo.startsWith("/") ? "" : "/"
    }${photo}`;
  }

  return (
    <div className="app">
      <header className="navbar">
        <a
          className="brand"
          href="#home"
          onClick={(event) => {
            event.preventDefault();
            goToSection("home");
          }}
        >
          <span className="brand-icon">⌂</span>
          <span>
            Room<span className="brand-accent">Finder</span>
          </span>
        </a>

        <nav className="nav-links">
          <a
            href="#home"
            onClick={(event) => {
              event.preventDefault();
              goToSection("home");
            }}
          >
            Home
          </a>

          <a
            href="#properties"
            onClick={(event) => {
              event.preventDefault();
              goToSection("properties");
            }}
          >
            Find Rooms
          </a>

          <a
            href="#features"
            onClick={(event) => {
              event.preventDefault();
              goToSection("features");
            }}
          >
            Why Us
          </a>
        </nav>

        <div className="nav-actions">
          <button
            className="btn btn-outline"
            onClick={() => navigate("/customer-auth")}
          >
            Customer Login
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/owner-auth")}
          >
            Owner Login
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              YOUR NEXT HOME IS HERE
            </span>

            <h1>
              Find a place
              <br />
              you can call <span>home.</span>
            </h1>

            <p className="hero-description">
              Discover comfortable rooms and PGs that fit your lifestyle
              and budget. Your next chapter starts here.
            </p>

            <div className="hero-stats">
              <div>
                <strong>{properties.length}+</strong>
                <span>Listed properties</span>
              </div>

              <div>
                <strong>Easy</strong>
                <span>Room search</span>
              </div>

              <div>
                <strong>Simple</strong>
                <span>To get started</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => goToSection("properties")}
            >
              Explore Rooms →
            </button>
          </div>

          <div className="hero-visual">
            <div className="hero-orb orb-one" />
            <div className="hero-orb orb-two" />

            <div className="hero-house">
              <div className="house-sun" />
              <div className="house-roof" />

              <div className="house-body">
                <div className="house-window window-one" />
                <div className="house-window window-two" />
                <div className="house-door" />
              </div>

              <div className="house-ground" />
            </div>

            <div className="floating-card floating-top">
              <span className="floating-icon">✓</span>
              <div>
                <strong>Find your space</strong>
                <small>Search made simple</small>
              </div>
            </div>

            <div className="floating-card floating-bottom">
              <span className="floating-star">★</span>
              <div>
                <strong>Your next home</strong>
                <small>Starts right here</small>
              </div>
            </div>
          </div>

          <div className="search-panel">
            <div className="search-field search-location">
              <label htmlFor="room-search">
                LOCATION OR KEYWORD
              </label>

              <input
                id="room-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="City, area or room type"
              />
            </div>

            <div className="search-field">
              <label htmlFor="city-filter">CITY</label>

              <select
                id="city-filter"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              >
                <option value="All">All cities</option>

                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="search-field">
              <label htmlFor="budget-filter">
                MAX RENT / MONTH
              </label>

              <select
                id="budget-filter"
                value={maxRent}
                onChange={(event) => setMaxRent(event.target.value)}
              >
                <option value="">Any budget</option>
                <option value="5000">Up to ₹5,000</option>
                <option value="10000">Up to ₹10,000</option>
                <option value="15000">Up to ₹15,000</option>
                <option value="25000">Up to ₹25,000</option>
              </select>
            </div>

            <button
              className="btn btn-primary search-button"
              onClick={() => goToSection("properties")}
            >
              Search Rooms →
            </button>
          </div>
        </section>

        <section className="cities-section section" id="cities">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                EXPLORE LOCATIONS
              </span>
              <h2>Popular cities</h2>
              <p>Choose a city to explore available spaces.</p>
            </div>
          </div>

          <div className="city-grid">
            {cities.map((item, index) => (
              <button
                className={`city-card ${
                  city === item ? "city-selected" : ""
                }`}
                key={item}
                onClick={() => {
                  setCity(item);
                  goToSection("properties");
                }}
              >
                <span className={`city-art city-art-${index + 1}`}>
                  <span className="city-building building-one" />
                  <span className="city-building building-two" />
                  <span className="city-building building-three" />
                  <span className="city-sun" />
                </span>

                <span className="city-name">{item}</span>
                <span className="city-caption">Explore rooms ↗</span>
              </button>
            ))}
          </div>
        </section>

        <section
          className="properties-section section"
          id="properties"
        >
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                YOUR SPACE, YOUR CHOICE
              </span>
              <h2>Rooms you may love</h2>
              <p>
                Find a space that matches your needs and budget.
              </p>
            </div>

            <span className="results-count">
              {filteredProperties.length} properties
            </span>
          </div>

          {loading ? (
            <div className="state-message">
              Loading properties...
            </div>
          ) : error ? (
            <div className="state-message error-message">
              {error}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">⌂</span>
              <h3>No properties found</h3>
              <p>
                Try another city or budget, or list a new property.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => {
                  setSearch("");
                  setCity("All");
                  setMaxRent("");
                }}
              >
                Clear filters
              </button>

              <button
                className="btn btn-outline"
                onClick={() => navigate("/add-property")}
              >
                + List Property
              </button>
            </div>
          ) : (
            <div className="property-grid">
              {filteredProperties.map((property, index) => {
                const id =
                  property._id || property.id || property.title;
                const saved = savedIds.includes(id);
                const photo = getPhoto(property);

                return (
                  <article className="property-card" key={id}>
                    <div
                      className={`property-art property-art-${
                        (index % 4) + 1
                      }`}
                    >
                      {photo ? (
                        <img
                          src={photo}
                          alt={property.title || "Room"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div className="property-illustration">
                          <div className="illustration-window" />
                          <div className="illustration-bed">
                            <span />
                          </div>
                          <div className="illustration-plant">♧</div>
                        </div>
                      )}

                      <span className="property-tag">
                        {property.roomType || "Room"}
                      </span>

                      <button
                        className={`save-button ${
                          saved ? "is-saved" : ""
                        }`}
                        onClick={() => toggleSaved(property)}
                        aria-label={
                          saved
                            ? "Remove saved property"
                            : "Save property"
                        }
                      >
                        {saved ? "♥" : "♡"}
                      </button>
                    </div>

                    <div className="property-info">
                      <div className="property-location">
                        <span>⌖</span>{" "}
                        {property.city || "Location not specified"}
                      </div>

                      <h3>
                        {property.title ||
                          property.pgName ||
                          "Room for rent"}
                      </h3>

                      <p className="property-address">
                        {property.address ||
                          "Address available on enquiry"}
                      </p>

                      {property.description && (
                        <p className="property-description">
                          {property.description}
                        </p>
                      )}

                      <div className="property-divider" />

                      <div className="property-bottom">
                        <div className="property-price">
                          <strong>
                            ₹
                            {Number(
                              property.rent ||
                                property.singleRent ||
                                0
                            ).toLocaleString("en-IN")}
                          </strong>
                          <span>/ month</span>
                        </div>

                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => {
                            const phone =
                              property.ownerPhone || property.phone;

                            if (phone) {
                              window.location.href = `tel:${phone}`;
                            } else {
                              alert(
                                "Owner contact details abhi available nahi hain."
                              );
                            }
                          }}
                        >
                          Contact
                        </button>
                      </div>
                                            <div className="booking-form">
                        <button
                          className="btn btn-primary"
                          type="button"
                          onClick={() => {
                            setBookingMessage("");
                            setBookingProperty(
                              bookingProperty === property._id
                                ? null
                                : property._id
                            );
                          }}
                        >
                          {bookingProperty === property._id
                            ? "Close Booking"
                            : "Book Now"}
                        </button>

                        {bookingProperty === property._id && (
                          <div className="booking-fields">
                            <label>Room Type</label>
                            <select
                              value={bookingRoomType}
                              onChange={(e) =>
                                setBookingRoomType(e.target.value)
                              }
                            >
                              <option value="Single" disabled={!Number(property.singleRent || property.rent || 0)}>
                                Single Sharing
                              </option>
                              <option value="Double" disabled={!Number(property.doubleRent || 0)}>
                                Double Sharing
                              </option>
                              <option value="Triple" disabled={!Number(property.tripleRent || 0)}>
                                Triple Sharing
                              </option>
                            </select>

                            <label>Phone Number</label>
                            <input
                              type="tel"
                              maxLength={10}
                              placeholder="Enter 10-digit phone number"
                              value={bookingPhone}
                              onChange={(e) =>
                                setBookingPhone(
                                  e.target.value.replace(/\D/g, "").slice(0, 10)
                                )
                              }
                            />

                            {bookingMessage && (
                              <p role="status">{bookingMessage}</p>
                            )}

                            <button
                              className="btn btn-primary"
                              type="button"
                              disabled={bookingLoading}
                              onClick={() => handleBookNow(property)}
                            >
                              {bookingLoading
                                ? "Sending..."
                                : "Confirm Booking"}
                            </button>
                          </div>
                        )}
                      </div>

                      {property.ownerName && (
                        <p className="owner-label">
                          Listed by {property.ownerName}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="features-section section"
          id="features"
        >
          <div className="section-heading centered-heading">
            <div>
              <span className="section-kicker">
                WHY ROOMFINDER?
              </span>
              <h2>Room hunting, made easier</h2>
              <p>
                A simple way to find and list your next space.
              </p>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-icon feature-blue">⌕</span>
              <h3>Easy to search</h3>
              <p>
                Filter rooms by location and monthly rent.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon feature-purple">⌂</span>
              <h3>Find your space</h3>
              <p>
                Explore rooms and PGs in popular cities.
              </p>
            </article>

            <article className="feature-card">
              <span className="feature-icon feature-blue">＋</span>
              <h3>List your property</h3>
              <p>
                Add property details and upload photos.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => navigate("/add-property")}
              >
                List Property →
              </button>
            </article>
          </div>
        </section>

      
      </main>

      <footer className="footer">
        <Link to="/" className="brand">
          <span className="brand-icon">
            <svg
              viewBox="0 0 24 24"
              width="26"
              height="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5.5 9.5V21h13V9.5" />
              <path d="M9 21v-7h6v7" />
            </svg>
          </span>

          <span className="brand-name">
            Room<span className="brand-accent">Finder</span>
          </span>
        </Link>

        <p>Find a place you can call home.</p>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/add-property")}
        >
          List Property
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/owner-auth" element={<OwnerAuth />} />
      <Route path="/owner-login" element={<OwnerAuth mode="login" />} />
      <Route
        path="/owner-register"
        element={<OwnerAuth mode="register" />}
      />

      <Route path="/customer-auth" element={<CustomerAuth />} />
      <Route
        path="/customer-login"
        element={<CustomerAuth mode="login" />}
      />
      <Route
        path="/customer-register"
        element={<CustomerAuth mode="register" />}
      />

      <Route
        path="/owner-dashboard"
        element={<OwnerDashboard />}
      />
      <Route
        path="/customer-dashboard"
        element={<CustomerDashboard />}
      />

      <Route path="/add-property" element={<AddProperty />} />
      <Route
  path="/edit-property/:id"
  element={<EditProperty />}
/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}