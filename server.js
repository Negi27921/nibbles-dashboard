const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Supabase Client ───
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ─── Fallback in-memory (used when Supabase not configured) ───
let memoryRuns = [];

// ─── Helper: Save run to Supabase or memory ───
async function saveRun(run) {
  if (supabase) {
    const { data, error } = await supabase.from('workflow_runs').insert([run]).select();
    if (error) { console.error('Supabase insert error:', error); memoryRuns.unshift(run); }
    return data ? data[0] : run;
  }
  memoryRuns.unshift(run);
  return run;
}

async function getRuns(limit = 50) {
  if (supabase) {
    const { data, error } = await supabase.from('workflow_runs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) { console.error('Supabase fetch error:', error); return memoryRuns.slice(0, limit); }
    return data || [];
  }
  return memoryRuns.slice(0, limit);
}

async function updateRunStatus(id, status) {
  if (supabase) {
    const { data, error } = await supabase.from('workflow_runs').update({ status, completed_at: status === 'completed' ? new Date().toISOString() : null }).eq('id', id).select();
    if (error) console.error('Supabase update error:', error);
    return data ? data[0] : null;
  }
  const run = memoryRuns.find(r => r.id === id);
  if (run) { run.status = status; if (status === 'completed') run.completed_at = new Date().toISOString(); }
  return run;
}

async function saveGeneratedContent(content) {
  if (supabase) {
    const { data, error } = await supabase.from('generated_content').insert([content]).select();
    if (error) console.error('Supabase content insert error:', error);
    return data ? data[0] : content;
  }
  return content;
}

async function getGeneratedContent(limit = 50) {
  if (supabase) {
    const { data, error } = await supabase.from('generated_content').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return data || [];
  }
  return [];
}

// ─── SPECIALIST-LEVEL WORKFLOW PROMPTS ───
// Each prompt is written as if a top-tier Indian D2C growth specialist is executing
const WORKFLOWS = [
  {
    id: 1,
    name: "Content Refresh Agent",
    desc: "Identify & rewrite stale blog articles with full E-E-A-T optimization",
    category: "AUTOMATED",
    color: "#2e7d32",
    prompt: `You are a senior SEO content strategist specialising in Indian D2C baby products (silicone feeding bottles, teethers, spoon feeders). Execute the Content Refresh workflow for Nibbles (thenibbles.shop):

STEP 1 — AUDIT: Fetch ALL blog articles from Shopify blog ID gid://shopify/Blog/98798895352. For each article, check:
- Has "Key Takeaways" styled div immediately after H1?
- Has FAQ section (5-6 questions) at the bottom?
- Has 3+ internal product links with title attributes?
- Has comparison table?
- Has 10-12 unique intent-driven tags (NOT generic "India 2026")?
- Author is "Team Nibbles"?

STEP 2 — SELECT: Pick the 3 OLDEST articles that FAIL 3+ checks above.

STEP 3 — REWRITE EACH with this exact structure:
- H1: [Primary keyword] + context + "India 2026"
- Key Takeaways box: 4-5 bullet points summarising the article
- Introduction: Primary keyword in first 100 words, mention Indian parents specifically
- 3-4 H2 sections with H3 sub-sections (never skip heading levels)
- Comparison table: Nibbles silicone vs plastic vs steel alternatives with INR pricing
- Product recommendations: Link Anti-Colic Bottle (₹1,670), Spoon Feeder (₹1,570), Dinosaur Teether (₹799), Baby Feeding Set (₹5,999) where contextually relevant
- Include LFGB + FDA + NABL + BIS certification mentions for trust signals
- Reference Indian parenting context: joint families, monsoon sterilisation, boiling as primary method, city-specific references (Mumbai, Delhi, Bangalore)
- FAQ section: 5-6 questions targeting voice search ("How do I...", "What is the best...", "Is it safe to...")
- Each answer: 40-60 words, conversational, includes a product mention

STEP 4 — TAGS: Generate 10-12 UNIQUE tags per article:
- Primary keyword tag (e.g., "anti colic bottle for newborn")
- 2 problem/solution tags (e.g., "baby gas relief", "colic remedies")
- 1 age-based tag (e.g., "0-3 month feeding guide")
- 2 product category tags (e.g., "silicone baby bottle", "BPA free bottle")
- 2 long-tail question tags (e.g., "how to sterilize baby bottles")
- 1-2 certification tags (e.g., "LFGB certified", "food grade silicone")
- 1 location tag (e.g., "India" or "Indian parents")

STEP 5 — PUBLISH: Use Shopify articleUpdate mutation. Set author to "Team Nibbles", publish date to today, blog ID gid://shopify/Blog/98798895352.

CRITICAL RULES:
- Year must be 2026 (current year)
- Author must be "Team Nibbles"
- All prices in INR (₹)
- Never use generic tags like "India 2026" on every article
- Include at least 1 product image using Shopify CDN URLs
- Word count: 1,800-2,500 words per article`
  },
  {
    id: 2,
    name: "Blog Revamp Workflow",
    desc: "Deep structural optimization of existing articles for rich snippets",
    category: "AUTOMATED",
    color: "#2e7d32",
    prompt: `You are a technical SEO architect specialising in rich snippet optimisation for Indian e-commerce. Execute the Blog Revamp workflow for Nibbles (thenibbles.shop):

STEP 1 — STRUCTURAL AUDIT: Fetch all articles from blog gid://shopify/Blog/98798895352. Score each article (0-10) on:
- Heading hierarchy (H1 > H2 > H3, no skipped levels) — 2 pts
- Has comparison table (for Table snippet) — 2 pts
- Has FAQ section with proper Q&A format (for FAQ snippet) — 2 pts
- Has numbered/ordered list (for List snippet) — 1 pt
- Internal product links with title attributes — 1 pt
- Image alt tags with keywords — 1 pt
- Meta description 150-160 chars with primary keyword — 1 pt

STEP 2 — FIX the 3 articles scoring LOWEST:

For each article, restructure with:
a) HEADING FIX: Ensure H1 (only 1) → H2 sections → H3 sub-sections. Example:
   H1: Best Anti-Colic Baby Bottles for Indian Newborns 2026
   H2: Why Anti-Colic Bottles Matter for Your Baby
   H3: How Anti-Colic Valves Reduce Gas
   H2: Top 5 Anti-Colic Bottles Available in India
   H3: 1. Nibbles Silicone Anti-Colic Bottle

b) COMPARISON TABLE: Add at minimum 1 table comparing:
   | Feature | Nibbles Silicone | Plastic Bottles | Steel Bottles |
   Include: Material safety, Price (INR), Certifications, Anti-colic, Dishwasher safe, Weight

c) FAQ SECTION: Add 5-6 questions in this format:
   <h3>Frequently Asked Questions</h3>
   <h4>Q: Is silicone safer than plastic for baby bottles?</h4>
   <p>A: Yes, medical-grade silicone like Nibbles uses is... (40-60 words)</p>

d) INTERNAL LINKS: Add 3+ links to Nibbles products:
   - Anti-Colic Bottle 210ml → /products/nibbles-multi-purpose-silicone-feeding-bottle-210-ml-ml-anti-colic-bpa-free-soft-nipple
   - Spoon Feeder 120ml → /products/silicone-spoon-feeder-120ml-nibbles
   - Dinosaur Teether → /products/silicone-dino-teether-set
   - 360° Brush Kit → /products/silicone-bottle-brush-set-3pc
   - Baby Feeding Set → /products/new-born-gift-pack-large

e) IMAGE ALT TAGS: Every image must have descriptive alt text with keywords:
   alt="Nibbles silicone anti-colic baby bottle 210ml BPA free India"

STEP 3 — PUBLISH: articleUpdate mutation with publish date = today, author = "Team Nibbles".

TARGET: Each fixed article should score 8+ out of 10 and be eligible for at least 2 rich snippet types.`
  },
  {
    id: 3,
    name: "Content Brief Generator",
    desc: "Research-backed content briefs targeting high-volume Indian parent searches",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are a keyword research specialist for the Indian baby products market. Generate 5 high-impact content briefs for Nibbles (thenibbles.shop) — a premium silicone baby feeding brand.

CONTEXT: Nibbles sells silicone feeding bottles (₹1,670-₹2,499), spoon feeders (₹1,570), teethers (₹799), bottle brush kits (₹649), and gift sets (₹4,599-₹5,999). All products are LFGB + FDA + NABL certified, BPA/BPS/phthalate-free.

For EACH brief, provide:

1. TARGET KEYWORD: Primary keyword with estimated monthly search volume in India
   - Focus on keywords where Nibbles can realistically rank (not dominated by Amazon/Flipkart product pages)
   - Prefer informational intent ("how to", "best", "guide", "vs") over transactional

2. SEARCH INTENT: What is the parent actually trying to solve?
   - Map to parenting stage: pregnancy prep → newborn (0-3mo) → infant (3-6mo) → weaning (6-12mo) → toddler (1-2yr)

3. CONTENT OUTLINE:
   - H1 title (include "India" and "2026")
   - 5-7 H2 sections
   - Key Takeaways (4-5 bullets)
   - FAQ questions (5-6)
   - Target word count

4. COMPETITOR GAPS: What existing top-5 ranking articles miss that Nibbles can add:
   - Indian-specific context (monsoon care, joint family dynamics, Indian pediatrician recommendations)
   - Certification details (LFGB, FDA, NABL, BIS — most competitors don't have these)
   - Price comparison in INR
   - Real product recommendations (not just affiliate links)

5. NIBBLES PRODUCTS TO FEATURE: Which 2-3 products to link and why

PRIORITY TOPIC AREAS (in order):
- Baby feeding milestones & schedules (huge search volume)
- Bottle/product safety & material comparison (high purchase intent)
- Weaning & first foods guides (underserved in Indian context)
- Sterilisation & hygiene (monsoon-relevant, seasonal boost)
- Gift guides for new parents (high AOV potential)

Output as structured JSON for each brief.`
  },
  {
    id: 4,
    name: "Case Study Generator",
    desc: "Relatable Indian parent stories featuring Nibbles products",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are a D2C brand storytelling specialist for the Indian market. Create 2 customer case study blog posts for Nibbles (thenibbles.shop).

BRAND CONTEXT: Nibbles makes premium silicone baby feeding products. Key differentiators: LFGB + FDA + NABL certified, medical-grade silicone, anti-colic valve system, BPA/BPS/phthalate-free. Price range ₹649-₹5,999.

CASE STUDY 1 — "The Plastic-to-Silicone Switch"
Target parent persona: First-time mother in a metro city (Mumbai/Bangalore/Delhi), age 28-34, researched BPA dangers online, worried about microplastics, joint family where in-laws prefer traditional steel/glass.
- Story arc: Discovery of BPA risks → research phase → trying Nibbles → baby accepting the bottle → family convinced
- Include: Specific product (Anti-Colic Bottle 210ml, ₹1,670), real concerns Indian moms have (microplastic studies, heating formula in plastic)
- Mention certifications as the convincing factor
- Natural product links throughout

CASE STUDY 2 — "Solving Colic at 3 AM"
Target parent persona: Parents dealing with a colicky baby (1-3 months), sleep-deprived, tried multiple bottles, pediatrician suggested trying anti-colic.
- Story arc: Colic symptoms → trying remedies → discovering anti-colic bottles → Nibbles solving the problem → peaceful feeding
- Include: How the anti-colic valve works, comparison with other bottles tried
- Indian context: Consulting family elders, visiting pediatrician, trying home remedies first
- Link to Anti-Colic Bottle + Complete Baby Feeding Kit (₹2,817)

EACH ARTICLE MUST HAVE:
- Key Takeaways box at top (4-5 bullets)
- 2,000+ words
- Author: "Team Nibbles"
- FAQ section (5 questions from parents facing similar issues)
- 10-12 unique tags (parent pain point + product + age-based + solution tags)
- Comparison table (what they tried before vs Nibbles)
- Product images with alt tags
- Publish date: today, year: 2026
- Publish via articleCreate mutation to blog gid://shopify/Blog/98798895352`
  },
  {
    id: 5,
    name: "Listicle Article Generator",
    desc: "High-ranking 'Top N' articles with strategic product placement",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are an SEO content writer specialising in Indian baby product listicles that rank on page 1. Create a comprehensive listicle for Nibbles (thenibbles.shop).

ARTICLE: "Top 10 Must-Have Baby Feeding Products for Indian Parents in 2026"

STRUCTURE:
1. H1: Top 10 Must-Have Baby Feeding Products for Indian Parents in 2026
2. Key Takeaways (4-5 bullets summarising the list)
3. Introduction (200 words, primary keyword in first 100 words, address Indian parents directly)
4. Items 1-10 as H2 sections, each with:
   - Product name and category
   - Why Indian parents need it (specific to Indian context — climate, cooking habits, family structure)
   - Price range in INR
   - What to look for when buying
   - Our recommendation (feature Nibbles products for 4-5 items naturally, honest recommendations for others)

NIBBLES PRODUCTS TO FEATURE (naturally, not forced):
- #2 or #3: Anti-Colic Silicone Bottle — highlight LFGB certification, anti-colic valve, ₹1,670
- #4 or #5: Silicone Spoon Feeder — for weaning stage, ₹1,570
- #6 or #7: Silicone Teether — Dinosaur design, ₹799
- #8 or #9: Baby Feeding Set — gift-worthy, ₹5,999
- Include non-Nibbles items too (high chair, bib, food processor, sterilizer, food storage) for authenticity

5. Comparison table: All 10 items with Price (INR), Age Range, Material, Rating
6. FAQ section (6 questions): "What feeding products do newborns need?", "When should I start using a spoon feeder?", etc.
7. Conclusion with internal links

TAGS: baby feeding products India, must have baby items 2026, newborn essentials India, baby feeding set, silicone baby products, first time mom checklist India, baby shower gift ideas, weaning products India, BPA free baby products, best baby bottle India, new parent guide, baby feeding essentials

Author: Team Nibbles | Publish date: today | 2,500+ words
Publish via articleCreate to blog gid://shopify/Blog/98798895352`
  },
  {
    id: 6,
    name: "Competitor Comparison Generator",
    desc: "'Nibbles vs X' pages targeting competitor search traffic",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are a competitive intelligence analyst for the Indian baby products market. Create a detailed comparison blog post for Nibbles (thenibbles.shop).

ARTICLE: "Nibbles vs Philips Avent: Which Baby Bottle Is Best for Indian Babies in 2026?"

This targets parents searching "[brand] vs [brand]" — high purchase intent keywords.

STRUCTURE:
1. Key Takeaways (5 bullets — be honest and balanced, not a sales pitch)
2. Introduction: Why this comparison matters for Indian parents (mention BPA concerns, price sensitivity, availability)

3. DETAILED COMPARISON TABLE:
| Feature | Nibbles Silicone | Philips Avent |
|---------|-----------------|---------------|
| Material | Medical-grade silicone | Polypropylene (PP) plastic |
| BPA Free | Yes (BPA/BPS/Phthalate free) | Yes (BPA free) |
| Certifications | LFGB + FDA + NABL + BIS | FDA |
| Anti-Colic | Built-in valve system | AirFree vent |
| Price Range | ₹1,670 - ₹2,499 | ₹500 - ₹1,200 |
| Dishwasher Safe | Yes | Yes |
| Microplastic Risk | Zero (silicone) | Studies show PP releases microplastics |
| Temperature Range | -40°C to 230°C | Not suitable for boiling |
| Available in India | thenibbles.shop | Amazon, Flipkart, FirstCry |
| Warranty | Contact brand | Varies |

4. Deep-dive sections (H2 each):
   - Material Safety: The Silicone vs Plastic Debate (cite 2023 microplastic studies)
   - Anti-Colic Technology: How Each System Works
   - Sterilisation: Why Silicone Handles Indian Boiling Methods Better
   - Price vs Value: Long-term Cost Analysis (silicone lasts 3x longer)
   - Certification Deep-Dive: What LFGB/NABL Mean and Why They Matter
   - Real Parent Verdict: When to Choose Which

5. FAQ (6 questions): Target "Nibbles vs Avent" search queries
6. Conclusion: Honest recommendation based on parent priorities

HONESTY RULE: Acknowledge where Philips Avent wins (lower price point, wider retail availability, brand recognition). This builds trust. Nibbles wins on: material safety, certification depth, boiling/sterilisation durability, zero microplastic risk.

TAGS: nibbles vs philips avent, best baby bottle India 2026, silicone vs plastic bottle, anti colic bottle comparison, BPA free bottle India, safest baby bottle material, microplastic free bottle, LFGB certified bottle India, baby bottle comparison, premium baby bottle India

Author: Team Nibbles | 2,800+ words | Publish via articleCreate`
  },
  {
    id: 7,
    name: "SEO Glossary Generator",
    desc: "Featured-snippet-optimised baby feeding term definitions",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are an SEO specialist targeting featured snippets and Google's "People Also Ask" boxes in India. Create 10 glossary entries for baby feeding terms, each optimised to win position 0.

TARGET TERMS (each as a separate section):
1. Anti-Colic Valve — What it is, how it works, why it matters for Indian babies
2. LFGB Certification — German food safety standard, what it tests for, why Nibbles has it
3. Paced Bottle Feeding — Technique for breastfed babies transitioning to bottles
4. Nipple Confusion — What causes it, how to prevent it, which bottle shapes help
5. BPA-Free — What BPA is, why it's banned, what "BPA-free" actually means (and limitations)
6. Food-Grade Silicone — Medical vs food grade, temperature range, safety profile
7. Baby-Led Weaning (BLW) — Indian adaptation, when to start, suitable first foods
8. Sterilisation Methods — Boiling, steam, UV, chemical — pros/cons for Indian households
9. Colic — Symptoms, causes, duration, Indian home remedies vs medical solutions
10. Slow-Flow Nipple — Age guide, flow rates, when to size up

EACH ENTRY FORMAT:
<h2>[Term]</h2>
<p><strong>[Term]</strong> is [40-50 word definition optimised for featured snippet]. [2-3 additional sentences with Indian context].</p>
<h3>Why It Matters for Indian Parents</h3>
<p>[100-150 words with specific Indian references]</p>
<h3>Nibbles Connection</h3>
<p>[How this relates to a specific Nibbles product, with link]</p>

TAGS: baby feeding glossary, parenting terms India, anti colic meaning, BPA free meaning, baby bottle terms, newborn feeding guide India, silicone safety baby, sterilisation methods baby bottles, paced feeding technique, baby weaning terms

Publish as single article. Author: Team Nibbles. Year: 2026.`
  },
  {
    id: 8,
    name: "Glossary Hub Page",
    desc: "Comprehensive glossary landing page with internal link architecture",
    category: "ON-DEMAND",
    color: "#2563eb",
    prompt: `You are an information architecture specialist. Create a comprehensive Baby Feeding Glossary hub page for Nibbles (thenibbles.shop) that serves as an internal linking powerhouse.

PAGE PURPOSE: A single reference page that:
1. Defines 25+ baby feeding/parenting terms
2. Links to relevant Nibbles blog articles for each term
3. Links to relevant Nibbles products for each term
4. Targets long-tail "what is [term]" searches
5. Acts as a topical authority signal for Google

STRUCTURE:
- H1: Complete Baby Feeding Glossary for Indian Parents 2026
- Key Takeaways (5 bullets)
- Introduction: Why understanding these terms helps you choose safer products
- Alphabetical sections (A-Z) with terms grouped
- Each term: 50-80 word definition + "Related articles" + "Recommended products"
- FAQ section: 8 questions about baby feeding terminology
- Cross-links: Every term should link to at least 1 blog article and 1 product page

TERMS TO INCLUDE (minimum 25):
A: Anti-colic, Allergen introduction
B: BPA-free, Baby-led weaning, Breast milk storage
C: Colic, Combination feeding, Cluster feeding
D: Demand feeding
F: Food-grade silicone, Formula feeding, First foods
L: LFGB certification, Latching
M: Microplastics, Medical-grade silicone
N: Nipple confusion, NABL certification
P: Paced feeding, Purée
S: Sterilisation, Slow-flow nipple, Silicone, Spoon feeding
T: Teething, Tongue-tie
W: Weaning, Wide-neck bottle

INTERNAL LINKS MAP: Link each term to the most relevant existing blog article + product.

Author: Team Nibbles | 3,000+ words | Publish as new article`
  },
  {
    id: 9,
    name: "Meta Title & Description Audit",
    desc: "Audit & rewrite meta tags for maximum CTR in Indian SERPs",
    category: "WEEKLY",
    color: "#f59e0b",
    prompt: `You are a SERP CTR optimisation specialist for Indian e-commerce. Audit and fix meta titles and descriptions across all Nibbles blog articles.

STEP 1 — FETCH all articles from blog gid://shopify/Blog/98798895352

STEP 2 — AUDIT each article's title and summary (meta description):

Title Rules (for Indian SERPs):
- Length: 55-60 characters (Google truncates at ~60)
- Must include primary keyword near the beginning
- Must include "India" or "Indian" for local relevance
- Must include "2026" for freshness signal
- Should include a power word (Best, Complete, Ultimate, Safe, Essential)
- Should trigger click: number, question, or bracket [Guide]

Meta Description Rules:
- Length: 150-160 characters
- Must include primary keyword
- Must include a CTA or benefit ("Learn why...", "Discover the safest...", "Compare top brands...")
- Include ₹ price or "certified" for trust
- End with action: "Read our expert guide" or "See the comparison"

STEP 3 — SCORE each article:
- Title score (0-5): keyword placement, length, year, location, power word
- Description score (0-5): keyword, CTA, length, trust signal, action

STEP 4 — REWRITE the 10 worst-scoring. Examples:

BAD: "How to Sterilize Baby Bottles at Home" (no India, no year, no power word)
GOOD: "How to Sterilize Baby Bottles at Home — India Guide 2026 [Safe Methods]"

BAD: "A guide about baby bottles"
GOOD: "Compare the 5 safest baby bottles for Indian newborns. LFGB certified, from ₹799. Expert guide →"

STEP 5 — UPDATE via articleUpdate mutation (only title + summary fields).

Output: Table showing Before → After for each rewrite with score improvement.`
  },
  {
    id: 10,
    name: "Weekly Performance Report",
    desc: "Comprehensive content health & growth metrics dashboard",
    category: "WEEKLY",
    color: "#f59e0b",
    prompt: `You are a content performance analyst for an Indian D2C brand. Generate the weekly report for Nibbles (thenibbles.shop).

FETCH all articles from blog gid://shopify/Blog/98798895352 and analyse:

SECTION 1 — CONTENT INVENTORY
- Total articles count
- Optimized (has Key Takeaways + FAQ + 3+ product links + 10+ tags): count and %
- Partially optimized (has some but not all elements): count
- Unoptimized (raw/thin content): count
- New articles created this week: list titles

SECTION 2 — STRUCTURAL HEALTH
- Articles with proper H1>H2>H3 hierarchy: count and %
- Articles with comparison tables: count
- Articles with FAQ sections: count
- Articles with internal product links: count and avg links per article
- Articles with image alt tags: count

SECTION 3 — TAG ANALYSIS
- Total unique tags used across all articles
- Most common tags (top 10 with frequency)
- Articles with < 5 tags (need more)
- Articles with generic/duplicate tags (flag these)
- Tag diversity score (unique tags / total tag instances)

SECTION 4 — PRODUCT LINK COVERAGE
For each Nibbles product, count how many articles link to it:
- Anti-Colic Bottle 210ml: X articles
- Spoon Feeder 120ml: X articles
- Multi-Purpose Bottle: X articles
- Dinosaur Teether: X articles
- 360° Brush Kit: X articles
- Baby Feeding Set: X articles
- 4-in-1 Feeding Set: X articles
- EasyFeed Combo: X articles
- Feed & Teethe Combo: X articles
- Complete Kit: X articles
- Double Spoon Pack: X articles

SECTION 5 — RECOMMENDATIONS
- Top 3 articles to optimise next (oldest, most improvement potential)
- Top 3 new article topics to create (based on gaps)
- Tags that need to be added/fixed
- Products that need more blog mentions

Format as clean markdown report.`
  },
  {
    id: 11,
    name: "Paid Ads Strategy Builder",
    desc: "Google Ads campaign architecture for Indian baby market",
    category: "WEEKLY",
    color: "#f59e0b",
    prompt: `You are a Google Ads specialist for Indian D2C baby brands. Build a complete paid acquisition strategy for Nibbles (thenibbles.shop).

BRAND CONTEXT:
- Products: Silicone baby bottles (₹1,670-₹2,499), spoon feeders (₹1,570), teethers (₹799), brush kits (₹649), gift sets (₹4,599-₹5,999), combos (₹2,197-₹2,970)
- USP: LFGB + FDA + NABL certified, medical-grade silicone, zero microplastic risk
- Target: Indian parents, primarily mothers 25-38, Tier 1-2 cities
- AOV target: ₹2,500+

CAMPAIGN STRUCTURE:

Campaign 1 — Brand Search (₹200/day)
- Keywords: nibbles baby bottle, nibbles feeding bottle, thenibbles
- Ad copy emphasising certifications and safety

Campaign 2 — Category Search (₹400/day)
- Ad Group 1: Baby Bottles — "silicone baby bottle India", "anti colic bottle", "BPA free bottle India"
- Ad Group 2: Feeding — "baby spoon feeder", "silicone spoon feeder", "weaning spoon India"
- Ad Group 3: Teething — "silicone teether India", "baby teether BPA free"
- Ad Group 4: Gift Sets — "baby gift set India", "newborn gift hamper", "baby shower gift"

Campaign 3 — Competitor Conquest (₹200/day)
- Keywords: "philips avent alternative", "pigeon bottle alternative", "better than mee mee"
- Landing pages: comparison blog articles

Campaign 4 — Shopping/PMax (₹300/day)
- Product feed optimisation
- Focus on hero products: Anti-Colic Bottle, Baby Feeding Set

NEGATIVE KEYWORDS:
free, DIY, homemade, second hand, used, cheap, wholesale, bulk, under 100, under 200, glass, steel, stainless, water bottle, hot water bottle, sports bottle, adult

BUDGET: ₹1,100/day (₹33,000/month)
Expected ROAS: 3-4.5x
Expected CPC: ₹8-25 depending on category

Include: Ad copy examples (4 variations each), sitelink extensions, callout extensions, structured snippets.`
  },
  {
    id: 12,
    name: "Internal Link Audit",
    desc: "Map and fix internal linking architecture for SEO juice flow",
    category: "MONTHLY",
    color: "#e65100",
    prompt: `You are a technical SEO specialist focused on internal linking architecture. Audit and fix the internal link structure across all Nibbles blog articles.

STEP 1 — CRAWL: Fetch all articles from blog gid://shopify/Blog/98798895352. For each article, extract:
- All internal links (to other articles and to product pages)
- All external links
- Anchor text used for each link

STEP 2 — BUILD LINK MATRIX:
Create a matrix showing which articles link to which:
- Identify ORPHAN PAGES: Articles with 0 internal links pointing to them (these get zero SEO juice)
- Identify DEAD ENDS: Articles with 0 outbound internal links (these don't pass juice forward)
- Identify PRODUCT DESERTS: Articles that mention products but don't link to product pages

STEP 3 — FIX PLAN:
For each orphan page, identify 3-5 existing articles that should link to it and suggest anchor text.
For each dead end, suggest 2-3 contextual outbound links to add.
For each product desert, add product links with descriptive title attributes.

STEP 4 — TOPIC CLUSTERS:
Organise articles into topic clusters:
- Cluster 1: Bottle Feeding (pillar: "Best Baby Bottles India 2026")
- Cluster 2: Weaning & Solids (pillar: "When to Start Spoon Feeding")
- Cluster 3: Baby Safety (pillar: "Silicone vs Plastic")
- Cluster 4: Sterilisation & Hygiene
- Cluster 5: Gift & Bundle Guides

Each cluster article should link to its pillar page and to 2-3 sibling articles.

STEP 5 — EXECUTE: Use articleUpdate mutations to add the internal links to the 10 highest-priority articles.

PRODUCT LINK URLS:
- /products/nibbles-multi-purpose-silicone-feeding-bottle-210-ml-ml-anti-colic-bpa-free-soft-nipple
- /products/silicone-spoon-feeder-120ml-nibbles
- /products/silicone-bottle-handle-210mlml
- /products/silicone-dino-teether-set
- /products/silicone-bottle-brush-set-3pc
- /products/new-born-gift-pack-large
- /products/new-born-gift-pack-regular
- /products/nibbles-easyfeed-clean-baby-combo
- /products/nibbles-feed-teethe-baby-comfort-combo
- /products/nibbles-complete-baby-feeding-care-kit
- /products/nibbles-double-spoon-feeder-value-pack`
  },
  {
    id: 13,
    name: "Google Ads Audit",
    desc: "Full account health check with conversion optimisation recommendations",
    category: "MONTHLY",
    color: "#e65100",
    prompt: `You are a Google Ads auditor specialising in Indian D2C e-commerce. Perform a comprehensive audit for Nibbles (thenibbles.shop).

AUDIT CHECKLIST:

1. CAMPAIGN STRUCTURE
- Are campaigns properly segmented (Brand, Category, Competitor, Shopping)?
- Are ad groups thematically tight (max 15-20 keywords per group)?
- Is budget allocated proportionally to ROAS?

2. KEYWORD HEALTH
- Are there irrelevant search terms wasting budget?
- Are high-performing keywords getting enough budget?
- Keyword match type mix (Exact vs Phrase vs Broad)
- Missing keywords to add (based on Nibbles product catalog)

3. AD COPY ANALYSIS
- Are ads highlighting USPs? (LFGB certified, medical-grade silicone, anti-colic)
- Do ads include prices in INR?
- Are there enough ad variations (min 3 per group)?
- Are RSA pin strategies optimal?

4. LANDING PAGE ALIGNMENT
- Do keyword → ad → landing page themes match?
- Are product pages optimised for conversion?
- Blog articles as landing pages — which ones convert?

5. NEGATIVE KEYWORD REVIEW
- Are irrelevant queries properly excluded?
- Missing negative keywords to add
- Negative keyword conflicts (blocking good traffic)

6. EXTENSION COVERAGE
- Sitelinks: Product pages, blog articles, about page
- Callouts: Free shipping, LFGB certified, 100% silicone
- Structured snippets: Product types, certifications
- Price extensions: Key products with INR prices

7. BUDGET EFFICIENCY
- Current CPC vs target CPC
- Impression share on top keywords
- Quality Score distribution
- Wasted spend estimate

OUTPUT: Scored audit (0-100) with prioritised action items (Quick Wins, This Week, This Month).`
  },
  {
    id: 14,
    name: "Search Term Negation Agent",
    desc: "Intelligent negative keyword management for zero wasted spend",
    category: "CONDITIONAL",
    color: "#6b7280",
    prompt: `You are a paid search efficiency specialist. Build a comprehensive negative keyword strategy for Nibbles baby products Google Ads campaigns.

CONTEXT: Nibbles sells premium silicone baby feeding products in India. Any search term NOT related to baby feeding/baby products is wasted spend.

NEGATIVE KEYWORD CATEGORIES:

1. PRICE SEEKERS (exclude budget shoppers — Nibbles is premium):
free, cheap, cheapest, under 100, under 200, under 300, wholesale, bulk, discount code, coupon, deal, clearance, second hand, used, refurbished

2. WRONG PRODUCT TYPE:
water bottle, sports bottle, hot water bottle, wine bottle, beer bottle, milk bottle adult, protein shaker, sippy cup plastic, glass bottle, stainless steel bottle (these cannibalize budget)

3. DIY/RECIPES:
homemade, DIY, recipe, how to make, craft, project

4. COMPETITOR BRANDS (unless running conquest campaigns):
pigeon, chicco, mee mee, dr brown, tommy tippee, medela, spectra, lansinoh, nuk

5. IRRELEVANT BABY TERMS:
diaper, nappy, crib, pram, stroller, car seat, baby monitor, clothes, shoes

6. B2B/WHOLESALE:
manufacturer, supplier, distributor, wholesale, OEM, private label, factory

7. JOB/CAREER:
jobs, career, vacancy, hiring, salary, internship

8. GEOGRAPHIC (if not targeting):
USA, UK, Pakistan, Bangladesh, Sri Lanka (keep India, all Indian cities)

9. INFORMATIONAL (low conversion):
Wikipedia, PDF, research paper, study, thesis

IMPLEMENTATION:
- Campaign-level negatives: Categories 1, 2, 3, 5, 6, 7, 9
- Ad group-level negatives: Category 4 (except for conquest campaigns)
- Shared negative keyword lists: Create 3 lists (Product Type Exclusions, Price Exclusions, General Exclusions)

OUTPUT: Complete negative keyword list in CSV format, grouped by category, with match type recommendation (Exact, Phrase, or Broad) for each.`
  }
];

// ─── API Routes ───

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: !!supabase, timestamp: new Date().toISOString() });
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  const runs = await getRuns(20);
  const content = await getGeneratedContent(20);

  res.json({
    store: {
      name: "Nibbles",
      url: "https://thenibbles.shop",
      plan: "Shopify Basic",
      currency: "INR",
      blogId: "gid://shopify/Blog/98798895352"
    },
    workflows: WORKFLOWS.map(w => ({ ...w, prompt: w.prompt })),
    recentRuns: runs,
    generatedContent: content,
    stats: {
      totalArticles: 51,
      optimizedArticles: 7,
      remainingArticles: 44,
      daysToComplete: Math.ceil(44 / 3),
      totalWorkflows: 14,
      newThisWeek: 1,
      completedRuns: runs.filter(r => r.status === 'completed').length
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
      enabled: true,
      lastRun: runs.find(r => r.workflow_name === 'Daily Blog Engine')?.created_at || "2026-06-11T02:00:00Z",
      nextRun: getNextRun()
    },
    supabaseConnected: !!supabase
  });
});

