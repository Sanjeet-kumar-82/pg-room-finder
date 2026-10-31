import "./OwnerAuth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

export default function OwnerAuth({ mode = "login" }) {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(mode === "register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const changeMode = (register) => {
    setIsRegister(register);
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/signup" : "/login";

      const payload = {
        email: email.trim(),
        password,
        role: "owner",
      };

      if (isRegister) {
        payload.name = name.trim();
      }

      const response = await axios.post(`${API}${endpoint}`, payload);
      const user = response.data.user || {};
      const token = user.token || response.data.token;

      localStorage.setItem(
        "pgRoomUser",
        JSON.stringify({ ...user, role: "owner" })
      );

      if (token) {
        localStorage.setItem("pgRoomToken", token);
      }

      navigate("/owner-dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Request failed. Backend server check karke dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">
        <div className="auth-brand">⌂ RoomFinder</div>

        <h1>{isRegister ? "Create Owner Account" : "Owner Login"}</h1>
        <p className="auth-subtitle">
          {isRegister
            ? "Register to manage and list your rental properties."
            : "Login to manage your rental properties."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label htmlFor="owner-name">Full Name</label>
              <input
                id="owner-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="owner-email">Email Address</label>
          <input
            id="owner-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="owner-password">Password</label>
          <input
            id="owner-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={6}
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create Owner Account"
                : "Login as Owner"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already registered?{" "}
              <Link to="/owner-login" onClick={() => changeMode(false)}>
                Login
              </Link>
            </>
          ) : (
            <>
              New property owner?{" "}
              <Link to="/owner-register" onClick={() => changeMode(true)}>
                Register
              </Link>
            </>
          )}
          <br />
          Looking for a room?{" "}
          <Link to="/customer-login">Customer Login</Link>
        </div>

        <Link to="/" className="auth-home">← Back to Home</Link>
      </div>
    </div>
  );
}
