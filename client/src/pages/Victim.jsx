import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api/axios'
import { getWeatherByCoords, getLocationName, getWeatherIcon } from '../utils/weather'

const DISASTERS = ['Earthquake','Fire','Tsunami','Flood','Cyclone','Landslide','Pandemic','Other']
const RESOURCES = ['Food','Water','Clothes','Medical','Shelter','Rescue','Transport','Communication']
const RES_ICONS = {
  Food: '🍱',
  Water: '💧',
  Clothes: '👕',
  Medical: '🩺',
  Shelter: '🏠',
  Rescue: '🚑',
  Transport: '🛻',
  Communication: '📡'
}

export default function Victim(){
  const users = JSON.parse(localStorage.getItem('users')||'{}')
  const user = users['victim']
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: user?.location || '',
    disasterType: 'Earthquake',
    resourcesNeeded: [],
    description: '',
    otherType: '',
    extraResources: '',
    coordinates: null,
    weather: null
  })
  const [myRequests, setMyRequests] = useState([])
  const [precautions, setPrecautions] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ status: 'all', type: 'all' })
  const [reviewTarget, setReviewTarget] = useState(null)
  const [review, setReview] = useState({ rating: 5, feedback: '' })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(()=>{ loadMine() },[])
  useEffect(()=>{ fetchPrecautions(form.disasterType) },[form.disasterType])

  async function loadMine(){
    try{ const {data} = await api.get('/victims/me'); setMyRequests(data) }catch(e){ console.error(e); }
  }

  async function fetchPrecautions(type){
    try{ const {data} = await api.get(`/victims/precautions/${type}`); setPrecautions(data.precautions) }catch(e){ setPrecautions([]) }
  }

  function toggleResource(r){
    setForm(f=> ({...f, resourcesNeeded: f.resourcesNeeded.includes(r) ? f.resourcesNeeded.filter(x=>x!==r) : [...f.resourcesNeeded, r]}))
  }

  async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const locationName = await getLocationName(latitude, longitude);
            const weatherData = await getWeatherByCoords(latitude, longitude);
            
            setForm(prev => ({
              ...prev,
              location: locationName,
              coordinates: { lat: latitude, lng: longitude },
              weather: weatherData
            }));
            
            resolve({ latitude, longitude, locationName, weather: weatherData });
          } catch (error) {
            console.error('Error getting location data:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    
    try {
      // First get the current location
      await getCurrentLocation();
      
      // Then submit the form with the updated location and weather data
      const payload = { 
        ...form,
        timestamp: new Date().toISOString()
      };
      
      if (payload.disasterType === 'Other' && payload.otherType.trim()) {
        payload.disasterType = payload.otherType.trim();
      }
      
      if (payload.extraResources.trim()) {
        const extras = payload.extraResources.split(',').map(s => s.trim()).filter(Boolean);
        payload.resourcesNeeded = Array.from(new Set([...(payload.resourcesNeeded || []), ...extras]));
      }
      
      const { data } = await api.post('/victims/requests', payload);
      setForm(f => ({ ...f, description: '', extraResources: '' }));
      await loadMine();
      alert('Request submitted with your current location and weather data');
    } catch (err) {
      console.error('Submission error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to submit request';
      alert(errorMessage);
    } finally { 
      setLoading(false); 
    }
  }

  function openReview(req){
    setReviewTarget(req)
    setReview({ rating: 5, feedback: '' })
  }

  async function submitReview(){
    if(!reviewTarget) return
    try{
      await api.post(`/victims/requests/${reviewTarget._id}/review`, { rating: review.rating, feedback: review.feedback })
      setReviewTarget(null)
      await loadMine()
    }catch(e){ alert(e.response?.data?.error || e.message) }
  }

  return (
    <div className="page-bg victim">
      <div className="overlay-scrim">
      <div className="container">
      <style>{`
        .hotline-sidebar{position:fixed;left:16px;top:140px;width:320px;max-width:90vw;background:#fff;border:1px solid rgba(34,50,91,0.15);border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);color:#0f172a;font-family: Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif;transform:translateX(0);transition:transform .25s ease, opacity .25s ease;z-index:1000}
        .hotline-sidebar.hidden{transform:translateX(-110%);opacity:.0}
        .hotline-header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid rgba(34,50,91,0.08)}
        .hotline-title{font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px}
        .hotline-toggle{position:absolute;left:8px;top:8px;background:#f1f5f9;border:none;border-radius:8px;width:32px;height:32px;font-size:16px;line-height:32px;cursor:pointer;color:#0f172a}
        .hotline-body{padding:12px 14px}
        .hotline-table{width:100%;border-collapse:separate;border-spacing:0 6px;font-size:13px}
        .hotline-table th{font-weight:700;text-align:left;color:#0f172a;padding:6px 8px}
        .hotline-table td{padding:8px;border-top:1px solid rgba(15,23,42,.06);border-bottom:1px solid rgba(15,23,42,.06);background:#f8fafc}
        .hotline-service{font-weight:600}
        .hotline-tel a{color:#0b5fff;text-decoration:none}
        .hotline-tel a:hover{text-decoration:underline}
        .hotline-footer{padding:10px 14px;font-size:11px;color:#64748b;border-top:1px solid rgba(34,50,91,0.08)}
        .sos-btn{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:9999px;background:#ef4444;color:#fff;font-weight:800;border:none;box-shadow:0 12px 24px rgba(239,68,68,.4);cursor:pointer;z-index:1100;transition:transform .2s ease, box-shadow .2s ease}
        .sos-btn:hover{transform:translateY(-2px);box-shadow:0 16px 28px rgba(239,68,68,.5)}
        @media (max-width: 991px){
          .hotline-sidebar{top:90px;left:12px;right:12px;width:auto}
        }
      `}</style>

      <button className="sos-btn" onClick={()=>setSidebarOpen(true)}>SOS</button>

      <div className={"hotline-sidebar "+(sidebarOpen?"":"hidden")}>
        <button className="hotline-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
        <div className="hotline-header">
          <div className="hotline-title">📞 Emergency Hotline Numbers</div>
        </div>
        <div className="hotline-body">
          <table className="hotline-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Number</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="hotline-service">National Disaster Management Authority (NDMA)</td>
                <td className="hotline-tel"><a href="tel:1078">1078</a></td>
                <td>Central disaster helpline</td>
              </tr>
              <tr>
                <td className="hotline-service">NDRF (National Disaster Response Force)</td>
                <td className="hotline-tel"><a href="tel:+911124363260">011-24363260</a> / <a href="tel:1078">1078</a></td>
                <td>Disaster rescue operations</td>
              </tr>
              <tr>
                <td className="hotline-service">Fire / Rescue / Medical Emergency</td>
                <td className="hotline-tel"><a href="tel:101">101</a> / <a href="tel:108">108</a></td>
                <td>General emergency assistance</td>
              </tr>
              <tr>
                <td className="hotline-service">Police</td>
                <td className="hotline-tel"><a href="tel:100">100</a></td>
                <td>Law and safety emergencies</td>
              </tr>
              <tr>
                <td className="hotline-service">Coastal Guard / Marine Rescue</td>
                <td className="hotline-tel"><a href="tel:1554">1554</a></td>
                <td>Coastal & cyclone response</td>
              </tr>
              <tr>
                <td className="hotline-service">State Disaster Management Helpline (Karnataka Example)</td>
                <td className="hotline-tel"><a href="tel:1070">1070</a> / <a href="tel:104">104</a></td>
                <td>State-level support</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="hotline-footer">In case of emergencies, contact the nearest disaster management authority immediately.</div>
      </div>

      <div className="float-wrap">
      <div className="card">
        <h2 style={{marginTop:0}}>Request Help</h2>
        <div className="grid">
          <form onSubmit={submit} className="grid">
            <div className="grid two">
              <div>
                <label className="small">Name</label>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
              </div>
              <div>
                <label className="small">Email</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
              </div>
            </div>
            <div className="grid two">
              <div>
                <label className="small">Phone</label>
                <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} />
              </div>
              <div>
                <div className="form-group">
                  <label>Location</label>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <input 
                      type="text" 
                      value={form.location} 
                      onChange={e => setForm({...form, location: e.target.value})} 
                      placeholder="Your current location will be detected"
                      required 
                      style={{flex: 1}}
                    />
                    <button 
                      type="button" 
                      onClick={getCurrentLocation}
                      style={{
                        padding: '0 12px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📍 Get My Location
                    </button>
                  </div>
                  {form.weather && (
                    <div style={{marginTop: '8px', fontSize: '0.9em', display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <img 
                        src={getWeatherIcon(form.weather.weather?.[0]?.icon)} 
                        alt={form.weather.weather?.[0]?.description}
                        style={{width: '30px', height: '30px'}}
                      />
                      <span>
                        {Math.round(form.weather.main?.temp)}°C, {form.weather.weather?.[0]?.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid two">
              <div>
                <label className="small">Type of Disaster</label>
                <select value={form.disasterType} onChange={e=>setForm({...form, disasterType:e.target.value})}>
                  {DISASTERS.map(d=> <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            {form.disasterType==='Other' && (
              <div>
                <label className="small">Specify Disaster Type</label>
                <input value={form.otherType} onChange={e=>setForm({...form, otherType:e.target.value})} placeholder="Enter disaster type" />
              </div>
            )}
            <div>
              <label className="small">Resources Needed</label>
              <div className="resource-grid grid four">
                {RESOURCES.map(r=> (
                  <label key={r} className="badge" style={{cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6}}>
                    <input type="checkbox" checked={form.resourcesNeeded.includes(r)} onChange={()=>toggleResource(r)} />
                    <span>{RES_ICONS[r]||'🧩'}</span>
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <div style={{marginTop:8}}>
                <label className="small">Extra resources (comma separated)</label>
                <input value={form.extraResources} onChange={e=>setForm({...form, extraResources:e.target.value})} placeholder="e.g., Baby food, Blankets" />
              </div>
            </div>
            <div>
              <label className="small">Describe your situation</label>
              <textarea rows={4} value={form.description} onChange={e=>setForm({...form, description:e.target.value})}/>
            </div>
            <button disabled={loading}>{loading?'Submitting...':'Submit Request'}</button>
          </form>
        </div>
        <div className="hr"/>
        <h3>Precautions</h3>
        <ul className="precautions-list">
          {precautions.map((p,i)=> <li key={i} className="small">{p}</li>)}
        </ul>
      </div>
      <div className="card" style={{marginTop:24}}>
        <h2 style={{marginTop:0}}>My Requests & Volunteers Response</h2>
        <div className="grid two" style={{margin:'8px 0 16px'}}>
          <div>
            <label className="small">Filter by Status</label>
            <select value={filters.status} onChange={e=>setFilters({...filters, status:e.target.value})}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="small">Filter by Disaster</label>
            <select value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}>
              <option value="all">All</option>
              {DISASTERS.map(d=> <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="list">
          {myRequests
            .filter(r => filters.status==='all' || r.status===filters.status)
            .filter(r => filters.type==='all' || r.disasterType===filters.type)
            .map(req=> (
            <div key={req._id} className="card" style={{padding:12}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <strong>🛟 {req.disasterType}</strong> · <span className="small">{req.status}</span> {req.status==='completed' && <span className="badge" title="Completed">✔</span>}
                </div>
                <div>
                  {req.resourcesNeeded?.map(r=> <span key={r} className="badge">{r}</span>)}
                </div>
              </div>
              <div className="small" style={{marginTop:6}}>Location: {req.location || 'N/A'} | Phone: {req.phone || 'N/A'}</div>
              {req.etaMinutes ? <div className="small">ETA: {req.etaMinutes} min</div> : null}
              <div className="hr"/>
              <div>
                <strong>Volunteers response</strong>
                <ul>
                  {req.responses?.length ? req.responses.map((r,idx)=> (
                    <li key={idx} className="small">{r.message} {r.etaMinutes?`(ETA ${r.etaMinutes}m)`:''}</li>
                  )) : <li className="small">No responses yet.</li>}
                </ul>
                {req.status==='completed' && !req.review && (
                  <div style={{marginTop:8}}>
                    <button onClick={()=>openReview(req)}>Leave a review ⭐</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      {reviewTarget && (
        <div className="modal-backdrop" onClick={()=>setReviewTarget(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Task completed! ✅</h3>
            <p className="small">Please rate your experience and leave feedback for volunteers. This will appear in "Volunteers response".</p>
            <div style={{display:'flex',gap:8,margin:'8px 0'}}>
              {[1,2,3,4,5].map(n=> (
                <button key={n} className={n<=review.rating?'' :'secondary'} onClick={()=>setReview({...review, rating:n})}>⭐</button>
              ))}
            </div>
            <div>
              <label className="small">Feedback</label>
              <textarea rows={4} value={review.feedback} onChange={e=>setReview({...review, feedback:e.target.value})} />
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:12}}>
              <button className="secondary" onClick={()=>setReviewTarget(null)}>Cancel</button>
              <button onClick={submitReview}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      </div>
      </div>
    </div>
  )
}
