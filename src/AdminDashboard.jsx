import { useEffect, useState } from "react"
import { hasSupabaseConfig, supabase } from "./supabaseClient"

function AdminDashboard(){

const [complaints,setComplaints] = useState([])
const [errorMessage, setErrorMessage] = useState("")
const [loading, setLoading] = useState(true)
const [updatingId, setUpdatingId] = useState(null)

useEffect(()=>{

fetchComplaints()

},[])

const fetchComplaints = async () => {
setLoading(true)
if (!hasSupabaseConfig || !supabase) {
setErrorMessage("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in hostel-frontend/.env")
setLoading(false)
return
}

const {data,error} = await supabase
.from("complaints")
.select("*")
.order("id",{ ascending: false })

if(error){
setErrorMessage(error.message)
setLoading(false)
return
}

if(data){
setComplaints(data)
}
setLoading(false)
}

const updateStatus = async (id, status) => {
if(!supabase) return
setUpdatingId(id)
const { error } = await supabase
  .from("complaints")
  .update({ status })
  .eq("id", id)

if(error){
setErrorMessage(error.message)
} else {
setComplaints((prev) =>
  prev.map((item) => (item.id === id ? { ...item, status } : item))
)
}
setUpdatingId(null)
}

return(

<div className="dashboard-wrap">
<div className="section-head">
<p className="eyebrow">Admin Control</p>
<h2>Complaint Dashboard</h2>
</div>

<div className="metric-row">
<div className="metric-card">
<p>Total</p>
<h3>{complaints.length}</h3>
</div>
<div className="metric-card">
<p>Pending</p>
<h3>{complaints.filter((item)=>item.status === "Pending").length}</h3>
</div>
<div className="metric-card">
<p>Resolved</p>
<h3>{complaints.filter((item)=>item.status === "Resolved").length}</h3>
</div>
</div>

{errorMessage && <p className="error-text">{errorMessage}</p>}

{loading && <p className="info-text">Loading complaints...</p>}

{!loading && !errorMessage && complaints.length === 0 && <p className="info-text">No complaints found</p>}

<div className="card-grid">
{complaints.map((item)=>(
<article key={item.id} className="complaint-card">
<div className="complaint-meta">
<h3>{item.student_name}</h3>
<p>Room {item.room_number}</p>
</div>

<p><strong>Issue:</strong> {item.complaint_type}</p>
<p><strong>Description:</strong> {item.description || "No description"}</p>
<p><strong>Status:</strong> {item.status || "Pending"}</p>

<div className="status-actions">
<button
className="btn small"
onClick={()=>updateStatus(item.id, "Pending")}
disabled={updatingId === item.id}
>
Pending
</button>
<button
className="btn small"
onClick={()=>updateStatus(item.id, "In Progress")}
disabled={updatingId === item.id}
>
In Progress
</button>
<button
className="btn small"
onClick={()=>updateStatus(item.id, "Resolved")}
disabled={updatingId === item.id}
>
Resolved
</button>
</div>
</article>
))}
</div>

</div>

)

}

export default AdminDashboard
