import { useState, useEffect } from 'react';

export default function ContactScreen({ onBack }) {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const isProduction = window.location.protocol === 'https:';
    const API_URL = import.meta.env.VITE_API_URL || (isProduction
        ? `https://${window.location.hostname.replace('frontend', 'backend')}/api`
        : 'http://localhost:3001/api');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.subject || !form.message) {
            setError('All fields are required');
            return;
        }
        setSending(true); setError('');
        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setSent(true);
                setForm({ name: '', email: '', subject: '', message: '' });
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to send');
            }
        } catch { setError('Failed to send. Try again.'); }
        finally { setSending(false); }
    };

    return (
        <div className="screen fade-in" style={{
            padding: 'var(--sp-4)', paddingTop: '64px',
            justifyContent: 'flex-start',
        }}>
            <div style={{ maxWidth: '520px', width: '100%', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                    <h1 style={{
                        fontFamily: 'var(--f-mono)', fontSize: 'clamp(1rem, 4vw, 1.4rem)',
                        fontWeight: 800, letterSpacing: '4px',
                        color: 'var(--c-primary-l)', marginBottom: 'var(--sp-2)',
                    }}>
                        SUPPORT
                    </h1>
                    <p style={{ color: 'var(--c-text-off)', fontSize: '0.8rem' }}>
                        Feedback, bug reports, or just saying hi
                    </p>
                </div>

                <div className="panel" style={{ padding: 'var(--sp-6)' }}>
                    {sent ? (
                        <div style={{
                            textAlign: 'center', padding: 'var(--sp-8)',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: 'rgba(52,211,153,0.1)',
                                border: '2px solid var(--c-green)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto var(--sp-4)', fontSize: '1.3rem', color: 'var(--c-green)',
                            }}>&#10003;</div>
                            <h3 style={{ color: 'var(--c-green)', marginBottom: 'var(--sp-2)', fontWeight: 700 }}>
                                Message Sent
                            </h3>
                            <p style={{ color: 'var(--c-text-dim)', fontSize: '0.85rem', marginBottom: 'var(--sp-5)' }}>
                                We will get back to you soon.
                            </p>
                            <button className="btn2" onClick={() => setSent(false)}>
                                Send Another
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{
                            display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)',
                        }}>
                            <input type="text" placeholder="Your Name" value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="input2" maxLength={100}
                            />
                            <input type="email" placeholder="Your Email" value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="input2" maxLength={200}
                            />
                            <input type="text" placeholder="Subject" value={form.subject}
                                onChange={e => setForm({ ...form, subject: e.target.value })}
                                className="input2" maxLength={200}
                            />
                            <textarea placeholder="Your Message" value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                rows={5} maxLength={2000}
                                className="input2"
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />

                            {error && (
                                <p style={{ color: 'var(--c-red)', fontSize: '0.8rem', margin: 0 }}>{error}</p>
                            )}

                            <button type="submit" className="btn2 btn2--primary btn2--block btn2--lg" disabled={sending}>
                                {sending ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>

                <button className="btn2 btn2--ghost btn2--block" onClick={onBack}
                    style={{ marginTop: 'var(--sp-4)' }}
                >
                    Back to Hub
                </button>
            </div>
        </div>
    );
}
