import { useState, type FormEvent } from 'react';
import AdminLayout from '../components/AdminLayout';
import { apiFetch, getApiErrorDetails, getNetworkErrorDetails, WEBSITE_BASE_URL } from '@/api/api';
import '../styles/admin.css';
import '../styles/smart-seo.css';

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

// These reflect previous manual checks; they are not live monitoring results.
const checks = [
    { label: 'Robots instructions', detail: 'Previously confirmed accessible', url: `${site}/robots.txt`, status: 'Available', tone: 'good' },
    { label: 'XML sitemap', detail: 'Google Search Console previously reported a fetch error', url: `${site}/sitemap.xml`, status: 'Review', tone: 'warn' },
    { label: 'Homepage indexing', detail: 'Previously indexed; recrawl requested on 10 October 2026', url: 'https://search.google.com/search-console/', status: 'Indexed', tone: 'good' },
    { label: 'SEO metadata', detail: 'Homepage metadata drafted; production deployment needs verification', url: site, status: 'Verify', tone: 'neutral' },
] as const;

/** Admin interface for manual SEO checks and AI-assisted SEO recommendations. */
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contentType: kind,
                    topic: subject,
                    content: content.trim() || null,
                }),
            });

            if (!response.ok) {
                const details = await getApiErrorDetails(response, 'Unable to generate SEO recommendations. Please try again.');
                setError(details.message);
                return;
            }

            const result = (await response.json()) as SeoSuggestion;
            setSuggestion(result);
            setTitle(result.seoTitle ?? '');
            setDescription(result.metaDescription ?? '');
        } catch (err) {
            const details = getNetworkErrorDetails(err);
            setError(details.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminLayout>
            <main className="smart-seo">
                <header className="smart-seo__hero">
                    <div className="smart-seo__hero-content">
                        <span className="smart-seo__eyebrow">RCCG Hope House · Administration</span>
                        <h1>Smart SEO Management</h1>
                        <p>Review website search visibility and prepare clear, search-friendly content with AI assistance.</p>
                    </div>
                    <div className="smart-seo__hero-mark" aria-hidden="true">SEO<span>✦</span></div>
                </header>

                <div className="smart-seo__layout">
                    <section className="smart-seo__panel" aria-labelledby="seo-status-heading">
                        <div className="smart-seo__section-heading">
                            <div>
                                <span className="smart-seo__kicker">Website health</span>
                                <h2 id="seo-status-heading">SEO status overview</h2>
                                <p>Based on previous manual checks. These statuses are not live automated tests.</p>
                            </div>
                        </div>
                        <div className="smart-seo__checks">
                            {checks.map(check => (
                                <article className="smart-seo__check" key={check.label}>
                                    <div className="smart-seo__check-main">
                                        <h3>{check.label}</h3>
                                        <p>{check.detail}</p>
                                    </div>
                                    <div className="smart-seo__check-actions">
                                        <span className={`smart-seo__status smart-seo__status--${check.tone}`}>{check.status}</span>
                                        <a href={check.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${check.label} in a new tab`}>Open ↗</a>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="smart-seo__panel" aria-labelledby="seo-generator-heading">
                        <div className="smart-seo__section-heading">
                            <div>
                                <span className="smart-seo__kicker">AI writing assistant</span>
                                <h2 id="seo-generator-heading">Generate SEO recommendations</h2>
                                <p>Prepare metadata for a sermon, event, devotional or service. Review all suggestions before publishing.</p>
                            </div>
                        </div>
                        <form onSubmit={generateSeo} className="smart-seo__form">
                            <div className="smart-seo__field">
                                <label htmlFor="seo-kind">Content type</label>
                                <select id="seo-kind" value={kind} onChange={e => setKind(e.target.value as SeoContentType)} disabled={loading}>
                                    <option value="Sermon">Sermon</option>
                                    <option value="Event">Event</option>
                                    <option value="Devotional">Devotional</option>
                                    <option value="Service">Service</option>
                                </select>
                            </div>
                            <div className="smart-seo__field">
                                <label htmlFor="seo-subject">Content title or topic <span aria-hidden="true">*</span></label>
                                <input id="seo-subject" value={draft} onChange={e => setDraft(e.target.value)} placeholder="e.g. Walking in Faith" maxLength={200} required disabled={loading} />
                            </div>
                            <div className="smart-seo__field">
                                <label htmlFor="seo-content">Existing content <span className="smart-seo__optional">(optional)</span></label>
                                <textarea id="seo-content" rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste the sermon summary, event details, devotional or service description here." maxLength={15000} disabled={loading} />
                                <span className="smart-seo__field-hint">{content.length.toLocaleString()} / 15,000 characters</span>
                            </div>
                            <button className="smart-seo__primary-button" type="submit" disabled={!draft.trim() || loading}>
                                {loading ? 'Generating recommendations…' : 'Generate SEO recommendations'}
                            </button>
                        </form>
                        {error && <div className="smart-seo__error" role="alert">{error}</div>}
                    </section>
                </div>

                {suggestion && (
                    <section className="smart-seo__panel smart-seo__results" aria-labelledby="seo-results-heading">
                        <div className="smart-seo__section-heading">
                            <div>
                                <span className="smart-seo__kicker">Generated draft</span>
                                <h2 id="seo-results-heading">SEO recommendations</h2>
                                <p>Adjust the wording below to fit your church's voice.</p>
                            </div>
                        </div>
                        <div className="smart-seo__score">
                            <div><span className="smart-seo__score-label">Estimated SEO score</span><strong>{suggestion.seoScore}/100</strong></div>
                            <div><p>{suggestion.scoreExplanation}</p><small>AI-generated editorial estimate only — not a Google ranking or Search Console score.</small></div>
                        </div>
                        <div className="smart-seo__editor-grid">
                            <div className="smart-seo__editor-fields">
                                <div className="smart-seo__field">
                                    <label htmlFor="seo-title">SEO title</label>
                                    <input id="seo-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={70} />
                                    <span className="smart-seo__field-hint">{title.length} / 70 characters</span>
                                </div>
                                <div className="smart-seo__field">
                                    <label htmlFor="seo-description">Meta description</label>
                                    <textarea id="seo-description" rows={4} value={description} onChange={e => setDescription(e.target.value)} maxLength={160} />
                                    <span className="smart-seo__field-hint">{description.length} / 160 characters</span>
                                </div>
                            </div>
                            <aside className="smart-seo__preview" aria-label="Illustrative search result preview">
                                <span className="smart-seo__preview-label">Search result preview</span>
                                <span className="smart-seo__preview-site">RCCG Hope House</span>
                                <span className="smart-seo__preview-url">{site}</span>
                                <strong>{title || 'Your SEO title will appear here'}</strong>
                                <p>{description || 'Your meta description will appear here.'}</p>
                                <small>Illustrative preview. Search engines may display different text.</small>
                            </aside>
                        </div>
                        <div className="smart-seo__recommendation-grid">
                            <section>
                                <h3>Suggested keywords</h3>
                                {suggestion.keywords?.length ? (
                                    <div className="smart-seo__keywords">{suggestion.keywords.map((keyword, index) => <span key={`${keyword}-${index}`}>{keyword}</span>)}</div>
                                ) : <p>No keywords were suggested.</p>}
                            </section>
                            <section>
                                <h3>Suggested headings</h3>
                                {suggestion.suggestedHeadings?.length ? <ul>{suggestion.suggestedHeadings.map((heading, index) => <li key={index}>{heading}</li>)}</ul> : <p>No headings were suggested.</p>}
                            </section>
                            <section className="smart-seo__improvements">
                                <h3>Content improvement recommendations</h3>
                                {suggestion.improvements?.length ? <ul>{suggestion.improvements.map((improvement, index) => <li key={index}>{improvement}</li>)}</ul> : <p>No additional improvements were suggested.</p>}
                            </section>
                        </div>
                        <p className="smart-seo__draft-note">Draft only — changes are not yet saved or published to the website.</p>
                    </section>
                )}
            </main>
        </AdminLayout>
    );
}
