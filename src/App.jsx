import { useEffect, useMemo, useState } from "react"
import ComplaintForm from "./ComplaintForm"
import AdminDashboard from "./AdminDashboard"
import Login from "./Login"
import { hasSupabaseConfig, supabase } from "./supabaseClient"
import "./App.css"

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthLoading(false)
      return
    }

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      setAuthLoading(false)
    }

    loadSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null)
      setAuthLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const role = useMemo(() => {
    if (!session?.user) return "user"
    return session.user.user_metadata?.role === "admin" ? "admin" : "user"
  }, [session])

  const handleLogout = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <div className="app-shell">
      <div className="aurora aurora-a"></div>
      <div className="aurora aurora-b"></div>

      <main className="layout">
        <header className="topbar">
          <div>
            <p className="eyebrow">Hostel Care</p>
            <h1>Complaint Management</h1>
          </div>

          {session && (
            <div className="topbar-right">
              <p className="role-chip">{role.toUpperCase()}</p>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </header>

        {authLoading && <section className="panel">Checking session...</section>}

        {!authLoading && !session && <Login />}

        {!authLoading && session && role === "user" && (
          <section className="panel">
            <ComplaintForm />
          </section>
        )}

        {!authLoading && session && role === "admin" && (
          <section className="panel">
            <AdminDashboard />
          </section>
        )}
      </main>
    </div>
  )

}

export default App
