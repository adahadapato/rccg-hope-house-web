
import { useState, type CSSProperties, type FormEvent } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiFetch, getApiErrorDetails, getNetworkErrorDetails, WEBSITE_BASE_URL } from '../../api/api';
import '../styles/admin.css';

type SeoContentType = 'Sermon' | 'Event' | 'Devotional' | 'Service';

interface SeoSuggestion {
    seoTitle: string;
    metaDescription: string;
    keywords: string[];
    suggestedHeadings: string[];
    improvements: string[];
    seoScore: number;
    scoreExplanation: string;
}

const site = WEBSITE_BASE_URL;

const checks = [
    { label: 'Robots instructions', detail: 'Published; public access confirmed', url: `${site}/robots.txt`, status: 'Available' },
    { label: 'XML sitemap', detail: 'Published; Google Search Console previously reported a fetch error', url: `${site}/sitemap.xml`, status: 'Review' },
    { label: 'Homepage indexing', detail: 'Indexed in Google; recrawl requested on 10 October 2026', url: 'https://search.google.com/search-console/', status: 'Indexed' },
    { label: 'SEO metadata', detail: 'Homepage metadata drafted; confirm production deployment', url: site, status: 'Verify' },
];

export default function SmartSeo() {
    const [draft, setDraft] = useState('');
    const [kind, setKind] = useState<SeoContentType>('Sermon');
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [suggestion, setSuggestion] = useState<SeoSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function generateSeo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const subject = draft.trim();

        if (!subject || loading) return;

        setLoading(true);
        setError('');
        setSuggestion(null);
        setTitle('');
        setDescription('');

        try {
            const response = await apiFetch('/api/seo/admin/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contentType: kind,
                    topic: subject,
                    content: content.trim() || null
                })
            });

            if (!response.ok) {
                const details = await getApiErrorDetails(
                    response,
                    'Unable to generate SEO recommendations. Please try again.'
                );

                setError(details.message);
                return;
            }

            const result = (await response.json()) as SeoSuggestion;

            setSuggestion(result);
            setTitle(result.seoTitle);
            setDescription(result.metaDescription);
        } catch (err) {
            const details = getNetworkErrorDetails(err);
            setError(details.message);
        } finally {
            setLoading(false);
        }
    }

    const panel: CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 20 };
    const input: CSSProperties = { display: 'block', width: '100%', maxWidth: 720, padding: 12, margin: '8px 0 16px', border: '1px solid #cbd5e1', borderRadius: 8, font: 'inherit', boxSizing: 'border-box' };
    const button: CSSProperties = { background: '#173f74', color: '#fff', padding: '12px 20px', border: 0, borderRadius: 8, font: 'inherit', fontWeight: 600 };

    return (
        <AdminLayout>
            <main style={{ padding: '24px clamp(12px, 2vw, 32px)', color: '#17243a', fontFamily: 'inherit' }}>
                <h1 style={{ fontSize: 30, marginBottom: 8 }}>Smart SEO Management</h1>
                <p style={{ color: '#526174', marginBottom: 28 }}>SEO foundations, search visibility and AI-assisted content metadata preparation for RCCG Hope House.</p>

                <section style={panel}>
                    <h2 style={{ marginTop: 0 }}>Website SEO status</h2>
                    <p style={{ color: '#64748b' }}>Based on setup checks completed so far. These are not live automated tests.</p>

                    {checks.map(check => (
                        <div key={check.label} style={{ padding: '14px 0', borderTop: '1px solid #e2e8f0' }}>
                            <strong>{check.label}</strong> <span style={{ marginLeft: 8, color: '#64748b' }}>({check.status})</span>
                            <div style={{ marginTop: 4 }}>{check.detail}</div>
                            <a href={check.url} target="_blank" rel="noopener noreferrer">Open resource ↗</a>
                        </div>
                    ))}
                </section>

                <section style={panel}>
                    <h2 style={{ marginTop: 0 }}>AI SEO metadata assistant</h2>
                    <p>Generate SEO recommendations for a sermon, event, devotional or church service. Review all wording before publishing.</p>

                    <form onSubmit={generateSeo}>
                        <label htmlFor="seo-kind">Content type</label>
                        <select
                            id="seo-kind"
                            value={kind}
                            onChange={e => setKind(e.target.value as SeoContentType)}
                            style={input}
                            disabled={loading}
                        >
                            <option value="Sermon">Sermon</option>
                            <option value="Event">Event</option>
                            <option value="Devotional">Devotional</option>
                            <option value="Service">Service</option>
                        </select>

                        <label htmlFor="seo-subject">Content title or topic</label>
                        <input
                            id="seo-subject"
                            style={input}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            placeholder="e.g. Walking in Faith"
                            maxLength={200}
                            required
                            disabled={loading}
                        />

                        <label htmlFor="seo-content">Existing content (optional)</label>
                        <textarea
                            id="seo-content"
                            rows={6}
                            style={input}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Paste the sermon summary, event details, devotional or service description here."
                            maxLength={15000}
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={!draft.trim() || loading}
                            style={{
                                ...button,
                                opacity: !draft.trim() || loading ? 0.6 : 1,
                                cursor: !draft.trim() || loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Generating SEO recommendations...' : 'Generate SEO recommendations'}
                        </button>
                    </form>

                    {error && (
                        <div
                            role="alert"
                            style={{
                                marginTop: 20,
                                padding: 14,
                                border: '1px solid #fecaca',
                                borderRadius: 8,
                                background: '#fef2f2',
                                color: '#991b1b'
                            }}
                        >
                            {error}
                        </div>
                    )}
                </section>

                {suggestion && (
                    <section style={panel}>
                        <h2 style={{ marginTop: 0 }}>Generated SEO recommendations</h2>

                        <div style={{ padding: 20, background: '#f1f5f9', borderRadius: 10, marginBottom: 24 }}>
                            <strong>Estimated SEO score</strong>

                            <div style={{ fontSize: 36, fontWeight: 700, color: '#173f74', marginTop: 8 }}>
                                {suggestion.seoScore}/100
                            </div>

                            <p>{suggestion.scoreExplanation}</p>
                            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 0 }}>
                                This is an AI-generated editorial estimate, not a Google ranking or Search Console score.
                            </p>
                        </div>

                        <label htmlFor="seo-title">Suggested SEO title</label>
                        <input
                            id="seo-title"
                            style={input}
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                        <p style={{ color: '#64748b', marginTop: -8 }}>{title.length} characters</p>

                        <label htmlFor="seo-description">Suggested meta description</label>
                        <textarea
                            id="seo-description"
                            rows={4}
                            style={input}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                        <p style={{ color: '#64748b', marginTop: -8 }}>{description.length} characters</p>

                        <h3>Suggested keywords</h3>

                        {suggestion.keywords?.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {suggestion.keywords.map((keyword, index) => (
                                    <span
                                        key={`${keyword}-${index}`}
                                        style={{
                                            padding: '7px 12px',
                                            background: '#e8eef8',
                                            color: '#173f74',
                                            borderRadius: 20
                                        }}
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p>No keywords were suggested.</p>
                        )}

                        <h3 style={{ marginTop: 28 }}>Suggested headings</h3>

                        {suggestion.suggestedHeadings?.length > 0 ? (
                            <ul>
                                {suggestion.suggestedHeadings.map((heading, index) => (
                                    <li key={index} style={{ marginBottom: 8 }}>{heading}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No headings were suggested.</p>
                        )}

                        <h3 style={{ marginTop: 28 }}>Content improvement recommendations</h3>

                        {suggestion.improvements?.length > 0 ? (
                            <ul>
                                {suggestion.improvements.map((improvement, index) => (
                                    <li key={index} style={{ marginBottom: 10 }}>{improvement}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No additional improvements were suggested.</p>
                        )}

                        <p style={{ color: '#64748b', marginTop: 28, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                            Draft only — changes are not saved or published to the website.
                        </p>
                    </section>
                )}
            </main>
        </AdminLayout>
    );
}
