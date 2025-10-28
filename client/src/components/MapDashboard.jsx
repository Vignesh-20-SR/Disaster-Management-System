import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'

const FALLBACK_URL = '/disasters_2024-10-15_to_2025-10-14.geojson'
const LATEST_URL = '/disasters_latest.geojson'

const TYPE_COLORS = {
  Earthquake: '#e11d48',
  Flood: '#3b82f6',
  Wildfire: '#22c55e',
  'Storm (Cyclone)': '#f59e0b',
  'Storm (Hurricane)': '#f97316',
  Landslide: '#a855f7',
  Drought: '#b45309',
  'Volcanic Eruption': '#ef4444',
  Heatwave: '#f43f5e',
  Other: '#64748b'
}

function getColor(type){
  return TYPE_COLORS[type] || TYPE_COLORS.Other
}

export default function MapDashboard(){
  const mapRef = useRef(null)
  const mapObj = useRef(null)
  const layerRef = useRef(null)

  const [raw, setRaw] = useState(null)
  const [country, setCountry] = useState('World')
  const [type, setType] = useState('All')
  const [month, setMonth] = useState('All')

  useEffect(()=>{
    async function load(){
      try{
        const r = await fetch(`${LATEST_URL}?v=${Date.now()}`, { cache: 'no-store' })
        if(r.ok){ setRaw(await r.json()); return }
        throw new Error('latest not found')
      }catch{
        try{
          const r2 = await fetch(`${FALLBACK_URL}?v=${Date.now()}`, { cache: 'no-store' })
          if(r2.ok){ setRaw(await r2.json()); return }
        }catch(e){ console.error(e) }
      }
    }
    load()
  },[])

  const countries = useMemo(()=>{
    if(!raw) return []
    const s = new Set(raw.features.map(f=>f.properties.country))
    return Array.from(s).sort()
  },[raw])

  const months = useMemo(()=>{
    if(!raw) return []
    const s = new Set(raw.features.map(f=>f.properties.date.slice(0,7))) // YYYY-MM
    return Array.from(s).sort()
  },[raw])

  const types = useMemo(()=>{
    if(!raw) return []
    const s = new Set(raw.features.map(f=>f.properties.disaster_type))
    return Array.from(s).sort()
  },[raw])

  const features = useMemo(()=>{
    if(!raw) return []
    return raw.features.filter(f=>{
      const p = f.properties
      if(country !== 'World' && p.country !== country) return false
      if(type !== 'All' && p.disaster_type !== type) return false
      if(month !== 'All' && !p.date.startsWith(month)) return false
      return true
    })
  },[raw,country,type,month])

  const totals = useMemo(()=>{
    let pop=0, deaths=0, damages=0
    for(const f of features){
      const p=f.properties
      pop += Number(p.affected_population||0)
      deaths += Number(p.deaths||0)
      damages += Number(p.damages_usd||0)
    }
    return {pop, deaths, damages}
  },[features])

  useEffect(()=>{
    if(!mapRef.current) return
    if(!mapObj.current){
      mapObj.current = L.map(mapRef.current, { center: [20,0], zoom: 2, worldCopyJump: true })
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapObj.current)
    }
  },[])

  useEffect(()=>{
    if(!mapObj.current) return
    if(layerRef.current){ layerRef.current.remove() }
    if(!features || features.length===0){ return }

    const geojson = {
      type: 'FeatureCollection',
      features
    }

    layerRef.current = L.geoJSON(geojson, {
      pointToLayer: (feature, latlng) => {
        const color = getColor(feature.properties.disaster_type)
        return L.circleMarker(latlng, {
          radius: 6,
          color,
          fillColor: color,
          fillOpacity: 0.6,
          weight: 1
        })
      },
      onEachFeature: (feature, layer)=>{
        const p = feature.properties
        const html = `
          <div style="min-width:240px">
            <strong>${p.disaster_type}</strong><br/>
            <span>${p.country} · ${p.region||''}</span><br/>
            <span>${p.date}</span>
            <hr/>
            <div style="font-size:12px;">
              <div>Affected: ${p.affected_population?.toLocaleString?.() || p.affected_population}</div>
              <div>Deaths: ${p.deaths?.toLocaleString?.() || p.deaths}</div>
              <div>Damage: $${p.damages_usd?.toLocaleString?.() || p.damages_usd}</div>
            </div>
            <div style="margin-top:6px;font-size:12px;color:#94a3b8">${p.description||''}</div>
          </div>
        `
        layer.bindPopup(html)
      }
    }).addTo(mapObj.current)

    try{
      const g = L.featureGroup(layerRef.current.getLayers())
      mapObj.current.fitBounds(g.getBounds().pad(0.3), { animate: true, maxZoom: 5 })
    }catch{}
  },[features])

  return (
    <div className="grid" style={{gap:12}}>

      <div className="grid three">
        <div>
          <label className="small">Country</label>
          <select value={country} onChange={e=>setCountry(e.target.value)}>
            <option value="World">World</option>
            {countries.map(c=> <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="small">Month</label>
          <select value={month} onChange={e=>setMonth(e.target.value)}>
            <option value="All">All</option>
            {months.map(m=> <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="small">Disaster Type</label>
          <select value={type} onChange={e=>setType(e.target.value)}>
            <option value="All">All</option>
            {types.map(t=> <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <strong>Totals</strong>
          <div className="small">Events shown: {features.length} / {raw?.features?.length || 0}</div>
          <div className="small">Affected: {totals.pop.toLocaleString()}</div>
          <div className="small">Deaths: {totals.deaths.toLocaleString()}</div>
          <div className="small">Damages: ${totals.damages.toLocaleString()}</div>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {['Earthquake','Flood','Wildfire','Storm (Cyclone)','Storm (Hurricane)','Landslide','Drought','Volcanic Eruption','Heatwave'].map(t=> (
            <span key={t} className="badge" style={{background:getColor(t), color:'#0b1220', fontWeight:700}}>{t}</span>
          ))}
        </div>
      </div>

      <div id="map" ref={mapRef} style={{height: 480, width:'100%', borderRadius: 16, overflow:'hidden', border:'1px solid rgba(34,50,91,0.6)'}}/>
    </div>
  )
}