function getNextRun() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(2, 0, 0, 0); // 7:30 AM IST = 2:00 UTC
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

// Get all workflows
app.get('/api/workflows', (req, res) => {
  res.json(WORKFLOWS);
});

// Trigger a workflow
app.post('/api/workflows/:id/run', async (req, res) => {
  const wf = WORKFLOWS.find(w => w.id === parseInt(req.params.id));
  if (!wf) return res.status(404).json({ error: "Workflow not found" });

  const run = {
    id: `run_${Date.now()}_${wf.id}`,
    workflow_id: wf.id,
    workflow_name: wf.name,
    category: wf.category,
    status: "running",
    prompt: wf.prompt,
    created_at: new Date().toISOString(),
    completed_at: null,
    results: null
  };

  const saved = await saveRun(run);
  res.json({ success: true, run: saved });
});

// Trigger daily engine
app.post('/api/daily-engine/run', async (req, res) => {
  const run = {
    id: `daily_${Date.now()}`,
    workflow_id: 0,
    workflow_name: "Daily Blog Engine",
    category: "DAILY",
    status: "running",
    prompt: WORKFLOWS[0].prompt, // Use Content Refresh Agent prompt as base
    created_at: new Date().toISOString(),
    completed_at: null,
    results: null
  };

  const saved = await saveRun(run);
  res.json({ success: true, run: saved });
});

