import { Link, useLocation } from "wouter";
import { useState } from "react";
import FormField from "./ui/FormField";
import Button from "./ui/Button";
import Banner from "./ui/Banner";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      setLocation("/");
    } catch (err) {
      setError(err?.message || "Login failed. Check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <span className="app-brand-mark" style={{ width: 56, height: 56, fontSize: 24 }}>M</span>
        <h1>MOVES Experiment Console</h1>
        <p style={{ color: "rgba(255,255,255,0.75)" }}>
          Control and visualize movement-and-speech experiments for Parkinson&rsquo;s disease research.
        </p>
      </div>
      <div className="auth-card">
        <h2>Log in</h2>
        <p className="helper-text">Welcome back. Sign in to continue.</p>
        <Banner tone="error">{error}</Banner>
        <form onSubmit={handleSubmit} noValidate>
          <FormField
            label="Username"
            type="text"
            placeholder="e.g. admin"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <FormField
            label="Password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <Button type="submit" fullWidth loading={isSubmitting} disabled={!username || !password}>
            Log In
          </Button>
        </form>
        <Link href="/signup" className="link-quiet">Create an account</Link>
      </div>
    </div>
  );
}
