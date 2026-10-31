
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:5000/api/auth";

export default function CustomerAuth({ mode = "login" }) {
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
        role: "customer",
      };

      if (isRegister) {
        payload.name = name.trim();
      }

      const response = await axios.post(`${API}${endpoint}`, payload);
      const user = response.data.user || {};
      const token = user.token || response.data.token;

      localStorage.setItem(
        "pgRoomUser",
        JSON.stringify({ ...user, role: "customer" })
      );

      if (token) {
        localStorage.setItem("pgRoomToken", token);
      }

      navigate("/customer-dashboard");
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
      <style>{`
       
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #eaf4ff, #f5faff, #dceeff);
  font-family: Arial, sans-serif;
}

.auth-page::before,
.auth-page::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  background: rgba(96, 165, 250, 0.13);
  pointer-events: none;
}

.auth-page::before {
  width: 320px;
  height: 320px;
  top: -110px;
  left: -100px;
}

.auth-page::after {
  width: 400px;
  height: 400px;
  bottom: -180px;
  right: -130px;
}

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 40px 38px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid #dbeafe;
  border-radius: 24px;
  box-shadow: 0 20px 55px rgba(59, 130, 246, 0.14);
}

.auth-brand {
  text-align: center;
  color: #2563eb;
  font-size: 29px;
  font-weight: 800;
  margin-bottom: 28px;
  letter-spacing: -0.7px;
}

.auth-card h1 {
  margin: 0 0 10px;
  text-align: center;
  color: #183153;
  font-size: 28px;
  font-weight: 800;
}

.auth-subtitle {
  margin: 0 0 28px;
  text-align: center;
  color: #718096;
  font-size: 14px;
  line-height: 1.7;
}

.auth-card label {
  display: block;
  margin: 17px 0 8px;
  font-weight: 700;
  color: #334b68;
  font-size: 13px;
}

.auth-card input {
  width: 100%;
  padding: 14px 15px;
  box-sizing: border-box;
  border: 1px solid #d8e6f7;
  border-radius: 11px;
  background: #f8fbff;
  color: #1e3a5f;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.auth-card input:focus {
  background: #ffffff;
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.15);
}

.auth-card input::placeholder {
  color: #9aabc0;
}

.auth-submit {
  width: 100%;
  margin-top: 25px;
  padding: 15px;
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  color: white;
  border: none;
  border-radius: 11px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 7px 17px rgba(59, 130, 246, 0.22);
  transition: background 0.2s, transform 0.2s;
}

.auth-submit:active {
  background: #2563eb;
  transform: scale(0.98);
}

.auth-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-error {
  margin-top: 15px;
  padding: 12px;
  border: 1px solid #fecaca;
  border-radius: 9px;
  color: #b91c1c;
  background: #fff1f2;
  font-size: 13px;
  line-height: 1.5;
}

.auth-switch {
  margin-top: 24px;
  text-align: center;
  color: #718096;
  font-size: 13px;
  line-height: 2;
}

.auth-switch a,
.auth-home {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.auth-switch a:active,
.auth-home:active {
  color: #1e40af;
}

.auth-home {
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 22px;
    border-radius: 19px;
  }

  .auth-card h1 {
    font-size: 24px;
  }
}

/* RoomFinder brand */
.auth-brand {
  text-align: center;
  color: #2563eb;
  font-size: 32px;
  font-weight: 900;
  letter-spacing: -1.2px;
  margin-bottom: 30px;
  text-shadow: 0 3px 12px rgba(37, 99, 235, 0.12);
}

/* Customer Login heading */
.auth-card h1 {
  margin: 0 0 12px;
  text-align: center;
  color: #163b67;
  font-size: 31px;
  font-weight: 800;
  letter-spacing: -0.8px;
  line-height: 1.25;
}

/* Welcome message */
.auth-subtitle {
  margin: 0 0 30px;
  text-align: center;
  color: #64809f;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.8;
  letter-spacing: 0.2px;
}

/* Email and Password labels */
.auth-card label {
  display: block;
  margin: 19px 0 9px;
  color: #24558a;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

/* Email and Password input fields */
.auth-card input {
  width: 100%;
  padding: 15px 16px;
  box-sizing: border-box;
  border: 1.5px solid #c9def5;
  border-radius: 12px;
  background: #f4f9ff;
  color: #1e3a5f;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  transition: all 0.25s ease;
}

.auth-card input::placeholder {
  color: #91a9c3;
}

.auth-card input:focus {
  background: #ffffff;
  border-color: #60a5fa;
  box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.15);
}

/* ===== PREMIUM LOGIN BUTTON ===== */

.auth-submit {
  width: 100%;
  margin-top: 26px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  background: linear-gradient(135deg, #60a5fa, #2563eb);
  color: #ffffff;
  border: 1px solid #60a5fa;
  border-radius: 13px;

  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.5px;

  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.22);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

/* Button icon */
.auth-submit::before {
  content: "↪";
  font-size: 21px;
  font-weight: 900;
}

/* Click effect */
.auth-submit:active {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  transform: scale(0.98);
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.2);
}

/* Disabled state */
.auth-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* ===== LOGIN PAGE LINKS ===== */

.auth-switch {
  margin-top: 25px;
  padding: 18px 14px;
  text-align: center;
  color: #52708f;
  font-size: 13px;
  line-height: 2.2;
  background: #f3f8ff;
  border: 1px solid #d5e7fb;
  border-radius: 14px;
}

/* Register and Owner Login links */
.auth-switch a {
  display: inline-block;
  padding: 5px 13px;
  margin: 3px 2px;
  color: #2563eb;
  background: #e4f0ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.auth-switch a:active {
  background: #bfdbfe;
  color: #1e40af;
}

/* Back to Home */
.auth-home {
  display: block;
  width: fit-content;
  margin: 20px auto 0;
  padding: 10px 20px;
  color: #2563eb;
  background: #ffffff;
  border: 1.5px solid #bfdbfe;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.auth-home:active {
  background: #dbeafe;
  color: #1e40af;
}

/* ===== PREMIUM ACCOUNT LINKS ===== */

.auth-switch {
  margin-top: 26px;
  padding: 20px 16px;
  text-align: center;
  color: #52677f;
  font-size: 13px;
  line-height: 2.5;
  background: #f7faff;
  border: 1px solid #dce8f5;
  border-radius: 16px;
  box-shadow: 0 5px 18px rgba(30, 64, 100, 0.05);
}

/* Register and Owner Login */
.auth-switch a {
  display: inline-block;
  padding: 5px 13px;
  margin: 3px 2px;
  color: #24558a;
  background: #eaf3fc;
  border: 1px solid #cbdff2;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
  transition: all 0.22s ease;
}

/* Elegant hover */
.auth-switch a:hover {
  color: #ffffff;
  background: #315f91;
  border-color: #315f91;
  box-shadow: 0 4px 12px rgba(49, 95, 145, 0.18);
}

/* Press */
.auth-switch a:active {
  transform: scale(0.97);
}

/* ===== PREMIUM BACK TO HOME ===== */

.auth-home {
  display: block;
  width: fit-content;
  margin: 22px auto 0;
  padding: 10px 22px;
  color: #315f91;
  background: #ffffff;
  border: 1px solid #cbdff2;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 13px rgba(30, 64, 100, 0.06);
  transition: all 0.22s ease;
}

.auth-home:hover {
  color: #ffffff;
  background: #315f91;
  border-color: #315f91;
  box-shadow: 0 6px 16px rgba(49, 95, 145, 0.18);
}

.auth-home:active {
  transform: scale(0.97);
}

      `}</style>

      <div className="auth-card">
        <div className="auth-brand">⌂ RoomFinder</div>

        <h1>{isRegister ? "Create Customer Account" : "Customer Login"}</h1>
        <p className="auth-subtitle">
          {isRegister
            ? "Register to find your next comfortable home."
            : "Welcome back! Login to continue finding rooms."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label htmlFor="customer-name">Full Name</label>
              <input
                id="customer-name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </>
          )}

          <label htmlFor="customer-email">Email Address</label>
          <input
            id="customer-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label htmlFor="customer-password">Password</label>
          <input
            id="customer-password"
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
                ? "Create Account"
                : "Login"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <Link to="/customer-login" onClick={() => changeMode(false)}>
                Login
              </Link>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <Link to="/customer-register" onClick={() => changeMode(true)}>
                Register
              </Link>
            </>
          )}
          <br />
          Are you a property owner?{" "}
          <Link to="/owner-login">Owner Login</Link>
        </div>

        <Link to="/" className="auth-home">← Back to Home</Link>
      </div>
    </div>
  );
}
