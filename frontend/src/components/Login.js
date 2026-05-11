import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login(){
  const [form,setForm] = useState({ email:"", password:"" });
  const [err,setErr] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      const res = await axios.post("http://localhost:5000/api/users/login", form);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setErr("");
      navigate("/chat");
    }catch(err){
      setErr(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><h2>Welcome back</h2><div className="small">Sign in to continue</div></div>
          <div className="logo">CB</div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="input-field">
            <input required type="email" placeholder="Email" value={form.email}
              onChange={(e)=>setForm({...form,email:e.target.value})} />
          </div>

          <div className="input-field">
            <input required type="password" placeholder="Password" value={form.password}
              onChange={(e)=>setForm({...form,password:e.target.value})} />
          </div>

          {err && <div style={{color:"#ffb4b4",fontSize:13}}>{err}</div>}

          <button className="btn btn-primary" type="submit">Sign in</button>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div className="small">New here? <Link to="/register">Create account</Link></div>
            <div className="small">Forgot password?</div>
          </div>
        </form>
      </div>
    </div>
  );
}
