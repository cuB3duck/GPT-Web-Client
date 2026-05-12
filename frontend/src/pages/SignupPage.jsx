import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm from "../components/AuthForm.jsx";
import { api, setToken } from "../services/api.js";

export default function SignupPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Keep previous form values and updates current value.
  function handleChange(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  // Save access token and redirect user to home page.
  async function finishAuth(authResponse) {
    setToken(authResponse.access_token);
    navigate("/");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    // Send sign up data to backend and wait for response.
    try {
      await finishAuth(
        await api.signup({
          email: values.email,
          password: values.password,
          name: values.name || null,
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(idToken) {
    if (!idToken) {
      setError("Google sign-in failed");
      return;
    }
    setLoading(true);
    setError("");
    // Send sign up data to backend and wait for response.
    try {
      await finishAuth(await api.googleLogin(idToken));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      mode="signup"
      values={values}
      error={error}
      loading={loading}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onGoogleSuccess={handleGoogleSuccess}
    />
  );
}
