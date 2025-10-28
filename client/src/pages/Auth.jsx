import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/axios'

export default function Auth() {
  const { role } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: '' })
  const isVictim = role === 'victim'

  const title = useMemo(() => `${mode === 'login' ? 'Login' : 'Register'} as ${role}`, [mode, role])

  useEffect(()=>{
    try{
      const tokens = JSON.parse(localStorage.getItem('tokens')||'{}')
      const users = JSON.parse(localStorage.getItem('users')||'{}')
      if(tokens[role] && users[role]){
        navigate(isVictim?'/victim':'/volunteer', { replace: true })
      }
    }catch{}
  },[role])

  async function submit(e){
    e.preventDefault()
    try{
      if(mode==='register'){
        const { data } = await api.post('/auth/register', { ...form, role })
        const tokens = JSON.parse(localStorage.getItem('tokens')||'{}')
        const users = JSON.parse(localStorage.getItem('users')||'{}')
        tokens[role] = data.token
        users[role] = data.user
        localStorage.setItem('tokens', JSON.stringify(tokens))
        localStorage.setItem('users', JSON.stringify(users))
        localStorage.setItem('currentRole', role)
      } else {
        const { data } = await api.post('/auth/login', { email: form.email, password: form.password })
        const tokens = JSON.parse(localStorage.getItem('tokens')||'{}')
        const users = JSON.parse(localStorage.getItem('users')||'{}')
        tokens[role] = data.token
        users[role] = data.user
        localStorage.setItem('tokens', JSON.stringify(tokens))
        localStorage.setItem('users', JSON.stringify(users))
        localStorage.setItem('currentRole', role)
      }
      navigate(isVictim ? '/victim' : '/volunteer')
    }catch(err){
      alert(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className={`page-bg auth ${isVictim?'victim':'volunteer'}`}>
      <div className="overlay-scrim">
      <div className="container">
      <div className="card elevated" style={{maxWidth:640, margin:'40px auto'}}>
        <h2 style={{marginTop:0}}>{title}</h2>
        <div className="hr"/>
        <div style={{display:'flex', gap:12, marginBottom:16}}>
          <button className={mode==='login'?'':'secondary'} onClick={()=>setMode('login')}>Login</button>
          <button className={mode==='register'?'':'secondary'} onClick={()=>setMode('register')}>Register</button>
        </div>
        <form className="grid" onSubmit={submit}>
          {mode==='register' && (
            <>
              <div>
                <label className="small">Name</label>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
              </div>
              <div className="grid two">
                <div>
                  <label className="small">Phone</label>
                  <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
                </div>
                <div>
                  <label className="small">Location</label>
                  <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} />
                </div>
              </div>
            </>
          )}
          <div>
            <label className="small">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
          </div>
          <div>
            <label className="small">Password</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required />
          </div>
          <button type="submit">{mode==='login'?'Login':'Create account'}</button>
        </form>
        <div style={{marginTop:16}}>
          <button className="secondary" onClick={()=>navigate('/')}>Back</button>
        </div>
      </div>
      </div>
      </div>
    </div>
  )
}
