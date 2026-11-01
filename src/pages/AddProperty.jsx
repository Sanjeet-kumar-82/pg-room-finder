
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./AddProperty.css";

const API_URL = "https://pg-room-finder-backend.onrender.com/api";

export default function AddProperty() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ownerName: "",
    ownerPhone: "",
    pgName: "",
    city: "",
    address: "",
    description: "",
    singleRent: "",
    doubleRent: "",
    tripleRent: "",
  });

  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [pgPhotos, setPgPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    let user = null;

    try {
      user = JSON.parse(
        localStorage.getItem("pgRoomUser") || "null"
      );
    } catch {
      user = null;
    }

    const ownerId = user?.id || user?._id || user?.userId;

    if (!user || user.role?.toLowerCase() !== "owner") {
      setError("Please login with your Owner account first.");
      return;
    }

    if (!ownerId) {
      setError(
        "Owner ID missing. Please login again with your Owner account."
      );
      return;
    }

    if (!user.token) {
      setError("Login session missing. Please login again.");
      return;
    }

    if (!ownerPhoto) {
      setError("Please select an owner photo.");
      return;
    }

    if (pgPhotos.length === 0) {
      setError("Please select at least one PG photo.");
      return;
    }

    if (pgPhotos.length > 10) {
      setError("Please select a maximum of 10 PG photos.");
      return;
    }

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });

    data.append("ownerPhoto", ownerPhoto);

    pgPhotos.forEach((photo) => {
      data.append("pgPhotos", photo);
    });

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/properties`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      setSuccess(
        response.data?.message || "Property added successfully!"
      );

      setTimeout(() => {
        navigate("/owner-dashboard");
      }, 1200);
    } catch (err) {
      console.error(
        "Add property error:",
        err.response?.data || err.message
      );

      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("Owner permission denied. Please use an Owner account.");
      } else {
        setError(
          err.response?.data?.message ||
            "Property upload failed. Please check the backend server."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-property-page">
      <header className="add-property-header">
        <Link to="/" className="add-property-logo">
          RoomFinder
        </Link>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </header>

      <main className="add-property-container">
        <div className="add-property-heading">
          <span className="form-badge">LIST YOUR PROPERTY</span>
          <h1>Add Your PG / Room</h1>
          <p>
            Enter your property details and upload photos to list your PG.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="property-form">
          <section className="form-section">
            <h2>Owner Details</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ownerName">Owner Name *</label>
                <input
                  id="ownerName"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  placeholder="Enter owner name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerPhone">Phone Number *</label>
                <input
                  id="ownerPhone"
                  name="ownerPhone"
                  type="tel"
                  value={form.ownerPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ownerPhoto">Owner Photo *</label>
              <input
                id="ownerPhoto"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setOwnerPhoto(e.target.files?.[0] || null)
                }
                required
              />

              {ownerPhoto && (
                <div className="photo-preview">
                  <img
                    src={URL.createObjectURL(ownerPhoto)}
                    alt="Owner preview"
                  />
                  <span>{ownerPhoto.name}</span>

                  <button
                    type="button"
                    onClick={() => {
                      setOwnerPhoto(null);
                      document.getElementById("ownerPhoto").value = "";
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="form-section">
            <h2>PG / Room Details</h2>

            <div className="form-group">
              <label htmlFor="pgName">PG / Property Name *</label>
              <input
                id="pgName"
                name="pgName"
                value={form.pgName}
                onChange={handleChange}
                placeholder="Enter property name"
                required
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  id="city"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Delhi"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Full Address *</label>
                <input
                  id="address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter complete address"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your PG, facilities, food, rules, etc."
                rows={4}
                required
              />
            </div>

            <div className="form-grid rent-grid">
              <div className="form-group">
                <label htmlFor="singleRent">Single Sharing Rent (₹)</label>
                <input
                  id="singleRent"
                  name="singleRent"
                  type="number"
                  min="0"
                  value={form.singleRent}
                  onChange={handleChange}
                  placeholder="e.g. 10000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="doubleRent">Double Sharing Rent (₹)</label>
                <input
                  id="doubleRent"
                  name="doubleRent"
                  type="number"
                  min="0"
                  value={form.doubleRent}
                  onChange={handleChange}
                  placeholder="e.g. 7000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tripleRent">Triple Sharing Rent (₹)</label>
                <input
                  id="tripleRent"
                  name="tripleRent"
                  type="number"
                  min="0"
                  value={form.tripleRent}
                  onChange={handleChange}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Upload PG Photos</h2>
            <p className="upload-help">
              Select photos of rooms, bathrooms, kitchen, and other facilities.
            </p>

            <div className="form-group">
              <label htmlFor="pgPhotos">Choose PG Photos *</label>
              <input
                id="pgPhotos"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setPgPhotos(Array.from(e.target.files || []))
                }
                required
              />
            </div>

            {pgPhotos.length > 0 && (
              <div className="selected-photos">
                <h3>{pgPhotos.length} photo(s) selected</h3>

                <div className="photo-preview-grid">
                  {pgPhotos.map((photo, index) => (
                    <div
                      className="pg-photo-preview"
                      key={`${photo.name}-${index}`}
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`PG preview ${index + 1}`}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          setPgPhotos((prev) =>
                            prev.filter((_, i) => i !== index)
                          );
                        }}
                        aria-label={`Remove ${photo.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {error && (
            <div className="form-message error-message" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="form-message success-message" role="status">
              {success}
            </div>
          )}

          <button
            className="submit-property-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Submit Property"}
          </button>
        </form>
      </main>
    </div>
  );
}
