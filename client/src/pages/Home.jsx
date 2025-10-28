import React from 'react'
import { useNavigate } from 'react-router-dom'
import './home.css'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="home-bg">
      <div className="overlay">
        <h1>Welome to Hope In Cricis</h1>
        <p>Your safety matters. Choose your role to continue.</p>
        <div className="choices">
          <button onClick={() => navigate('/auth/victim')}>Victim</button>
          <button onClick={() => navigate('/auth/volunteer')} className="secondary">Volunteer</button>
        </div>
      </div>
    </div>
  )
}