// Update workflow run status + results
app.post('/api/runs/:id/status', async (req, res) => {
  const { status, results } = req.body;

  if (supabase) {
    const updateData = { status };
    if (status === 'completed') updateData.completed_at = new Date().toISOString();
    if (results) updateData.results = results;

    const { data, error } = await supabase.from('workflow_runs').update(updateData).eq('id', req.params.id).select();
    if (error) {
      // Try memory fallback
      const run = memoryRuns.find(r => r.id === req.params.id);
      if (run) { run.status = status; if (results) run.results = results; if (status === 'completed') run.completed_at = new Date().toISOString(); }
      return res.json({ success: true, run });
    }
    return res.json({ success: true, run: data?.[0] });
  }

  const run = memoryRuns.find(r => r.id === req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  run.status = status;
  if (results) run.results = results;
  if (status === 'completed') run.completed_at = new Date().toISOString();
  res.json({ success: true, run });
});

// Get workflow run history
app.get('/api/runs', async (req, res) => {
  const runs = await getRuns(100);
  res.json(runs);
});

// Save generated content (blog, images, etc.)
app.post('/api/content', async (req, res) => {
  const content = {
    id: `content_${Date.now()}`,
    type: req.body.type || 'blog', // blog, image, graphic
    title: req.body.title,
    article_id: req.body.article_id || null,
    workflow_id: req.body.workflow_id || null,
    status: req.body.status || 'published',
    tags: req.body.tags || [],
    word_count: req.body.word_count || 0,
    products_linked: req.body.products_linked || [],
    has_key_takeaways: req.body.has_key_takeaways || false,
    has_faq: req.body.has_faq || false,
    has_comparison_table: req.body.has_comparison_table || false,
    image_urls: req.body.image_urls || [],
    created_at: new Date().toISOString()
  };

  const saved = await saveGeneratedContent(content);
  res.json({ success: true, content: saved });
});

// Get generated content history
app.get('/api/content', async (req, res) => {
  const content = await getGeneratedContent(100);
  res.json(content);
});

// Get content stats
app.get('/api/content/stats', async (req, res) => {
  const content = await getGeneratedContent(500);
  const stats = {
    totalGenerated: content.length,
    blogs: content.filter(c => c.type === 'blog').length,
    images: content.filter(c => c.type === 'image').length,
    graphics: content.filter(c => c.type === 'graphic').length,
    withFAQ: content.filter(c => c.has_faq).length,
    withKeyTakeaways: content.filter(c => c.has_key_takeaways).length,
    withComparisonTable: content.filter(c => c.has_comparison_table).length,
    avgWordCount: content.length ? Math.round(content.reduce((s, c) => s + (c.word_count || 0), 0) / content.length) : 0,
    topTags: getTopTags(content),
    topProducts: getTopProducts(content)
  };
  res.json(stats);
});

function getTopTags(content) {
  const tagCount = {};
  content.forEach(c => (c.tags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  return Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));
}

function getTopProducts(content) {
  const prodCount = {};
  content.forEach(c => (c.products_linked || []).forEach(p => { prodCount[p] = (prodCount[p] || 0) + 1; }));
  return Object.entries(prodCount).sort((a, b) => b[1] - a[1]).map(([product, count]) => ({ product, count }));
}

// ─── Google Search Console API ───
const { google } = require('googleapis');

function getSearchConsoleAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!keyJson) return null;
  try {
    const key = JSON.parse(keyJson);
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
    });
  } catch (e) { console.error('GSC auth error:', e.message); return null; }
}

