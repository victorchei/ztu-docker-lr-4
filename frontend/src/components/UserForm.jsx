import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function UserForm({ onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = { name: name.trim(), email: email.trim() };
      if (!payload.name || !payload.email) throw new Error('Name and email are required');
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create');
      setName('');
      setEmail('');
      if (onCreated) onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} required />
        <button type='submit' disabled={loading}>
          {loading ? '...' : 'Add'}
        </button>
      </div>
      {error && <div className='error'>{error}</div>}
    </form>
  );
}
