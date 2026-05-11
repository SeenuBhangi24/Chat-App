import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const socket = io("http://localhost:5000");

export default function ChatBox(){
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem("user") || "null");
  const [user, setUser] = useState(stored);
  const [selectedUser, setSelectedUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");
  const [online, setOnline] = useState([]);
  const [typing, setTyping] = useState("");
  const scrollRef = useRef();

  useEffect(()=>{
    if(!user) return navigate("/");

    socket.on("connect", () => {
      console.log("socket connected:", socket.id);
      socket.emit("setup", { userId: user.id });
    });

    socket.on("receiveMessage", (data) => {
      console.log("receiveMessage", data);
      if (!room || data.room === room) {
        setMessages(prev => [...prev, data]);
        setTimeout(()=> scrollRef.current?.scrollIntoView({behavior:"smooth"}), 60);
      }
    });

    socket.on("userTyping", (name) => {
      setTyping(name);
      setTimeout(()=> setTyping(""), 1200);
    });

    socket.on("onlineUsers", (users) => {
      setOnline(users);
    });

    return ()=> {
      socket.off("connect");
      socket.off("receiveMessage");
      socket.off("userTyping");
      socket.off("onlineUsers");
    };
  }, [user, room, navigate]);

  // demo user list: in production fetch from backend /api/users
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // fetch user list (simple demo: get users via API if you implement)
    async function loadUsers() {
      try {
        // if you add endpoint to list all users, replace below line
        // const res = await axios.get("http://localhost:5000/api/users/all");
        // setUsers(res.data);
        // temp demo: include current user plus sample others if no endpoint
        setUsers([
          ...(user ? [user] : []), 
          { id: "demo_u1", name: "Alice" }, 
          { id: "demo_u2", name: "Bob" }
        ]);
      } catch (err) {
        console.error("failed to load users", err);
      }
    }
    loadUsers();
  }, [user]);

  const openChatWith = async (otherUser) => {
    if (!user?.id || !otherUser?.id) {
      alert("Missing user ids. Make sure login stores user.id from backend.");
      return;
    }
    const roomId = [user.id, otherUser.id].sort().join("_");
    setSelectedUser(otherUser);
    setRoom(roomId);
    console.log("joining room", roomId);
    socket.emit("joinRoom", roomId);

    try {
      const res = await axios.get(`http://localhost:5000/api/messages?room=${encodeURIComponent(roomId)}`);
      setMessages(res.data || []);
      setTimeout(()=> scrollRef.current?.scrollIntoView({behavior:"smooth"}), 60);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const sendMessage = () => {
    if (!msg.trim()) return;
    if (!room) return alert("Select a user to chat with first.");
    const payload = { room, senderId: user.id, senderName: user.name, message: msg.trim() };
    console.log("emit privateMessage", payload);
    socket.emit("privateMessage", payload);

    setMessages(prev => [...prev, { ...payload, time: new Date().toISOString() }]);
    setMsg("");
    setTimeout(()=> scrollRef.current?.scrollIntoView({behavior:"smooth"}), 60);
  };

  const handleTyping = (e) => {
    setMsg(e.target.value);
    if (room && socket.connected) socket.emit("typing", { room, name: user.name });
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="app-shell" style={{height:"80vh"}}>
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">CB</div>
          <div>
            <h3>ChatBase</h3>
            <div className="small">Real-time chat</div>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div className="small">Online</div>
          <div className="badge">{online.length}</div>
        </div>

        <div className="online-list" style={{marginTop:12}}>
          {users.map((u,i)=>(
            <div key={i} className="user-card" onClick={()=>openChatWith(u)} style={{cursor:"pointer"}}>
              <div className="avatar">{u.name.charAt(0)}</div>
              <div className="user-meta">
                <div className="name">{u.name}</div>
                <div className="sub">Click to chat</div>
              </div>
              <div style={{fontSize:12,color:"#86bff6"}}>●</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button className="btn" onClick={()=>{}}>Profile</button>
          <button className="btn" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="chat-area">
        <div className="header">
          <div className="title">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div className="avatar" style={{width:46,height:46,borderRadius:10}}>{user?.name?.charAt(0)}</div>
              <div>
                <h2>{selectedUser ? selectedUser.name : "Select someone to chat"}</h2>
                <div className="small">{selectedUser ? "Private chat" : "Choose a user from left"}</div>
              </div>
            </div>
          </div>
          <div className="actions">
            <button className="btn">Invite</button>
            <button className="btn">Settings</button>
          </div>
        </div>

        <div className="messages" id="messages">
          {messages.length===0 && <div className="day-divider">No messages yet — say hello 👋</div>}
          {messages.map((m, idx) => {
            const isMe = m.senderId === user.id || m.sender === user.name;
            return (
              <div key={idx} className={`msg-row ${isMe ? "msg-me" : ""}`} style={{alignSelf: isMe ? "flex-end" : "flex-start"}}>
                <div className="msg-avatar">{m.sender?.charAt(0)}</div>
                <div>
                  <div className={`bubble ${isMe ? "me" : "other"}`} style={{maxWidth:520}}>
                    <div style={{fontSize:13,fontWeight:700,opacity:0.9,marginBottom:6}}>{m.sender}</div>
                    <div>{m.message}</div>
                  </div>
                  <div className="msg-meta">{new Date(m.time || m.createdAt || Date.now()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>

        <div className="composer">
          <div className="input">
            <button className="icon-btn" title="Attach">📎</button>
            <input placeholder="Type a message..." value={msg} onChange={handleTyping} onKeyDown={(e)=> e.key==="Enter" && sendMessage()} />
            <button className="icon-btn" title="Emoji">😊</button>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button className="btn-primary" onClick={sendMessage}>Send</button>
            <div style={{fontSize:12,color:"var(--muted)",textAlign:"center"}}>
              {typing ? `${typing} is typing...` : "Press Enter to send"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
