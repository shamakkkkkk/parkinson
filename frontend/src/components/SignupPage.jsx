import { Link, useLocation } from "wouter";
import { useMemo, useState } from "react";
import FormField from "./ui/FormField";
import Button from "./ui/Button";
import Banner from "./ui/Banner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordHint = "At least 8 characters.";
  const isFormValid = useMemo(
    () =>
      fullName.trim().length > 1 &&
      username.trim().length >= 3 &&
      emailRegex.test(email) &&
      password.length >= 8,
    [fullName, username, email, password],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isFormValid) {
      setError("Please fill in every field correctly before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({ username: username.trim(), password, fullName: fullName.trim(), emailAddress: email.trim() });
      toast.success("Account created. Please log in.");
      setLocation("/login");
    } catch (err) {
      setError(err?.message || "Could not create your account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <span className="app-brand-mark" style={{ width: 56, height: 56, fontSize: 24 }}>M</span>
        <h1>Join the research team</h1>
        <p style={{ color: "rgba(255,255,255,0.75)" }}>
          Create an experimenter account to run and review Parkinson&rsquo;s movement/speech sessions.
        </p>
      </div>
      <div className="auth-card">
        <h2>Sign up</h2>
        <p className="helper-text">Create a new account to get started.</p>
        <Banner tone="error">{error}</Banner>
        <form onSubmit={handleSubmit} noValidate>
          <FormField label="Full name" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <FormField label="Username" placeholder="jane.doe" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <FormField label="Email" type="email" placeholder="jane@srh.de" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <FormField
            label="Password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={passwordHint}
            required
          />
          <Button type="submit" fullWidth loading={isSubmitting} disabled={!isFormValid}>
            Sign Up
          </Button>
        </form>
        <Link href="/login" className="link-quiet">Already have an account? Log In</Link>
      </div>
    </div>
  );
}
