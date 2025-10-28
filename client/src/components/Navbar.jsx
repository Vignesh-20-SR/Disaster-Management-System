import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export default function Navbar(){
  const navigate = useNavigate()
  const currentRole = localStorage.getItem('currentRole') || 'victim'
  const users = JSON.parse(localStorage.getItem('users')||'{}')
  const user = users[currentRole]
  function logout(){
    try{
      const tokens = JSON.parse(localStorage.getItem('tokens')||'{}')
      const usersMap = JSON.parse(localStorage.getItem('users')||'{}')
      delete tokens[currentRole]
      delete usersMap[currentRole]
      localStorage.setItem('tokens', JSON.stringify(tokens))
      localStorage.setItem('users', JSON.stringify(usersMap))
      if (!tokens.victim && !tokens.volunteer) {
        localStorage.removeItem('currentRole')
      }
    }catch{}
    navigate('/')
  }
  return (
    <header className="navbar">
      <div className="nav-left" onClick={()=>navigate('/')} role="button" title="Home" aria-label="Home">
        <img src="/Logo.png" alt="Home" width="28" height="28" style={{borderRadius:6, boxShadow:'0 0 0 2px rgba(255,255,255,0.15)'}} />
        <span className="brand">Welome to Hope In Cricis</span>
      </div>
      <nav className="nav-links">
        <NavLink to="/" className={({isActive})=>isActive?'active':''}>Home</NavLink>
        {(() => {
          try{
            const t = JSON.parse(localStorage.getItem('tokens')||'{}')
            const to = t.victim ? '/victim' : '/auth/victim'
            return <NavLink to={to} onClick={()=>localStorage.setItem('currentRole','victim')} className={({isActive})=>isActive?'active':''}>Victim</NavLink>
          }catch{ return <NavLink to="/auth/victim" className={({isActive})=>isActive?'active':''}>Victim</NavLink> }
        })()}
        {(() => {
          try{
            const t = JSON.parse(localStorage.getItem('tokens')||'{}')
            const to = t.volunteer ? '/volunteer' : '/auth/volunteer'
            return <NavLink to={to} onClick={()=>localStorage.setItem('currentRole','volunteer')} className={({isActive})=>isActive?'active':''}>Volunteer</NavLink>
          }catch{ return <NavLink to="/auth/volunteer" className={({isActive})=>isActive?'active':''}>Volunteer</NavLink> }
        })()}
      </nav>
      <div className="nav-right">
        {user ? (
          <>
            <span className="small">{user.name} · {user.role}</span>
            <button className="secondary" onClick={logout} style={{marginLeft:8}}>Logout</button>
          </>
        ) : (
          <span className="small">Not signed in</span>
        )}
      </div>
    </header>
  )
}