// Fetch Search Console data for a specific page or all pages
app.get('/api/search-console/pages', async (req, res) => {
  const auth = getSearchConsoleAuth();
  if (!auth) return res.json({ connected: false, error: 'Google Service Account not configured', data: [] });

  try {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const siteUrl = 'sc-domain:thenibbles.shop';
    const endDate = new Date().toISOString().split('T')[0];
    const startDate28 = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate28,
        endDate,
        dimensions: ['page'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'contains', expression: '/blogs/' }]
        }]
      }
    });

    const pages = (response.data.rows || []).map(row => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
      position: Math.round(row.position * 10) / 10
    }));

    res.json({ connected: true, data: pages, period: { start: startDate28, end: endDate } });
  } catch (e) {
    console.error('GSC API error:', e.message);
    res.json({ connected: false, error: e.message, data: [] });
  }
});

// Fetch top queries for a specific page
app.get('/api/search-console/queries', async (req, res) => {
  const auth = getSearchConsoleAuth();
  if (!auth) return res.json({ connected: false, data: [] });

  try {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const pageUrl = req.query.page;
    const endDate = new Date().toISOString().split('T')[0];
    const startDate28 = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl: 'sc-domain:thenibbles.shop',
      requestBody: {
        startDate: startDate28,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
        dimensionFilterGroups: pageUrl ? [{
          filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }]
        }] : []
      }
    });

    res.json({
      connected: true,
      data: (response.data.rows || []).map(row => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 10000) / 100,
        position: Math.round(row.position * 10) / 10
      }))
    });
  } catch (e) {
    res.json({ connected: false, error: e.message, data: [] });
  }
});

