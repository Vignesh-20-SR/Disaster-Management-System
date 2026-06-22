import React, { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import MapDashboard from '../components/MapDashboard'
import { api } from '../api/axios'
import { getWeatherIcon } from '../utils/weather'

export default function Volunteer(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [eta, setEta] = useState({})
  const [message, setMessage] = useState({})
  const [resendPrecautions, setResendPrecautions] = useState({})
  const [filters, setFilters] = useState({ status: 'all', type: 'all', q: '' })
  const DISASTERS = ['Earthquake','Fire','Tsunami','Flood','Cyclone','Landslide','Pandemic','Other']

  async function load(){
    try{ setLoading(true); const {data} = await api.get('/volunteers/requests'); setItems(data) }catch(e){ console.error(e) } finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])

  async function accept(id){
    try{ await api.post(`/volunteers/requests/${id}/accept`); await load() }catch(e){ alert(e.response?.data?.error||e.message) }
  }
  async function sendEta(id){
    try{ await api.post(`/volunteers/requests/${id}/eta`, { etaMinutes: Number(eta[id]||0) }); await load() }catch(e){ alert(e.response?.data?.error||e.message) }
  }
  async function sendMsg(id){
    try{ await api.post(`/volunteers/requests/${id}/message`, { message: message[id]||'', resendPrecautions: !!resendPrecautions[id] }); await load() }catch(e){ alert(e.response?.data?.error||e.message) }
  }
  async function complete(id){
    try{ await api.post(`/volunteers/requests/${id}/complete`); await load() }catch(e){ alert(e.response?.data?.error||e.message) }
  }

  return (
    <div className="page-bg volunteer">
      <div className="overlay-scrim">
      <div className="container">
      <div className="float-wrap float-full">
      
      {/* Map Visualization - Moved to top left */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        marginBottom: '16px' 
      }}>
        <div className="card elevated" style={{ width: '100%' }}>
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Disaster Map</h3>
          <div style={{ height: '400px', width: '100%' }}>
            <MapDashboard />
          </div>
        </div>
        
        {/* Status and Filters - Moved below map */}
        <div className="card elevated">
          <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Request Filters</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="small">Status</label>
              <select 
                value={filters.status} 
                onChange={e => setFilters({...filters, status: e.target.value})} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label className="small">Disaster Type</label>
              <select 
                value={filters.type} 
                onChange={e => setFilters({...filters, type: e.target.value})} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="all">All Types</option>
                {DISASTERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex: '2 1 300px' }}>
              <label className="small">Search (name/location/resources)</label>
              <input 
                placeholder="Search..." 
                value={filters.q} 
                onChange={e => setFilters({...filters, q: e.target.value})} 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {loading && <div className="small" style={{ margin: '16px 0' }}>Loading requests...</div>}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
        {items
          .filter(r => filters.status==='all' || r.status===filters.status)
          .filter(r => filters.type==='all' || r.disasterType===filters.type)
          .filter(r => {
            const q = filters.q.trim().toLowerCase();
            if(!q) return true
            const hay = `${r.victim?.name||''} ${r.location||''} ${r.resourcesNeeded?.join(' ')||''} ${r.disasterType}`.toLowerCase()
            return hay.includes(q)
          })
          .map(req=> (
          <div key={req._id} className="card elevated">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <strong>🚨 {req.disasterType}</strong> · <span className="small">{req.status}</span>
              </div>
              <div>
                {req.resourcesNeeded?.map(r=> <span key={r} className="badge">{r}</span>)}
              </div>
            </div>
            <div className="small" style={{marginTop:6}}>
              Victim: {req.victim?.name || 'N/A'} | Email: {req.victim?.email || req.email || 'N/A'} | Phone: {req.victim?.phone || req.phone || 'N/A'}
            </div>
            <div className="small">
              <div>📍 <strong>Location:</strong> {req.location || req.victim?.location || 'N/A'}</div>
              {req.coordinates && (
                <div style={{ marginTop: 4 }}>
                  <a 
                    href={`https://www.google.com/maps?q=${req.coordinates.lat},${req.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    View on Map
                  </a>
                </div>
              )}
              {req.weather && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 4 }}>
                  <img 
                    src={getWeatherIcon(req.weather.weather?.[0]?.icon)} 
                    alt={req.weather.weather?.[0]?.description}
                    style={{ width: '24px', height: '24px' }}
                  />
                  <span>
                    {Math.round(req.weather.main?.temp)}°C, {req.weather.weather?.[0]?.description}
                    {req.weather.wind?.speed && `, Wind: ${req.weather.wind.speed} m/s`}
                  </span>
                </div>
              )}
              {req.timestamp && (
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: 4 }}>
                  Reported: {new Date(req.timestamp).toLocaleString()}
                </div>
              )}
            </div>
            {req.description && <div className="small" style={{ marginTop: 8 }}>📝 <strong>Notes:</strong> {req.description}</div>}
            {req.precautions?.length ? (
              <details style={{marginTop:8}}>
                <summary className="small">Precautions</summary>
                <ul>
                  {req.precautions.map((p,i)=>(<li key={i} className="small">{p}</li>))}
                </ul>
              </details>
            ):null}
            <div className="hr" style={{ margin: '12px 0' }}/>
            <div style={{ marginBottom: 8 }}>
              <div className="small" style={{ fontWeight: 'bold', marginBottom: 4 }}>Required Resources:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {req.resourcesNeeded?.map((r, i) => (
                  <span 
                    key={i} 
                    style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8em',
                      border: '1px solid #bae6fd'
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="hr" style={{ margin: '12px 0' }}/>
            <div className="grid two">
              <button onClick={()=>accept(req._id)} disabled={req.assignedVolunteer && req.status!=='pending'}>
                {req.assignedVolunteer? 'Assigned' : 'Accept'}
              </button>
              <button className="secondary" onClick={()=>complete(req._id)} disabled={req.status==='completed'}>Mark Completed</button>
            </div>
            <div className="grid two" style={{marginTop:12}}>
              <div>
                <label className="small">Send ETA (minutes)</label>
                <div style={{display:'flex', gap:8}}>
                  <input type="number" min="0" value={eta[req._id]||''} onChange={e=>setEta({...eta, [req._id]: e.target.value})} />
                  <button onClick={()=>sendEta(req._id)}>Send</button>
                </div>
              </div>
              <div>
                <label className="small">Message to Victim</label>
                <div style={{display:'flex', gap:8}}>
                  <input value={message[req._id]||''} onChange={e=>setMessage({...message, [req._id]: e.target.value})} placeholder="Custom message" />
                  <button onClick={()=>sendMsg(req._id)}>Send</button>
                </div>
                <label className="small" style={{display:'flex',alignItems:'center',gap:8,marginTop:6}}>
                  <input type="checkbox" checked={!!resendPrecautions[req._id]} onChange={e=>setResendPrecautions({...resendPrecautions,[req._id]: e.target.checked})} /> Resend precautions
                </label>
              </div>
            </div>
            <div className="hr"/>
            <strong>Responses</strong>
            <ul>
              {req.responses?.length ? req.responses.map((r,i)=> <li key={i} className="small">{r.message} {r.etaMinutes?`(ETA ${r.etaMinutes}m)`:''}</li>) : <li className="small">No responses yet.</li>}
            </ul>
          </div>
        ))}
      </div>
      </div>
      </div>
      </div>
    </div>
  )
}
