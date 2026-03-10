import { useState } from "react"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

function Login() {
  const [mode, setMode] = useState("login")
  const [role, setRole] = useState("user")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("error")
  const [loading, setLoading] = useState(false)
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  const setError = (text) => {
    setMessage(text)
    setMessageType("error")
  }

  const setInfo = (text) => {
    setMessage(text)
    setMessageType("info")
  }

  const handleLogin = async () => {
    if (!supabase || !hasSupabaseConfig) {
      setError("Supabase config missing in .env")
      return
    }

    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword) {
      setError("Email and password are required.")
      return
    }

    setLoading(true)
    setMessage("")
    setNeedsEmailConfirmation(false)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (error) {
      const isUnconfirmed = error.message?.toLowerCase().includes("email not confirmed")
      if (isUnconfirmed) {
        setNeedsEmailConfirmation(true)
        setError("Email not confirmed. Please verify your inbox, or resend confirmation email below.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    const userRole = data.user?.user_metadata?.role === "admin" ? "admin" : "user"
    if (userRole !== role) {
      await supabase.auth.signOut()
      setError(`This account is registered as ${userRole}. Select ${userRole} to login.`)
      setLoading(false)
      return
    }

    setInfo("Login successful.")
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!supabase || !hasSupabaseConfig) {
      setError("Supabase config missing in .env")
      return
    }

    const cleanEmail = email.trim()
    const cleanPassword = password.trim()
    const cleanConfirm = confirmPassword.trim()

    if (!cleanEmail || !cleanPassword || !cleanConfirm) {
      setError("Email, password, and confirm password are required.")
      return
    }

    if (cleanPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (cleanPassword !== cleanConfirm) {
      setError("Password and confirm password do not match.")
      return
    }

    setLoading(true)
    setMessage("")
    setNeedsEmailConfirmation(false)

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          role,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      setInfo("Account created and logged in successfully.")
    } else {
      setNeedsEmailConfirmation(true)
      setInfo("Account created. Please check your email and confirm your account before login.")
      setMode("login")
    }

    setConfirmPassword("")
    setLoading(false)
  }

  const handleSubmit = () => {
    if (mode === "signup") {
      handleSignup()
      return
    }
    handleLogin()
  }

  const handleResendConfirmation = async () => {
    if (!supabase || !hasSupabaseConfig) {
      setError("Supabase config missing in .env")
      return
    }

    const cleanEmail = email.trim()
    if (!cleanEmail) {
      setError("Enter your email first to resend confirmation.")
      return
    }

    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail,
    })

    if (error) {
      setError(error.message)
    } else {
      setInfo("Confirmation email sent. Please check inbox/spam.")
    }

    setLoading(false)
  }

  return (
    <section className="auth-wrap panel">
      <div className="auth-head">
        <p className="eyebrow">Welcome</p>
        <h2>{mode === "login" ? "Login to Continue" : "Create Account"}</h2>
      </div>

      {!hasSupabaseConfig && (
        <p className="error-text">
          Configure Supabase in <code>hostel-frontend/.env</code> before login.
        </p>
      )}

      <div className="switcher">
        <button
          type="button"
          className={mode === "login" ? "btn small" : "btn btn-ghost small"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={mode === "signup" ? "btn small" : "btn btn-ghost small"}
          onClick={() => setMode("signup")}
        >
          Sign Up
        </button>
      </div>

      <div className="form-grid">
        <div className="role-select">
          <button
            type="button"
            className={role === "user" ? "btn small" : "btn btn-ghost small"}
            onClick={() => setRole("user")}
          >
            User
          </button>
          <button
            type="button"
            className={role === "admin" ? "btn small" : "btn btn-ghost small"}
            onClick={() => setRole("admin")}
          >
            Admin
          </button>
        </div>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {mode === "signup" && (
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        )}

        <button onClick={handleSubmit} disabled={!hasSupabaseConfig || loading} className="btn">
          {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
        </button>
      </div>

      {message && (
        <p className={messageType === "info" ? "info-text" : "error-text"}>
          {message}
        </p>
      )}

      {needsEmailConfirmation && (
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading || !hasSupabaseConfig}
          onClick={handleResendConfirmation}
        >
          Resend Confirmation Email
        </button>
      )}
    </section>
  )
}

export default Login
