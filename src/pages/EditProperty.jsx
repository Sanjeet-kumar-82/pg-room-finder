import "./EditProperty.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";


const API = "http://localhost:5000/api";

function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    pgName: "",
    city: "",
    address: "",
    description: "",
    roomType: "Single",
    rent: "",
    singleRent: "",
    doubleRent: "",
    tripleRent: "",
    ownerName: "",
    ownerPhone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProperty() {
      try {
        const savedUser = JSON.parse(
          localStorage.getItem("pgRoomUser") || "null"
        );

        if (!savedUser?.token || savedUser.role !== "owner") {
          navigate("/owner-auth");
          return;
        }

       const response = await axios.get(`${API}/properties/${id}`, {
  headers: {
    Authorization: `Bearer ${savedUser.token}`,
  },
});

        const property =
          response.data?.property || response.data;

        setForm((previous) => ({
          ...previous,
          ...property,
          title: property.title || "",
          pgName: property.pgName || "",
          city: property.city || "",
          address: property.address || "",
          description: property.description || "",
          roomType: property.roomType || "Single",
          rent: property.rent ?? "",
          singleRent: property.singleRent ?? "",
          doubleRent: property.doubleRent ?? "",
          tripleRent: property.tripleRent ?? "",
          ownerName: property.ownerName || "",
          ownerPhone: property.ownerPhone || property.phone || "",
        }));
      } catch (error) {
        console.error("Load property error:", error);
        setMessage(
          error.response?.data?.message ||
            "Property load nahi hui. Backend route check karein."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id, navigate]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
  
    const confirmUpdate = window.confirm(
  "Do you want to update the property details?"
);

if (!confirmUpdate) {
  return;
}
    setMessage("");

    const savedUser = JSON.parse(
      localStorage.getItem("pgRoomUser") || "null"
    );

    if (!savedUser?.token || savedUser.role !== "owner") {
      navigate("/owner-auth");
      return;
    }

    if (!form.title.trim() && !form.pgName.trim()) {
      setMessage("Property ka naam enter karein.");
      return;
    }

    if (!form.city.trim()) {
      setMessage("City enter karein.");
      return;
    }

    if (
      !Number(form.singleRent || form.rent) ||
      Number(form.singleRent || form.rent) < 1
    ) {
      setMessage("Valid monthly rent enter karein.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        pgName: form.pgName.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        roomType: form.roomType,
        rent: Number(form.rent || form.singleRent),
        singleRent: Number(form.singleRent || form.rent),
        doubleRent: Number(form.doubleRent || 0),
        tripleRent: Number(form.tripleRent || 0),
        ownerName: form.ownerName.trim(),
        ownerPhone: form.ownerPhone.trim(),
      };

      const response = await axios.put(
        `${API}/properties/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${savedUser.token}`,
          },
        }
      );

      setMessage(
        response.data?.message || "Property successfully update ho gayi!"
      );

      setTimeout(() => {
        navigate("/owner-dashboard");
      }, 1000);
    } catch (error) {
      console.error("Update property error:", error);
      setMessage(
        error.response?.data?.message ||
          "Property update nahi hui. Backend update route check karein."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="add-property-page">Property load ho rahi hai...</div>;
  }

  return (
    <div className="add-property-page">
      <div className="add-property-container">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate("/owner-dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h1>Edit Property</h1>
        <p>Apni property ki details update karein.</p>

        {message && <p role="status">{message}</p>}

        <form onSubmit={handleSubmit} className="add-property-form">
          <label>Property / PG Name</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Property name"
          />

          <label>PG Name (if applicable)</label>
          <input
            name="pgName"
            value={form.pgName}
            onChange={handleChange}
            placeholder="PG name"
          />

          <label>City</label>
          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            required
          />

          <label>Full Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Full address"
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Property details"
            rows={4}
          />

          <label>Room Type</label>
          <select
            name="roomType"
            value={form.roomType}
            onChange={handleChange}
          >
            <option value="Single">Single Sharing</option>
            <option value="Double">Double Sharing</option>
            <option value="Triple">Triple Sharing</option>
          </select>

          <label>Single Sharing Rent (₹ / month)</label>
          <input
            type="number"
            name="singleRent"
            min="1"
            value={form.singleRent}
            onChange={handleChange}
            placeholder="Single sharing rent"
          />

          <label>Double Sharing Rent (₹ / month)</label>
          <input
            type="number"
            name="doubleRent"
            min="0"
            value={form.doubleRent}
            onChange={handleChange}
            placeholder="Double sharing rent"
          />

          <label>Triple Sharing Rent (₹ / month)</label>
          <input
            type="number"
            name="tripleRent"
            min="0"
            value={form.tripleRent}
            onChange={handleChange}
            placeholder="Triple sharing rent"
          />

          <label>Owner Name</label>
          <input
            name="ownerName"
            value={form.ownerName}
            onChange={handleChange}
            placeholder="Owner name"
          />

          <label>Owner Phone</label>
          <input
            type="tel"
            name="ownerPhone"
            value={form.ownerPhone}
            onChange={handleChange}
            placeholder="Owner phone"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Updating..." : "Update Property"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProperty;