// ─── Blog Metrics CRUD ───

// Get all blog metrics
app.get('/api/blog-metrics', async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase.from('blog_metrics').select('*').order('updated_at', { ascending: false });
  if (error) return res.json([]);
  res.json(data || []);
});

// Upsert blog metrics (save before/after data)
app.post('/api/blog-metrics', async (req, res) => {
  if (!supabase) return res.status(400).json({ error: 'Supabase not connected' });
  const m = req.body;
  const { data, error } = await supabase.from('blog_metrics').upsert(m, { onConflict: 'article_title' }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data: data?.[0] });
});

// Sync Search Console data into blog_metrics table
app.post('/api/blog-metrics/sync', async (req, res) => {
  const auth = getSearchConsoleAuth();
  if (!auth) return res.json({ synced: false, error: 'GSC not connected' });
  if (!supabase) return res.json({ synced: false, error: 'Supabase not connected' });

  try {
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const endDate = new Date().toISOString().split('T')[0];
    const startDate28 = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    const response = await searchconsole.searchanalytics.query({
      siteUrl: 'sc-domain:thenibbles.shop',
      requestBody: {
        startDate: startDate28,
        endDate,
        dimensions: ['page'],
        rowLimit: 100,
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', operator: 'contains', expression: '/blogs/' }]
        }]
      }
    });

    const pages = response.data.rows || [];
    let synced = 0;

    for (const row of pages) {
      const url = row.keys[0];
      const title = decodeURIComponent(url.split('/').pop().replace(/-/g, ' ')).replace(/^\w/, c => c.toUpperCase());

      // Check if record exists
      const { data: existing } = await supabase.from('blog_metrics').select('*').eq('article_url', url).limit(1);

      if (existing && existing.length > 0) {
        // Update "after" metrics
        await supabase.from('blog_metrics').update({
          after_clicks: row.clicks,
          after_impressions: row.impressions,
          after_ctr: Math.round(row.ctr * 10000) / 100,
          after_position: Math.round(row.position * 10) / 10,
          after_date: endDate,
          updated_at: new Date().toISOString()
        }).eq('article_url', url);
      } else {
        // New entry — set both before and after to current (baseline)
        await supabase.from('blog_metrics').insert({
          article_title: title,
          article_url: url,
          optimized: false,
          before_clicks: row.clicks,
          before_impressions: row.impressions,
          before_ctr: Math.round(row.ctr * 10000) / 100,
          before_position: Math.round(row.position * 10) / 10,
          before_date: endDate,
          after_clicks: row.clicks,
          after_impressions: row.impressions,
          after_ctr: Math.round(row.ctr * 10000) / 100,
          after_position: Math.round(row.position * 10) / 10,
          after_date: endDate
        });
      }
      synced++;
    }

    res.json({ synced: true, count: synced, period: { start: startDate28, end: endDate } });
  } catch (e) {
    console.error('Sync error:', e.message);
    res.json({ synced: false, error: e.message });
  }
});

// Serve dashboard (catch-all)
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel serverless
module.exports = app;

// Local dev server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Nibbles Marketing Dashboard`);
    console.log(`  http://localhost:${PORT}\n`);
  });
}
