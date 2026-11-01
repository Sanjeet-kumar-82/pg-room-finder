
import React, { useState } from "react";
import axios from "axios";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
     `${API}/auth/signup`,
        form
      );

      setMessage(response.data.message || "Signup successful!");
      setForm({ name: "", email: "", password: "" });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Signup failed. Please try again."
      );
    }
  };

  return (
    <div style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Create Account</h2>
        <p>Join PG & Room Finder</p>

        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password (minimum 8 characters)"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          required
        />

        <button type="submit">Create Account</button>

        {message && <p>{message}</p>}
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f3f6fb",
    padding: "20px",
  },
  form: {
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    padding: "30px",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },
};

export default Signup;
