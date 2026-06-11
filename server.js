const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory store for workflow runs & logs ───
const workflowRuns = [];
const dailyEngineRuns = [];

// ─── Blog articles data (refreshed via MCP in Claude sessions) ───
let articlesCache = {
  lastUpdated: null,
  articles: [],
  optimizedCount: 0,
  totalCount: 0
};

// ─── Workflow definitions ───
const WORKFLOWS = [
  { id: 1, name: "Content Refresh Agent", desc: "Identify & rewrite stale blog articles", category: "AUTOMATED", color: "#2e7d32", prompt: "Run the Content Refresh Agent: Fetch all Nibbles blog articles, identify the 3 oldest unoptimized ones (missing Key Takeaways, FAQ, product links, India/2026 tags), and rewrite them with full SEO/AEO/E-E-A-T optimization. Author: Team Nibbles, year: 2026, publish date: today." },
  { id: 2, name: "Blog Revamp Workflow", desc: "Deep structural optimization of existing articles", category: "AUTOMATED", color: "#2e7d32", prompt: "Run the Blog Revamp Workflow: Analyze all Nibbles blog articles for structural issues — missing H1>H2>H3 hierarchy, no comparison tables, weak introductions, no internal links. Fix the 3 worst articles with complete structural overhaul." },
  { id: 3, name: "Content Brief Generator", desc: "Research-backed briefs for new articles", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Content Brief Generator: Research high-volume Indian parent search queries related to baby feeding, silicone products, and newborn care. Generate 5 detailed content briefs with: target keyword, search volume estimate, content outline, competitor analysis, and recommended Nibbles products to feature." },
  { id: 4, name: "Case Study Generator", desc: "Customer success stories from reviews", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Case Study Generator: Create 2 customer case study blog posts for Nibbles based on common Indian parent pain points (switching from plastic to silicone, solving colic issues). Include product recommendations and testimonial-style narratives." },
  { id: 5, name: "Listicle Article Generator", desc: "End-to-end 'Top N' listicle articles", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Listicle Article Generator: Create a 'Top 10 Baby Feeding Products Every Indian Parent Needs in 2026' listicle article. Include Nibbles products naturally alongside general recommendations. Follow all blog rules (Key Takeaways, FAQ, Team Nibbles author, 2026)." },
  { id: 6, name: "Competitor Page Generator", desc: "'Nibbles vs X' comparison pages", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Competitor Page Generator: Create a 'Nibbles vs Philips Avent: Which Silicone Baby Bottle Is Best for Indian Babies in 2026?' comparison blog post with detailed feature tables, pricing comparison in INR, and honest pros/cons." },
  { id: 7, name: "Glossary Content Generator", desc: "SEO glossary entries for baby terms", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Glossary Content Generator: Create 10 glossary entries for baby feeding terms (anti-colic valve, LFGB certification, paced feeding, nipple confusion, BPA-free, food-grade silicone, etc.) optimized for featured snippets and AEO." },
  { id: 8, name: "Glossary Page Generator", desc: "End-to-end glossary page publishing", category: "ON-DEMAND", color: "#2563eb", prompt: "Run the Glossary Page Generator: Compile all baby feeding glossary terms into a single comprehensive glossary page. Publish as a new blog article with internal links to relevant Nibbles articles and products." },
  { id: 9, name: "Meta Title & Description Optimization", desc: "Audit & rewrite meta across all articles", category: "WEEKLY", color: "#f59e0b", prompt: "Run the Meta Title & Description Optimization: Audit all Nibbles blog article titles and meta descriptions (summaries). Identify those that are: too long/short, missing keywords, missing 'India' or year, weak CTAs. Rewrite the 10 worst performing ones." },
  { id: 10, name: "Weekly Performance Report", desc: "Traffic, ranking, and content metrics", category: "WEEKLY", color: "#f59e0b", prompt: "Run the Weekly Performance Report: Analyze all Nibbles blog articles and generate a report showing: total articles, optimized vs unoptimized count, articles updated this week, new articles created, tag coverage analysis, product link density, and recommendations for next week." },
  { id: 11, name: "Weekly Budget Recommendation", desc: "Ad spend optimization suggestions", category: "WEEKLY", color: "#f59e0b", prompt: "Run the Weekly Budget Recommendation: Based on the current Nibbles product catalog and blog content strategy, recommend: which products to promote via paid ads, suggested daily budget in INR, target keywords for Google Ads, and expected ROI." },
  { id: 12, name: "Backlink Audit Workflow", desc: "Analyze & clean up link profile", category: "MONTHLY", color: "#e65100", prompt: "Run the Backlink Audit Workflow: Analyze the internal linking structure across all Nibbles blog articles. Identify: orphan pages (no internal links pointing to them), articles with no outbound product links, broken link patterns, and suggest a linking improvement plan." },
  { id: 13, name: "Google Ads Audit", desc: "Full account audit with recommendations", category: "MONTHLY", color: "#e65100", prompt: "Run the Google Ads Audit: Review the Nibbles product catalog and suggest a complete Google Ads strategy including: campaign structure, ad groups by product category, keyword lists, negative keywords, ad copy suggestions, and landing page recommendations." },
  { id: 14, name: "Search Term Negation Agent", desc: "Google Ads negative keyword management", category: "CONDITIONAL", color: "#6b7280", prompt: "Run the Search Term Negation Agent: Generate a comprehensive negative keyword list for Nibbles Google Ads campaigns to prevent wasted spend on irrelevant searches (e.g., 'free', 'DIY', competitor brands not being targeted, unrelated baby product terms)." }
];

// ─── API Routes ───

// Get dashboard data
app.get('/api/dashboard', (req, res) => {
  res.json({
    store: {
      name: "Nibbles",
      url: "https://thenibbles.shop",
      plan: "Shopify Basic",
      currency: "INR",
      blogId: "gid://shopify/Blog/98798895352"
    },
    articles: articlesCache,
    workflows: WORKFLOWS,
    recentRuns: [...workflowRuns, ...dailyEngineRuns].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20),
    stats: {
      totalArticles: articlesCache.totalCount || 51,
      optimizedArticles: articlesCache.optimizedCount || 6,
      remainingArticles: (articlesCache.totalCount || 51) - (articlesCache.optimizedCount || 6),
      daysToComplete: Math.ceil(((articlesCache.totalCount || 51) - (articlesCache.optimizedCount || 6)) / 3),
      totalWorkflows: 14,
      automatedWorkflows: 2,
      onDemandWorkflows: 6,
      weeklyWorkflows: 3,
      monthlyWorkflows: 2,
      conditionalWorkflows: 1
    },
    products: [
      { name: "Anti-Colic Bottle 210ml", price: 1670, handle: "nibbles-multi-purpose-silicone-feeding-bottle-210-ml-ml-anti-colic-bpa-free-soft-nipple", category: "Bottles" },
      { name: "Silicone Spoon Feeder 120ml", price: 1570, handle: "silicone-spoon-feeder-120ml-nibbles", category: "Feeders" },
      { name: "Multi-Purpose Bottle 210ml", price: 2499, handle: "silicone-bottle-handle-210mlml", category: "Bottles" },
      { name: "Dinosaur Teether", price: 799, handle: "silicone-dino-teether-set", category: "Teethers" },
      { name: "360° Bottle Brush Kit", price: 649, handle: "silicone-bottle-brush-set-3pc", category: "Accessories" },
      { name: "Baby Feeding Set", price: 5999, handle: "new-born-gift-pack-large", category: "Gift Sets" },
      { name: "4-in-1 Feeding Set", price: 4599, handle: "new-born-gift-pack-regular", category: "Gift Sets" },
      { name: "EasyFeed & Clean Combo", price: 2197, handle: "nibbles-easyfeed-clean-baby-combo", category: "Combos" },
      { name: "Feed & Teethe Combo", price: 2275, handle: "nibbles-feed-teethe-baby-comfort-combo", category: "Combos" },
      { name: "Complete Baby Feeding Kit", price: 2817, handle: "nibbles-complete-baby-feeding-care-kit", category: "Combos" },
      { name: "Double Spoon Feeder Pack", price: 2970, handle: "nibbles-double-spoon-feeder-value-pack", category: "Combos" }
    ],
    scheduledTask: {
      id: "nibbles-daily-blog-engine",
      schedule: "Daily at 7:30 AM IST",
      cron: "30 7 * * *",
      enabled: true,
      lastRun: dailyEngineRuns.length > 0 ? dailyEngineRuns[0].timestamp : "2026-06-11T02:00:00Z",
      nextRun: "2026-06-13T02:07:40.000Z"
    }
  });
});

// Get all workflows
app.get('/api/workflows', (req, res) => {
  res.json(WORKFLOWS);
});

// Trigger a workflow (logs the run — actual execution happens via Claude)
app.post('/api/workflows/:id/run', (req, res) => {
  const wf = WORKFLOWS.find(w => w.id === parseInt(req.params.id));
  if (!wf) return res.status(404).json({ error: "Workflow not found" });

  const run = {
    id: `run_${Date.now()}`,
    workflowId: wf.id,
    workflowName: wf.name,
    category: wf.category,
    status: "queued",
    prompt: wf.prompt,
    timestamp: new Date().toISOString(),
    completedAt: null
  };
  workflowRuns.unshift(run);

  res.json({
    success: true,
    run,
    instruction: `Copy this prompt into Claude Code to execute:\n\n${wf.prompt}`
  });
});

// Trigger daily engine
app.post('/api/daily-engine/run', (req, res) => {
  const run = {
    id: `daily_${Date.now()}`,
    workflowName: "Daily Blog Engine",
    category: "DAILY",
    status: "queued",
    timestamp: new Date().toISOString(),
    details: "Optimize 3 oldest unoptimized articles + Create 1 new blog post",
    prompt: "Run Now — Execute the daily blog engine: Fetch all Nibbles articles, identify 3 oldest unoptimized ones, rewrite them with full SEO/AEO/E-E-A-T optimization (Key Takeaways at top, FAQ at bottom, Author: Team Nibbles, year: 2026, product links, comparison tables), then create 1 new blog post based on today's topic rotation."
  };
  dailyEngineRuns.unshift(run);

  res.json({
    success: true,
    run,
    instruction: `Copy this prompt into Claude Code to execute:\n\n${run.prompt}`
  });
});

// Update article cache (called from frontend after MCP fetch)
app.post('/api/articles/sync', (req, res) => {
  const { articles } = req.body;
  if (articles) {
    articlesCache = {
      lastUpdated: new Date().toISOString(),
      articles: articles,
      optimizedCount: articles.filter(a => {
        const tags = (a.tags || []).join(' ').toLowerCase();
        return tags.includes('india') || tags.includes('2026');
      }).length,
      totalCount: articles.length
    };
  }
  res.json({ success: true, cache: articlesCache });
});

// Update workflow run status
app.post('/api/runs/:id/status', (req, res) => {
  const { status } = req.body;
  const run = [...workflowRuns, ...dailyEngineRuns].find(r => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  run.status = status;
  if (status === 'completed') run.completedAt = new Date().toISOString();
  res.json({ success: true, run });
});

// Get workflow run history
app.get('/api/runs', (req, res) => {
  const all = [...workflowRuns, ...dailyEngineRuns].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  res.json(all);
});

// Serve dashboard (catch-all)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Nibbles Marketing Dashboard`);
  console.log(`  http://localhost:${PORT}\n`);
});
