import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register(){
  const [form,setForm] = useState({ name:"", email:"", password:"" });
  const [err,setErr] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      await axios.post("http://localhost:5000/api/users/register", form);
      setErr("");
      navigate("/");
    }catch(e){
      setErr(e.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><h2>Create account</h2><div className="small">Start chatting</div></div>
          <div className="logo">CB</div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="input-field">
            <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          </div>

          <div className="input-field">
            <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
          </div>

          <div className="input-field">
            <input required type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
          </div>

          {err && <div style={{color:"#ffb4b4",fontSize:13}}>{err}</div>}

          <button className="btn btn-primary" type="submit">Create account</button>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div className="small">Already registered? <Link to="/">Sign in</Link></div>
          </div>
        </form>
      </div>
    </div>
  );
}
