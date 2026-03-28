export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Aaltoes Food Ordering — Backend API
      </h1>
      <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>
        Backend is running. Co-founder builds the UI on top of these endpoints.
      </p>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>API Endpoints</h2>
      <ul style={{ lineHeight: 2 }}>
        <li><code>POST /api/recommend</code> — Generate food order for an event</li>
        <li><code>GET /api/events</code> — List upcoming events</li>
        <li><code>GET /api/history</code> — Past orders from Supabase</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.5rem' }}>Usage</h2>
      <pre style={{ background: '#1a1a2e', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
{`// Get events
fetch('/api/events').then(r => r.json())

// Generate order
fetch('/api/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event_id: 'evt_abc123' })
}).then(r => r.json())`}
      </pre>
    </main>
  );
}
