import { GoogleLogin } from "@react-oauth/google";
import { Link } from "react-router-dom";

// Create a reuseable authentication form.
export default function AuthForm({
  mode,
  values,
  error,
  loading,
  onChange,
  onSubmit,
  onGoogleSuccess,
}) {
  // Check if in sign up mode.
  const isSignup = mode === "signup";

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-heading">
          <div className="brand-mark">AI</div>
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p>{isSignup ? "Start a new AI workspace." : "Log in to continue chatting."}</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          {isSignup && (
            <label>
              Name
              <input
                name="name"
                value={values.name}
                onChange={onChange}
                placeholder="Ada Lovelace"
              />
            </label>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={values.email}
              onChange={onChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={values.password}
              onChange={onChange}
              placeholder="At least 8 characters"
              minLength={isSignup ? 8 : undefined}
              required
            />
          </label>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Log in"}
          </button>
        </form>

        <div className="divider">
          <span />
          or
          <span />
        </div>

        <GoogleLogin
          onSuccess={(credentialResponse) => onGoogleSuccess(credentialResponse.credential)}
          onError={() => onGoogleSuccess(null)}
          width="100%"
        />

        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "Need an account?"}{" "}
          <Link to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </section>
    </main>
  );
}
