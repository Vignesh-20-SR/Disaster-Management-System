import axios from 'axios'

export const api = axios.create({
  baseURL: 'https://disaster-management-system-backend-na43.onrender.com/api',
})

function getRoleFromPath(){
  const p = window.location.pathname
  if (p.startsWith('/volunteer') || p.startsWith('/auth/volunteer')) return 'volunteer'
  if (p.startsWith('/victim') || p.startsWith('/auth/victim')) return 'victim'
  const currentRole = localStorage.getItem('currentRole')
  return currentRole || 'victim'
}

function getToken(){
  const role = getRoleFromPath()
  try{
    const tokens = JSON.parse(localStorage.getItem('tokens')||'{}')
    return tokens[role] || null
  }catch{ return null }
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
