import { useState, useEffect, useRef } from 'react';
import { deliveryAPI } from '../services/api';
import { connectSocket } from '../services/socket';
import './TrackingPage.css';

export default function TrackingPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [position, setPosition] = useState(null);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    loadDeliveries();
    socketRef.current = connectSocket();
    socketRef.current.on('delivery_location_update', (data) => {
      setPosition(data.location);
      setProgress(Math.round((data.step / data.steps) * 100));
      setLog(prev => [...prev.slice(-9), `📍 Step ${data.step}/${data.steps} — Lat: ${data.location.lat.toFixed(4)}, Lng: ${data.location.lng.toFixed(4)}`]);
    });
    socketRef.current.on('delivery_completed_tracking', () => {
      setTracking(false);
      setProgress(100);
      setLog(prev => [...prev, '✅ Delivery completed — tanker arrived at destination']);
    });
    return () => {
      socketRef.current?.off('delivery_location_update');
      socketRef.current?.off('delivery_completed_tracking');
    };
  }, []);

  const loadDeliveries = async () => {
    try {
      const res = await deliveryAPI.getAll({ status: 'in-progress' });
      const pending = await deliveryAPI.getAll({ status: 'pending' });
      setDeliveries([...res.data, ...pending.data]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const startSimulation = () => {
    if (!selected) return;
    const startLat = 11.1271 + Math.random() * 0.5;
    const startLng = 78.6569 + Math.random() * 0.5;
    const endLat = selected.village?.location?.lat || 11.35;
    const endLng = selected.village?.location?.lng || 77.73;
    setTracking(true);
    setProgress(0);
    setLog([`🚚 Tanker ${selected.tanker?.vehicleNumber} departed — heading to ${selected.village?.name}`]);
    setPosition({ lat: startLat, lng: startLng });
    socketRef.current?.emit('start_tracking', { deliveryId: selected._id, startLat, startLng, endLat, endLng });
  };

  const stops = position ? [
    { step: 0, label: 'Depot', lat: position.lat + 0.02, lng: position.lng - 0.02, done: progress > 0 },
    { step: 1, label: 'Checkpoint 1', lat: position.lat + 0.01, lng: position.lng + 0.01, done: progress > 33 },
    { step: 2, label: 'Checkpoint 2', lat: position.lat - 0.01, lng: position.lng + 0.02, done: progress > 66 },
    { step: 3, label: selected?.village?.name || 'Destination', lat: position.lat - 0.02, lng: position.lng + 0.03, done: progress >= 100 },
  ] : [];

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Live Delivery Tracking</h1>
        <p>Real-time tanker GPS simulation using Socket.io</p>
      </div>

      <div className="tracking-layout">
        <div className="tracking-sidebar">
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Active Deliveries</h3>
            {deliveries.length === 0 && <div className="empty-state" style={{ padding: '24px' }}><p>No active deliveries</p></div>}
            {deliveries.map(d => (
              <div key={d._id}
                className={`delivery-item ${selected?._id === d._id ? 'delivery-item--active' : ''}`}
                onClick={() => { setSelected(d); setTracking(false); setProgress(0); setLog([]); setPosition(null); }}
              >
                <div className="delivery-item__vehicle">{d.tanker?.vehicleNumber}</div>
                <div className="delivery-item__dest">→ {d.village?.name}</div>
                <div className="delivery-item__qty">{d.quantityScheduledLiters?.toLocaleString()}L</div>
                <span className={`badge ${d.status === 'in-progress' ? 'badge-cyan' : 'badge-yellow'}`}>{d.status}</span>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card">
              <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Tanker Details</h3>
              <div className="detail-row"><span>Vehicle</span><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{selected.tanker?.vehicleNumber}</span></div>
              <div className="detail-row"><span>Destination</span><span>{selected.village?.name}</span></div>
              <div className="detail-row"><span>District</span><span>{selected.village?.district}</span></div>
              <div className="detail-row"><span>Quantity</span><span>{selected.quantityScheduledLiters?.toLocaleString()}L</span></div>
              <div className="detail-row"><span>Driver</span><span>{selected.driver?.name || 'Unassigned'}</span></div>
              {position && <div className="detail-row"><span>Coords</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span></div>}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }} onClick={startSimulation} disabled={tracking}>
                {tracking ? '⟳ Tracking in progress…' : '▶ Start GPS Simulation'}
              </button>
            </div>
          )}
        </div>

        <div className="tracking-main">
          <div className="card map-card">
            <div className="map-header">
              <h3>Route Map — Simulated GPS</h3>
              {tracking && <div className="live-badge">● LIVE</div>}
            </div>

            <div className="map-canvas">
              <svg viewBox="0 0 600 340" width="100%" height="340" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0f1729" />
                    <stop offset="100%" stopColor="#0a1020" />
                  </linearGradient>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="600" height="340" fill="url(#mapGrad)" />
                <rect width="600" height="340" fill="url(#grid)" />

                {/* Roads */}
                {[[50,170,550,170],[300,20,300,320],[50,80,550,260],[150,320,450,20]].map(([x1,y1,x2,y2], i) => (
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
                ))}

                {/* Route line */}
                {stops.length > 0 && (
                  <polyline
                    points={stops.map((s, i) => `${100 + i * 140},${100 + (i % 2 === 0 ? 40 : 120)}`).join(' ')}
                    fill="none"
                    stroke="rgba(59,130,246,0.3)"
                    strokeWidth="2"
                    strokeDasharray="6,4"
                  />
                )}

                {/* Stop markers */}
                {stops.map((s, i) => {
                  const cx = 100 + i * 140;
                  const cy = 100 + (i % 2 === 0 ? 40 : 120);
                  return (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r={s.done ? 14 : 10} fill={s.done ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.15)'} stroke={s.done ? '#22c55e' : '#3b82f6'} strokeWidth="1.5" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fill={s.done ? '#22c55e' : '#94a3b8'} fontSize="10">{i === 3 ? '🏘' : i === 0 ? '🏭' : '◉'}</text>
                      <text x={cx} y={cy + 26} textAnchor="middle" fill="#64748b" fontSize="9">{s.label}</text>
                    </g>
                  );
                })}

                {/* Live tanker */}
                {tracking && stops.length > 0 && (() => {
                  const idx = Math.min(Math.floor(progress / 34), 2);
                  const frac = (progress % 34) / 34;
                  const x1 = 100 + idx * 140, y1 = 100 + (idx % 2 === 0 ? 40 : 120);
                  const x2 = 100 + (idx + 1) * 140, y2 = 100 + ((idx + 1) % 2 === 0 ? 40 : 120);
                  const cx = x1 + (x2 - x1) * frac;
                  const cy = y1 + (y2 - y1) * frac;
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={22} fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.4)" strokeWidth="1">
                        <animate attributeName="r" values="22;30;22" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={cx} cy={cy} r={12} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="2" />
                      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12">🚚</text>
                    </g>
                  );
                })()}

                {!tracking && !position && (
                  <text x="300" y="175" textAnchor="middle" fill="rgba(100,116,139,0.6)" fontSize="14">Select a delivery and start simulation</text>
                )}
              </svg>
            </div>

            {tracking && (
              <div className="progress-bar-wrap">
                <div className="progress-bar-label">
                  <span>Delivery Progress</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{progress}%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Telemetry Log</h3>
            <div className="telemetry-log">
              {log.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No tracking data yet…</div>}
              {log.map((entry, i) => (
                <div key={i} className="telemetry-entry">
                  <span className="telemetry-time">{new Date().toLocaleTimeString()}</span>
                  <span>{entry}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
