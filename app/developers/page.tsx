export const metadata = {
  title: "API",
  description: "Read-only JSON API for Ella’s lists, people and Rising Stars. Keys are available by request.",
  openGraph: { title: "API – Ella – AI Talent Tracker" },
  twitter: { title: "API – Ella – AI Talent Tracker" },
  alternates: { canonical: "/developers" },
};

const KEY = "ella_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

export default function Page() {
  return (
    <section className="hero wrap compact docs">
      <p className="eyebrow">Developers</p>
      <h1>A read-only API for Ella’s lists</h1>
      <p className="lede">JSON endpoints for the current 5×5, weekly lists, people, Rising Stars and search. Authentication is required. Keys are available by request.</p>

      <h2>Authentication</h2>
      <p>Every request must include an API key in the <code>Authorization</code> header:</p>
      <pre><code>{`Authorization: Bearer ${KEY}`}</code></pre>
      <p>Keys are issued by JSN. There is no self-serve signup. A missing or invalid key returns <code>401</code> with a JSON error. Keys can be revoked at any time.</p>

      <h2>Rate limits</h2>
      <p>Each key may make 60 requests per minute. A limit response is <code>429</code> and includes <code>Retry-After</code> and <code>X-RateLimit-*</code> headers.</p>

      <h2>Endpoints</h2>
      <p>All paths are under <code>/api/v1</code> and return JSON. CORS allows <code>GET</code> from any origin.</p>

      <h3>GET /api/v1/people</h3>
      <p>Everyone who has appeared on any 5×5, current and past, in one call. Each person includes their full public profile, including the <code>visibility</code> field described below, and a <code>placements</code> array of every list, category and rank they held. People on the current list come first.</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/people \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/lists/current</h3>
      <p>The current 5×5 list.</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/lists/current \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/lists</h3>
      <p>Every published list, current and archived, named by the date it was published, newest first. Each entry has its <code>status</code> (<code>current</code> or <code>archived</code>), its categories, and links to the page and its JSON.</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/lists \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/lists/{"{date}"}</h3>
      <p>One weekly list, by date (<code>YYYY-MM-DD</code>).</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/lists/2026-11-09 \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/people/{"{slug}"}</h3>
      <p>A person’s public profile: name, role, org, category, blurbs, sources, media, and the lists they appeared on. Each person also has a <code>visibility</code> object, or <code>null</code> when Ella has not yet recorded one. Visibility is how widely known someone is today. It is separate from talent, which is expressed only by list placement, and it never affects list order.</p>
      <p>The five levels are: <strong>Under the radar</strong> — known mostly to their team and close peers; <strong>Emerging</strong> — has a following in a niche, such as talks, open source or a strong portfolio; <strong>Recognized</strong> — well known in their discipline, and peers name them unprompted; <strong>Prominent</strong> — senior at a major company or frequently cited, and known beyond their field; <strong>Iconic</strong> — leads at a frontier lab or is a household name in AI. A check that cannot yet be confirmed is labeled <strong>Unconfirmed</strong> and has a null <code>level</code>.</p>
      <p>The object is <code>{"{ level, label, checked, spotted, rise, history }"}</code>. <code>checked</code> is the date of the latest check. <code>spotted</code> is <code>{"{ level, label, date }"}</code> from the day Ella first listed them, or <code>null</code>. <code>rise</code> is the current level minus the spotted level, or <code>null</code>. Each history item is <code>{"{ date, level, label, provisional, retroactive, note, sources }"}</code>, with <code>sources</code> as URLs only.</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/people/ilya-sutskever \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/rising-stars</h3>
      <p>People on the Rising Stars list.</p>
      <pre><code>{`curl -sS https://ellafive.com/api/v1/rising-stars \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <h3>GET /api/v1/search?q=</h3>
      <p>Search people by name, role or organization. The query must be at least 3 characters.</p>
      <pre><code>{`curl -sS "https://ellafive.com/api/v1/search?q=openai" \\
  -H "Authorization: Bearer ${KEY}"`}</code></pre>

      <p className="docs-note">Questions about access can be sent to JSN. Keys are available by request.</p>
    </section>
  );
}
