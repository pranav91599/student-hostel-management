import { useState } from "react"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

function ComplaintForm() {

  const [name, setName] = useState("")
  const [room, setRoom] = useState("")
  const [type, setType] = useState("")
  const [desc, setDesc] = useState("")
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const getReadableError = (error, source = "complaints") => {
    if (!error) return "Unknown error"
    const message = error.message || "Unknown error"
    const details = error.details ? ` (${error.details})` : ""

    if (message.toLowerCase().includes("row-level security")) {
      if (source === "storage") {
        return "Storage upload blocked by Supabase RLS policy. Run hostel-frontend/supabase_storage_policies.sql in Supabase SQL Editor."
      }
      return "Insert blocked by Supabase RLS policy. Add an INSERT policy for table complaints."
    }

    return `${message}${details}`
  }

  // Upload image to Supabase Storage
  const uploadImage = async () => {
    if (!supabase) return { fileName: null, error: null }

    if (!file) return { fileName: null, error: null }

    const fileName = Date.now() + "_" + file.name

    const { error } = await supabase.storage
      .from("complaint-images")
      .upload(fileName, file)

    if (error) {
      return { fileName: null, error }
    }

    return { fileName, error: null }
  }

  // Submit complaint
  const submitComplaint = async () => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    if (!name.trim() || !room.trim() || !type.trim() || !desc.trim()) {
      setSubmitError("Please fill all fields before submitting.")
      return
    }

    setSubmitting(true)
    setSubmitError("")

    try {
      const { fileName, error: uploadError } = await uploadImage()
      let uploadWarning = ""

      if (uploadError) {
        uploadWarning = `Image was skipped: ${getReadableError(uploadError, "storage")}`
      }

      const roomValue = Number(room.trim())

      const payload = {
        student_name: name.trim(),
        room_number: Number.isNaN(roomValue) ? room.trim() : roomValue,
        complaint_type: type.trim(),
        description: desc.trim(),
      }

      if (fileName) {
        payload.image = fileName
      }

      const { error } = await supabase
        .from("complaints")
        .insert([payload])

      if (error) {
        setSubmitError(getReadableError(error, "complaints"))
      } else {
        alert("Complaint submitted successfully")
        if (uploadWarning) {
          setSubmitError(uploadWarning)
        }

        setName("")
        setRoom("")
        setType("")
        setDesc("")
        setFile(null)
      }
    } catch (error) {
      setSubmitError(getReadableError(error))
    } finally {
      setSubmitting(false)
    }

  }

  return (
    <div className="form-wrap">
      <div className="section-head">
        <p className="eyebrow">Student Desk</p>
        <h2>File a New Complaint</h2>
      </div>
      {!hasSupabaseConfig && (
        <p className="error-text">
          Configure Supabase in <code>hostel-frontend/.env</code>:
          <code> VITE_SUPABASE_URL </code> and
          <code> VITE_SUPABASE_ANON_KEY</code>.
        </p>
      )}

      {submitError && <p className="error-text">{submitError}</p>}

      <div className="form-grid">
        <input
          placeholder="Student Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Room Number"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        <input
          placeholder="Complaint Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        />

        <textarea
          placeholder="Complaint Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
        />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <button className="btn" onClick={submitComplaint} disabled={!hasSupabaseConfig || submitting}>
        {submitting ? "Submitting..." : "Submit Complaint"}
      </button>
    </div>
  )
}

export default ComplaintForm
