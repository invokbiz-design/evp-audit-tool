import { useState, useRef } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, LineChart, Line, CartesianGrid, ReferenceLine } from "recharts";
/* ─── Brand Tokens ── */
const T = {
  bg:"#f7f8fa", card:"#ffffff", border:"#e2e8f0", borderDark:"#cbd5e1",
  ink1:"#0f172a", ink2:"#334155", ink3:"#64748b", ink4:"#94a3b8",
  brand:"#d96029", brandFaint:"#fff3ed", brandBorder:"#f9c4a4", brandDark:"#b84e1f",
  gold:"#b45309", goldFaint:"#fef3c7", goldBorder:"#fcd34d",
  accent:"#d96029", accentFaint:"#fff3ed", accentBorder:"#f9c4a4",
  red:"#dc2626", redFaint:"#fef2f2", redBorder:"#fecaca",
  green:"#16a34a", greenFaint:"#f0fdf4", greenBorder:"#bbf7d0",
  orange:"#ea580c", orangeFaint:"#fff7ed", orangeBorder:"#fed7aa",
  yellow:"#ca8a04", yellowFaint:"#fefce8", yellowBorder:"#fde68a",
  violet:"#7c3aed",
  lime:"#65a30d",
  white:"#ffffff",
};

const DIMS = [
  { key:"compensation_rewards",  label:"Compensation & Rewards",          short:"Comp & Rewards",  sym:"₹", weight:14 },
  { key:"career_growth",         label:"Career Growth & Development",     short:"Career Growth",   sym:"↑", weight:14 },
  { key:"culture_environment",   label:"Culture & Work Environment",      short:"Culture",         sym:"⬡", weight:14 },
  { key:"work_life_balance",     label:"Work–Life Balance & Flexibility", short:"Balance & Flex",  sym:"◎", weight:14 },
  { key:"purpose_meaning",       label:"Purpose & Meaning",               short:"Purpose",         sym:"✦", weight:15 },
  { key:"leadership_quality",    label:"Leadership & Manager Quality",    short:"Leadership",      sym:"◇", weight:15 },
  { key:"brand_stability",       label:"Brand, Stability & Future",       short:"Brand & Stability",sym:"▲", weight:14 },
];

const RUBRICS = {
  compensation_rewards:{ exceptional:"Transparent pay bands in JDs; above-market cash + equity; pay-equity certifications; consistently positive comp reviews.", strong:"Competitive salaries cited; equity/bonus visible in JDs; annual reviews mentioned; benefits above industry norm.", average:"Market-rate claims; vague comp language; mixed pay reviews; no differentiated upside.", weak:"Below-market signals in reviews; JDs omit comp ranges; consistent pay complaints; bonus opacity.", poor:"Persistent underpay reports; no transparency; high pay-related attrition; wage freezes; legal incidents." },
  career_growth:{ exceptional:"Structured career ladders published; internal mobility >30%; stated learning budget; mentoring documented.", strong:"Learning stipends mentioned; career path framing in JDs; L&D programs referenced; positive growth reviews.", average:"Generic 'growth opportunities' language; some L&D mentions; mixed promotion reviews.", weak:"Stagnation complaints; promotions seem arbitrary; high mid-level attrition; few internal senior hires.", poor:"No career path visibility; execution-only JDs; consistent 'no growth' reviews; L&D absent." },
  culture_environment:{ exceptional:"Culture verified by employees; GPTW/DEIB certifications; psychological safety substantiated; Glassdoor >4.2.", strong:"Clear values in JDs; employee stories corroborate claims; inclusive language substantiated.", average:"Standard culture claims without third-party validation; mixed culture scores.", weak:"Culture claims contradict reviews; toxic manager reports; DEI as marketing vs practice.", poor:"Systemic complaints; discrimination incidents in news; Glassdoor <3; trust collapse." },
  work_life_balance:{ exceptional:"Remote/hybrid documented; no-meeting days; mandatory PTO; async-first verified; burnout prevention.", strong:"Flexible working in JDs; hybrid policy clear; positive WLB reviews; parental leave above statutory.", average:"Standard WLB claims; some flexibility; mixed after-hours expectations.", weak:"Overwork culture in reviews; hustle glorified; limited flexibility; burnout signals.", poor:"Consistent burnout reports; no flex options; long-hours rewarded; poor parental leave." },
  purpose_meaning:{ exceptional:"Mission embedded in JDs; impact stories verified; ESG with measurable outcomes; leaders articulate purpose.", strong:"Purpose language consistent; employee testimonials align; CSR programs referenced.", average:"Generic mission statements; purpose on website but not JDs; employees rarely mention.", weak:"Transactional employer brand; mission disconnected from work; no values alignment.", poor:"No mission articulated; execution-only JDs; news focused on profit/controversy." },
  leadership_quality:{ exceptional:"CEO/CHRO active on LinkedIn; manager scores >80%; leadership trust high; transparent decision-making.", strong:"Leaders visible; positive manager reviews dominant; leadership interviews credible.", average:"Leadership occasionally visible; manager quality mixed; some positive mentions.", weak:"Leadership opacity; micromanagement complaints; frequent reorgs; churn visible.", poor:"Leadership under scrutiny; manager abuse complaints; exits due to conduct; low trust." },
  brand_stability:{ exceptional:"Top employer awards; revenue/headcount growth public; strong media; employer brand campaigns.", strong:"Recognised brand in sector; stable or growing headcount; positive news; funded and growing.", average:"Known brand; no growth/decline signals; moderate talent market visibility.", weak:"Recent layoffs; shrinking headcount; negative news; brand under-investment.", poor:"Major layoff events; viability concerns; legal trouble; employer brand negative." },
};

const gradeFromScore = s => s>=93?"A+":s>=90?"A":s>=87?"A-":s>=83?"B+":s>=80?"B":s>=77?"B-":s>=73?"C+":s>=70?"C":s>=67?"C-":s>=60?"D+":s>=55?"D":"F";
const scoreColor = s => s>=86?T.green:s>=71?T.lime:s>=56?T.yellow:s>=31?T.orange:T.red;
const scoreLabel = s => s>=86?"Exceptional":s>=71?"Strong":s>=56?"Average":s>=31?"Weak":"Poor";
const bandKey    = s => s>=86?"exceptional":s>=71?"strong":s>=56?"average":s>=31?"weak":"poor";
const alignColor = a => a==="aligned"?T.green:a==="partial"?T.orange:T.red;
const alignBg    = a => a==="aligned"?T.greenFaint:a==="partial"?T.orangeFaint:T.redFaint;
const alignBorder= a => a==="aligned"?T.greenBorder:a==="partial"?T.orangeBorder:T.redBorder;
const tIcon      = t => t==="improving"?"↗":t==="declining"?"↘":"→";
const tColor     = t => t==="improving"?T.green:t==="declining"?T.red:T.yellow;
const clampW     = w => { const s=Object.values(w).reduce((a,b)=>a+b,0)||1; return Object.fromEntries(Object.entries(w).map(([k,v])=>[k,Math.round(v/s*100)])); };
const calcWeighted = (dims,weights) => { let t=0,ws=0; DIMS.forEach(d=>{t+=(dims[d.key]?.score??0)*(weights[d.key]??d.weight);ws+=weights[d.key]??d.weight;}); return ws?Math.round(t/ws):0; };

/* ─── InvokBiz SVG Logo ─────────────────────────────────── */
const InvokBizLogo = ({ size = 28 }) => (
  <img
    src="https://invokbiz.com/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-21-at-11.53.52-AM.jpeg"
    alt="InvokBiz"
    style={{ height: size, width: "auto", objectFit: "contain", display: "block" }}
  />
);

/* ─── System prompt ─────────────────────────────────────────── */
const SYSTEM = `You are a senior EVP analyst producing structured employer brand audit reports. Your analysis follows a two-track research methodology: (A) what the company CLAIMS, and (B) what people EXPERIENCE and PERCEIVE.

════════════════════════════════════
TRACK A — WHAT THE COMPANY CLAIMS
════════════════════════════════════
If a website URL is provided, fetch it directly. Then search for all of:
- Company website: home, about, culture, and careers pages
- Career/jobs page: stated benefits, values, EVP language
- Job descriptions: language, promises, requirements framing
- Leadership interviews & quotes: CEO, CHRO, founders in media
- Press releases, company-authored articles, LinkedIn company posts
- Awards claims (Great Place to Work, Best Employer, etc.)
- Investor/funding communications that reference people strategy

Search queries: "[company] careers page", "[company] CEO interview culture values", "[company] CHRO OR HR director quote", "[company] life at [company]", "[company] employer branding", "[company] job description 2024 2025", "[company] Great Place to Work"

════════════════════════════════════
TRACK B — WHAT PEOPLE EXPERIENCE & PERCEIVE
════════════════════════════════════
B1. EMPLOYEE EXPERIENCE (current & former employees):
- Glassdoor reviews (overall rating, CEO approval, sub-ratings)
- AmbitionBox reviews (salary, career growth, work-life balance)
- Blind / Reddit / LinkedIn comments from employees
- Employee posts and testimonials on social media

B2. CANDIDATE EXPERIENCE (job seekers):
- Interview reviews on Glassdoor ("interview experience")
- Candidate feedback on LinkedIn/Reddit/Quora
- Recruiting process perception, offer acceptance signals

B3. PUBLIC PERCEPTION (news, events, third-party):
- News about company layoffs, expansions, culture incidents
- How people discuss this company in relation to its news/events
- Analyst commentary on the company's talent practices
- Social media sentiment around company news

Search queries: "[company] Glassdoor reviews", "[company] AmbitionBox reviews", "[company] Blind reviews employees", "[company] interview experience Glassdoor", "[company] candidate experience", "[company] employee layoffs OR culture OR leadership 2024 2025", "[company] reddit employees", "[company] LinkedIn employee posts", "[company] news workplace 2024 2025"

Historical track B (for longitudinal):
- "[company] reviews 2022", "[company] glassdoor 2022", "[company] layoffs OR culture 2022"
- "[company] reviews 2024", "[company] news employer 2024"

════════════════════════════════════
SCORING & ANALYSIS RULES
════════════════════════════════════
SCORING: 86-100=Exceptional | 71-85=Strong | 56-70=Average | 31-55=Weak | 0-30=Poor
All 7 dimensions carry EQUAL WEIGHT in the overall score.

DATA CONFIDENCE: "high"=5+ independent signals from multiple source types | "medium"=2-4 signals | "low"=1-2 weak signals | "none"=nothing found
RED FLAG: data_confidence "low" or "none" → is_red_flag=true. A well-designed EVP must be visible in the public domain across ALL 7 dimensions. Absence = gap.

ALIGNMENT STATUS per dimension:
- "aligned": external experience data confirms the claim
- "partial": partial match; claim exists but only some evidence supports it
- "misaligned": claim contradicts reality, OR no claim AND external sentiment is negative

STRENGTHS/GAPS: Each bullet must cite source type in parentheses: (website), (JD), (Glassdoor), (AmbitionBox), (LinkedIn), (news), (candidate review), (social), (interview), (article) etc.

RECOMMENDATIONS: Must be detailed and actionable — at least 3 sentences per recommendation. Explain WHAT to do, WHY it matters based on the evidence, and HOW to execute it. Reference the specific findings that prompted the recommendation.

LONGITUDINAL — reconstruct attractiveness at 3 snapshots using dated signals:
- three_years_ago (~2022): use 2022-era reviews, news, employer brand signals
- one_year_ago (~2024): use 2024-era reviews, news, hiring signals
- now (2025): current state from all sources
trajectory = direction from that period TO the next period.

Return ONLY valid JSON. No markdown. Start with { end with }.

{
  "company_name": "string",
  "country": "string",
  "industry": "string",
  "company_size": "string",
  "company_overview": "string (3 sentences covering business, scale, and talent market position)",
  "overall_score": number,
  "grade": "A+|A|A-|B+|B|B-|C+|C|C-|D+|D|F",
  "overall_claimed_score": number,
  "credibility_index": number,
  "audit_summary": "string (4-5 sentences synthesising both tracks — what they claim vs what people actually experience)",
  "top_strength": "dimension_key",
  "critical_gap": "dimension_key",
  "red_flag_count": number,
  "signals_count": number,
  "methodology_note": "string — 3-4 sentences describing the research approach: sources consulted, recency of data, confidence level, any significant data limitations",
  "priority_interventions": [
    "string — detailed intervention with what/why/how and evidence reference",
    "string", "string", "string", "string"
  ],
  "longitudinal": {
    "three_years_ago": { "period":"~2022", "attractiveness_score":number, "trajectory":"improving|stable|declining", "key_signals":["string (year, source type)"], "narrative":"string (3 sentences on employer brand state in 2022)" },
    "one_year_ago":    { "period":"~2024", "attractiveness_score":number, "trajectory":"improving|stable|declining", "key_signals":["string (year, source type)"], "narrative":"string (3 sentences on employer brand state in 2024)" },
    "now":             { "period":"2025",  "attractiveness_score":number, "trajectory":"improving|stable|declining", "key_signals":["string (year, source type)"], "narrative":"string (3 sentences on current employer brand state)" }
  },
  "dimensions": {
    "compensation_rewards": {
      "label": "Compensation & Rewards",
      "score": number,
      "claimed_score": number,
      "industry_average": number,
      "data_confidence": "high|medium|low|none",
      "is_red_flag": boolean,
      "red_flag_reason": "string|null",
      "alignment_status": "aligned|partial|misaligned",
      "the_claim": "string — synthesise what website, JDs, leadership quotes, and company content say about this dimension. Note absence if nothing found.",
      "the_reality": "string — synthesise what employee reviews, candidate reviews, news, and public perception reveal. Note absence if nothing found.",
      "alignment_narrative": "string — 2 sentences explaining the gap or alignment between claim and reality",
      "strengths": ["string with (source)", "string with (source)"],
      "gaps": ["string with (source)", "string with (source)"],
      "recommendations": ["detailed recommendation 1 — what/why/how (3+ sentences)", "detailed recommendation 2 — what/why/how (3+ sentences)"]
    },
    "career_growth":       { "label":"Career Growth & Development",     "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] },
    "culture_environment": { "label":"Culture & Work Environment",      "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] },
    "work_life_balance":   { "label":"Work-Life Balance & Flexibility",  "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] },
    "purpose_meaning":     { "label":"Purpose & Meaning",               "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] },
    "leadership_quality":  { "label":"Leadership & Manager Quality",    "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] },
    "brand_stability":     { "label":"Brand, Stability & Future",       "score":0,"claimed_score":0,"industry_average":0,"data_confidence":"none","is_red_flag":true,"red_flag_reason":"","alignment_status":"misaligned","the_claim":"","the_reality":"","alignment_narrative":"","strengths":[],"gaps":[],"recommendations":[] }
  }
}`;

/* ─── Global styles ─────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes stepIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
  .report-section{animation:fadeUp 0.4s ease;}
  input:focus{outline:2px solid ${T.brand}; outline-offset:0;}
  button:hover{opacity:0.87;}
  a{color:${T.brand};text-decoration:none;} a:hover{text-decoration:underline;}
  ::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:#f1f5f9;} ::-webkit-scrollbar-thumb{background:#d96029;border-radius:10px;opacity:0.5;}
  
  /* Responsive utilities */
  @media (max-width: 640px) {
    .hide-mobile { display: none !important; }
    .stack-mobile { flex-direction: column !important; }
    .full-mobile { width: 100% !important; min-width: unset !important; }
    .grid-1-mobile { grid-template-columns: 1fr !important; }
    .text-sm-mobile { font-size: 11px !important; }
    .p-sm-mobile { padding: 16px !important; }
  }
  @media (max-width: 768px) {
    .hide-tablet { display: none !important; }
    .stack-tablet { flex-direction: column !important; }
    .grid-1-tablet { grid-template-columns: 1fr !important; }
  }
`;

/* ─── Shared UI helpers ────────────────────────────────────── */
const Divider = () => <div style={{height:1,background:T.border,margin:"32px 0"}}/>;

const SectionLabel = ({n, title}) => (
  <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:24}}>
    <span style={{fontFamily:"'Sora',sans-serif",fontSize:11,color:T.brand,letterSpacing:"0.06em",fontWeight:600}}>§ {String(n).padStart(2,"0")}</span>
    <span style={{fontSize:18,fontWeight:700,color:T.ink1,fontFamily:"'Sora',sans-serif",letterSpacing:"-0.02em"}}>{title}</span>
  </div>
);

const ScoreBar = ({ score, industry, max=100 }) => {
  const col = scoreColor(score);
  return (
    <div style={{position:"relative",height:6,background:T.border,borderRadius:3,overflow:"visible"}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${(score/max)*100}%`,background:col,borderRadius:3,transition:"width 0.8s ease"}}/>
      {industry>0&&(
        <div style={{position:"absolute",top:-3,width:2,height:12,background:T.violet,borderRadius:1,left:`${(industry/max)*100}%`,transform:"translateX(-50%)"}}
          title={`Industry avg: ${industry}`}/>
      )}
    </div>
  );
};

function RubricToggle({ dimKey, score }) {
  const [open, setOpen] = useState(false);
  const rubric = RUBRICS[dimKey]; if(!rubric)return null;
  const active = bandKey(score);
  const order  = ["exceptional","strong","average","weak","poor"];
  const cols   = {exceptional:T.green,strong:T.lime,average:T.yellow,weak:T.orange,poor:T.red};
  const ranges = {exceptional:"86–100",strong:"71–85",average:"56–70",weak:"31–55",poor:"0–30"};
  return (
    <div style={{marginTop:10}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:"none",border:`1px solid ${T.border}`,borderRadius:5,padding:"4px 12px",fontSize:11,color:T.ink3,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",letterSpacing:"0.02em"}}>
        {open?"▲ hide rubric":"▼ view scoring rubric"}
      </button>
      {open&&(
        <div style={{marginTop:10,borderRadius:8,overflow:"hidden",border:`1px solid ${T.border}`}}>
          {order.map(b=>{
            const isA=b===active,col=cols[b];
            return(
              <div key={b} style={{display:"flex",gap:12,padding:"9px 14px",background:isA?`${col}12`:"#fff",borderBottom:`1px solid ${T.border}`}}>
                <div style={{minWidth:86,flexShrink:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:isA?col:T.ink4,fontFamily:"'Sora',sans-serif",textTransform:"uppercase"}}>{b} {isA&&"◀"}</div>
                  <div style={{fontSize:9,color:T.ink4,fontFamily:"'DM Sans',sans-serif"}}>{ranges[b]}</div>
                </div>
                <span style={{fontSize:11,color:isA?T.ink1:T.ink3,lineHeight:1.65,fontFamily:"'DM Sans',sans-serif"}}>{rubric[b]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function EVPAuditTool() {
  const [company,    setCompany]    = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phase,      setPhase]      = useState("idle");
  const [steps,      setSteps]      = useState([]);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState("");
  const defW = Object.fromEntries(DIMS.map(d=>[d.key,d.weight]));
  const [weights, setWeights] = useState(defW);
  const [showWeights, setShowWeights] = useState(false);
  const reportRef = useRef(null);

  const runAudit = async () => {
    if(!company.trim())return;
    setPhase("researching"); setSteps([]); setResults(null); setError("");
    const websiteClause = websiteUrl.trim()
      ? `The company's website URL is: ${websiteUrl.trim()} — fetch this URL directly as your first step, then also fetch the /about, /careers, /jobs sub-pages if they exist.`
      : `No website URL was provided — search for the company's website and careers page using web search.`;
    const pSteps = [
      websiteUrl.trim() ? `Fetching company website — ${websiteUrl.trim()}` : "Searching for company website & careers page",
      "Reading careers page, JDs & leadership content",
      "Aggregating employee reviews — Glassdoor · AmbitionBox · Blind",
      "Gathering candidate experience signals",
      "Monitoring social & news — LinkedIn · press · events",
      "Benchmarking against industry averages",
      "Scoring 7 EVP dimensions — claimed vs experienced",
      "Reconstructing historical attractiveness — 2022 · 2024 · 2025",
    ];
    for(let i=0;i<pSteps.length;i++){await new Promise(r=>setTimeout(r,750));setSteps(p=>[...p,pSteps[i]]);}
   try {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.REACT_APP_GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Conduct a comprehensive EVP audit for: ${company.trim()}\n\n${websiteClause}\n\nFollow the two-track research methodology exactly:\nTrack A (claims): fetch and read the website, careers page, job descriptions, and any leadership interviews or company-authored content.\nTrack B (experience & perception): search for employee reviews, candidate experience, and public perception of news/events.\n\nFor each dimension find minimum 3 evidence points with source attribution. Estimate realistic industry_average benchmarks for this company's sector. Write detailed recommendations (what/why/how, 3+ sentences each). For the historical section search specifically for 2022 and 2024 dated signals. Rank priority_interventions from most to least critical.` }
      ],
    }),
  });

  if(!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  const txt  = data.choices[0].message.content;
  const cl   = txt.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
  const s = cl.indexOf("{"), e = cl.lastIndexOf("}");
  if(s === -1 || e === -1) throw new Error("No JSON in response");
  setResults(JSON.parse(cl.slice(s, e+1)));
  setPhase("complete");
} catch(e){ setError(e.message||"Audit failed"); setPhase("error"); }
  };

  const root = {minHeight:"100vh",background:T.bg,fontFamily:"'DM Sans',sans-serif",color:T.ink1};

  /* ── IDLE ────────────────────────────────────────────────── */
  if(phase==="idle") return(
    <div style={{...root,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#f9fafb"}}>
      <style>{GLOBAL_STYLES}</style>

      {/* Hero section */}
      <div style={{width:"100%",maxWidth:680,padding:"clamp(24px,5vw,60px) clamp(16px,4vw,32px)",animation:"fadeUp 0.7s ease",textAlign:"center"}}>

        {/* Logo mark */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:10,background:T.white,border:`1px solid ${T.brandBorder}`,borderRadius:40,padding:"8px 20px 8px 12px",boxShadow:`0 2px 12px rgba(217,96,41,0.12)`}}>
            <InvokBizLogo size={28} />
            <span style={{width:1,height:18,background:T.borderDark,margin:"0 2px"}}/>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink4,letterSpacing:"0.08em",fontWeight:500}}>EVP INTELLIGENCE</span>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(28px,6vw,52px)",fontWeight:800,lineHeight:1.08,marginBottom:16,letterSpacing:"-0.03em",color:T.ink1}}>
          Employer Value<br/>
          <span style={{color:T.brand,display:"inline-block",background:`linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Proposition Audit</span>
        </h1>

        <p style={{fontSize:"clamp(13px,2.5vw,15px)",color:T.ink3,lineHeight:1.8,marginBottom:36,maxWidth:500,margin:"0 auto 36px",fontFamily:"'DM Sans',sans-serif",fontWeight:400}}>
          Evidence-based EVP scoring across 7 dimensions. Rubric-graded · Industry-benchmarked · Claims vs reality · Historical trajectory.
        </p>

        {/* Form card */}
        <div style={{background:T.white,border:`1px solid ${T.border}`,borderRadius:16,padding:"clamp(20px,4vw,32px)",boxShadow:"0 4px 24px rgba(0,0,0,0.06)",maxWidth:520,margin:"0 auto",textAlign:"left"}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:T.ink3,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",fontWeight:600,textTransform:"uppercase"}}>Company Name *</label>
              <input
                value={company}
                onChange={e=>setCompany(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&company.trim()&&runAudit()}
                placeholder="e.g. Zomato, Infosys, HDFC Bank"
                style={{padding:"13px 16px",fontSize:14,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.ink1,background:"#fff",fontFamily:"'DM Sans',sans-serif",transition:"border-color 0.2s"}}
              />
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,color:T.ink3,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",fontWeight:600,textTransform:"uppercase"}}>
                Company Website
                <span style={{color:T.ink4,fontWeight:400,marginLeft:6,textTransform:"none",letterSpacing:"normal",fontSize:10}}>— optional, recommended</span>
              </label>
              <input
                value={websiteUrl}
                onChange={e=>setWebsiteUrl(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&company.trim()&&runAudit()}
                placeholder="https://company.com"
                style={{padding:"13px 16px",fontSize:14,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.ink1,background:"#fff",fontFamily:"'DM Sans',sans-serif"}}
              />
              <span style={{fontSize:11,color:T.ink4,paddingLeft:2,fontFamily:"'DM Sans',sans-serif"}}>We'll fetch the website, careers page and job descriptions directly.</span>
            </div>

            <button
              onClick={runAudit}
              disabled={!company.trim()}
              style={{
                padding:"14px",
                background:company.trim()?`linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`:"#e2e8f0",
                color:company.trim()?"#fff":T.ink4,
                border:"none",borderRadius:10,fontSize:14,fontWeight:700,
                fontFamily:"'Sora',sans-serif",
                cursor:company.trim()?"pointer":"not-allowed",
                letterSpacing:"0.04em",
                boxShadow:company.trim()?`0 4px 16px rgba(217,96,41,0.35)`:"none",
                transition:"all 0.2s",marginTop:4,
              }}
            >
              Launch Audit ▶
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:28,flexWrap:"wrap"}}>
          {["Rubric scoring","Industry benchmark","Red flag detection","Historical audit","Weighted score"].map(s=>(
            <span key={s} style={{fontSize:10,color:T.ink4,fontFamily:"'DM Sans',sans-serif",background:"#fff",border:`1px solid ${T.border}`,padding:"4px 10px",borderRadius:20}}>· {s}</span>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── RESEARCHING ─────────────────────────────────────────── */
  if(phase==="researching") return(
    <div style={{...root,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{maxWidth:520,width:"100%",padding:"0 clamp(16px,4vw,24px)",textAlign:"center"}}>
        {/* Animated logo spinner */}
        <div style={{position:"relative",width:56,height:56,margin:"0 auto 24px"}}>
          <div style={{width:56,height:56,border:`3px solid ${T.border}`,borderTopColor:T.brand,borderRadius:"50%",animation:"spin 1s linear infinite",position:"absolute"}}/>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)"}}>
            <InvokBizLogo size={28}/>
          </div>
        </div>

        <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,fontWeight:700,color:T.ink1,marginBottom:5}}>
          Auditing <span style={{color:T.brand}}>{company}</span>
        </h2>
        {websiteUrl&&<p style={{fontSize:12,color:T.ink4,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>{websiteUrl}</p>}
        <p style={{fontSize:13,color:T.ink3,marginBottom:28,fontFamily:"'DM Sans',sans-serif"}}>Multi-source intelligence gathering in progress…</p>

        <div style={{textAlign:"left"}}>
          {steps.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:"#fff",borderRadius:7,marginBottom:6,border:`1px solid ${i===steps.length-1?T.brandBorder:T.border}`,animation:"stepIn 0.35s ease"}}>
              <span style={{fontSize:11,color:T.brand,fontFamily:"'Sora',sans-serif",animation:i===steps.length-1?"pulse 1.3s ease infinite":"none"}}>{i===steps.length-1?"►":"✓"}</span>
              <span style={{fontSize:12,color:i===steps.length-1?T.ink1:T.ink3,fontFamily:"'DM Sans',sans-serif"}}>{s}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:11,color:T.ink4,marginTop:20,fontFamily:"'DM Sans',sans-serif"}}>Deep audit · 45–90 seconds</p>
      </div>
    </div>
  );

  /* ── ERROR ───────────────────────────────────────────────── */
  if(phase==="error") return(
    <div style={{...root,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{textAlign:"center",maxWidth:400,padding:"0 24px"}}>
        <div style={{fontSize:40,marginBottom:16}}>⚠</div>
        <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:20,marginBottom:10,color:T.red}}>Audit Failed</h2>
        <p style={{fontSize:13,color:T.ink2,marginBottom:24,fontFamily:"'DM Sans',sans-serif"}}>{error}</p>
        <button onClick={()=>setPhase("idle")} style={{background:`linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontSize:13,fontWeight:700,fontFamily:"'Sora',sans-serif",cursor:"pointer"}}>← Try Again</button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     COMPLETE — REPORT VIEW
  ══════════════════════════════════════════════════════════ */
  const R = results;
  const normW   = clampW(weights);
  const wScore  = R?calcWeighted(R.dimensions,normW):0;
  const rfCount = R?DIMS.filter(d=>R.dimensions?.[d.key]?.is_red_flag).length:0;
  const barData = R?DIMS.map(d=>({name:d.short,score:R.dimensions?.[d.key]?.score??0,industry:R.dimensions?.[d.key]?.industry_average??0})):[];
  const today   = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"});
  const totalSources = R ? Object.values(R.sources||{}).reduce((a,arr)=>a+(arr?.length??0),0) : 0;

  return (
    <div style={root} ref={reportRef}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── Top nav bar ── */}
      <div style={{
        background:"#fff",
        borderBottom:`1px solid ${T.border}`,
        padding:"0 clamp(12px,3vw,24px)",
        display:"flex",
        alignItems:"center",
        justifyContent:"space-between",
        position:"sticky",
        top:0,
        zIndex:100,
        height:52,
        gap:8,
      }}>
        {/* Left: Logo + company */}
        <div style={{display:"flex",alignItems:"center",gap:clamp(8,16)}}>
          <InvokBizLogo size={24}/>
          <span style={{color:T.border,margin:"0 4px"}}>·</span>
          <span style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(12px,2.5vw,14px)",fontWeight:700,color:T.ink1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"clamp(80px,20vw,200px)"}}>
            {R?.company_name}
          </span>
          {rfCount>0 && (
            <span style={{fontSize:10,color:T.red,background:T.redFaint,border:`1px solid ${T.redBorder}`,padding:"2px 8px",borderRadius:10,fontFamily:"'Sora',sans-serif",fontWeight:600,whiteSpace:"nowrap"}}>
              ⚑ {rfCount} flag{rfCount>1?"s":""}
            </span>
          )}
        </div>

        {/* Right: weighted + new audit */}
        <div style={{display:"flex",gap:clamp(6,12),alignItems:"center",flexShrink:0}}>
          <span style={{fontSize:11,color:T.ink4,fontFamily:"'DM Sans',sans-serif"}} className="hide-mobile">
            Weighted: <span style={{color:scoreColor(wScore),fontWeight:700,fontFamily:"'Sora',sans-serif"}}>{wScore}</span>
          </span>
          <button
            onClick={()=>{setPhase("idle");setCompany("");setWebsiteUrl("");}}
            style={{background:"#fff",color:T.brand,border:`1.5px solid ${T.brand}`,borderRadius:6,padding:"5px clamp(8px,2vw,13px)",fontSize:"clamp(9px,2vw,11px)",fontFamily:"'Sora',sans-serif",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}
          >
            ← New Audit
          </button>
        </div>
      </div>

      {/* ── Report container ── */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"clamp(20px,4vw,36px) clamp(16px,4vw,24px) 80px"}}>

        {/* ─── Report header ─────────────────────────────────── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:T.brand,fontFamily:"'Sora',sans-serif",marginBottom:6,letterSpacing:"0.06em",fontWeight:600,textTransform:"uppercase"}}>Employer Brand Audit</div>
            <h2 style={{fontFamily:"'Sora',sans-serif",fontSize:"clamp(22px,4vw,28px)",fontWeight:800,color:T.ink1,letterSpacing:"-0.03em"}}>{R?.company_name}</h2>
            <div style={{fontSize:13,color:T.ink3,marginTop:4,fontFamily:"'DM Sans',sans-serif"}}>{R?.country||"—"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:T.ink4,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>Industry · Size</div>
            <div style={{fontSize:13,color:T.ink2,fontFamily:"'DM Sans',sans-serif"}}>{R?.industry||"—"} · {R?.company_size||"—"}</div>
            <div style={{fontSize:11,color:T.ink4,marginTop:6,fontFamily:"'DM Sans',sans-serif"}}>Audit date</div>
            <div style={{fontSize:13,color:T.ink2,fontFamily:"'DM Sans',sans-serif"}}>{today}</div>
          </div>
        </div>

        <Divider/>

        {/* ─── § 01  Overall Attractiveness Index ────────────── */}
        <div className="report-section">
          <SectionLabel n={1} title="Overall Attractiveness Index"/>

          <div style={{display:"flex",gap:clamp(16,28),alignItems:"flex-start",flexWrap:"wrap",marginBottom:24}}>
            {/* Big score */}
            <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:12,padding:"24px clamp(16px,4vw,28px)",minWidth:clamp(160,180),textAlign:"center",flexShrink:0}} className="full-mobile">
              <div style={{fontSize:11,color:T.ink4,fontFamily:"'Sora',sans-serif",marginBottom:6,letterSpacing:"0.08em",fontWeight:600,textTransform:"uppercase"}}>Overall Score</div>
              <div style={{fontSize:"clamp(52px,10vw,72px)",fontFamily:"'Sora',sans-serif",fontWeight:800,color:scoreColor(R?.overall_score??0),lineHeight:1}}>{R?.overall_score??0}</div>
              <div style={{fontSize:12,color:T.ink3,marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>/ 100 · simple avg</div>
              <div style={{display:"inline-block",marginTop:10,background:`linear-gradient(135deg, ${T.brand} 0%, ${T.brandDark} 100%)`,color:"#fff",borderRadius:6,padding:"4px 14px",fontSize:14,fontWeight:700,fontFamily:"'Sora',sans-serif"}}>
                Grade {R?.grade||gradeFromScore(R?.overall_score??0)}
              </div>
              <div style={{marginTop:14,display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                {[["CLAIMED",R?.overall_claimed_score??0,T.brand],["CREDIBILITY",R?.credibility_index??0,scoreColor(R?.credibility_index??0)],["WEIGHTED",wScore,scoreColor(wScore)]].map(([lbl,val,col])=>(
                  <div key={lbl} style={{textAlign:"center"}}>
                    <div style={{fontSize:9,color:T.ink4,fontFamily:"'Sora',sans-serif",fontWeight:600,letterSpacing:"0.06em"}}>{lbl}</div>
                    <div style={{fontSize:18,fontFamily:"'Sora',sans-serif",fontWeight:700,color:col}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary + bar chart */}
            <div style={{flex:1,minWidth:clamp(240,260)}}>
              <p style={{fontSize:13,color:T.ink2,lineHeight:1.8,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>{R?.audit_summary}</p>
              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"16px clamp(10px,3vw,14px)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:6}}>
                  <div style={{fontSize:10,color:T.ink4,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",fontWeight:600}}>DIMENSION PROFILE</div>
                  <div style={{display:"flex",gap:14}}>
                    <span style={{fontSize:10,color:T.ink2,fontFamily:"'DM Sans',sans-serif"}}>— Company</span>
                    <span style={{fontSize:10,color:T.violet,fontFamily:"'DM Sans',sans-serif"}}>| Industry avg</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} layout="vertical" margin={{left:0,right:30,top:0,bottom:0}}>
                    <XAxis type="number" domain={[0,100]} tick={{fontSize:9,fill:T.ink4}} tickLine={false}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:T.ink2,fontFamily:"'DM Sans',sans-serif"}} width={82} tickLine={false} axisLine={false}/>
                    <Tooltip contentStyle={{fontSize:12,fontFamily:"'DM Sans',sans-serif",border:`1px solid ${T.border}`,borderRadius:6}} labelStyle={{color:T.ink1}}/>
                    <Bar dataKey="score" radius={[0,3,3,0]} maxBarSize={14}>
                      {barData.map((e,i)=><Cell key={i} fill={scoreColor(e.score)}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Weighted score config toggle */}
          <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
            <button onClick={()=>setShowWeights(o=>!o)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:12,color:T.ink3}}>
              <span>⚖ Configure Weighted Score — current: <strong style={{color:scoreColor(wScore),fontFamily:"'Sora',sans-serif"}}>{wScore}</strong> ({scoreLabel(wScore)})</span>
              <span>{showWeights?"▲":"▼"}</span>
            </button>
            {showWeights&&(
              <div style={{padding:"16px 18px",borderTop:`1px solid ${T.border}`}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"10px 24px"}}>
                  {DIMS.map(d=>(
                    <div key={d.key} style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:12,color:T.ink2,minWidth:110,fontFamily:"'DM Sans',sans-serif"}}>{d.short}</span>
                      <input type="range" min={0} max={40} value={weights[d.key]??d.weight} onChange={e=>setWeights(w=>({...w,[d.key]:parseInt(e.target.value)}))} style={{flex:1,accentColor:T.brand}}/>
                      <span style={{fontSize:11,fontFamily:"'Sora',sans-serif",color:T.brand,fontWeight:600,minWidth:28,textAlign:"right"}}>{normW[d.key]}%</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setWeights(defW)} style={{marginTop:10,background:"none",border:`1px solid ${T.border}`,borderRadius:5,padding:"4px 12px",fontSize:11,color:T.ink3,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>reset defaults</button>
              </div>
            )}
          </div>
        </div>

        <Divider/>

        {/* ─── § 02  Dimension Deep-Dive ─────────────────────── */}
        <div className="report-section">
          <SectionLabel n={2} title="Dimension Deep-Dive"/>
          <div style={{fontSize:11,color:T.ink4,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>{DIMS.length} dimensions</div>

          {DIMS.map((d,idx)=>{
            const dim = R?.dimensions?.[d.key]; if(!dim)return null;
            const vs = dim.score-(dim.industry_average||0);
            return(
              <div key={d.key} style={{background:"#fff",border:`1px solid ${dim.is_red_flag?T.redBorder:T.border}`,borderRadius:12,padding:"clamp(14px,3vw,22px) clamp(16px,4vw,24px)",marginBottom:12,position:"relative"}}>
                <div style={{position:"absolute",top:22,right:22,fontSize:11,color:T.ink4,fontFamily:"'DM Sans',sans-serif"}} className="hide-mobile">{String(idx+1).padStart(2,"0")} / 0{DIMS.length}</div>

                <div style={{display:"flex",alignItems:"flex-start",gap:clamp(10,16),marginBottom:14,flexWrap:"wrap"}}>
                  <div style={{textAlign:"center",minWidth:56}}>
                    <div style={{fontSize:"clamp(32px,7vw,40px)",fontFamily:"'Sora',sans-serif",fontWeight:800,color:scoreColor(dim.score),lineHeight:1}}>{dim.score}</div>
                    <div style={{fontSize:9,color:scoreColor(dim.score),fontFamily:"'Sora',sans-serif",marginTop:2,textTransform:"uppercase",fontWeight:600}}>{scoreLabel(dim.score)}</div>
                  </div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6}}>
                      <span style={{fontSize:"clamp(13px,3vw,16px)",fontWeight:700,color:T.ink1,fontFamily:"'Sora',sans-serif"}}>{dim.label}</span>
                      {dim.is_red_flag&&<span style={{fontSize:10,color:T.red,background:T.redFaint,border:`1px solid ${T.redBorder}`,padding:"2px 8px",borderRadius:10,fontFamily:"'Sora',sans-serif",fontWeight:600}}>⚑ RED FLAG</span>}
                      <span style={{fontSize:10,color:T.ink4,fontFamily:"'DM Sans',sans-serif",background:"#f8fafc",padding:"2px 8px",borderRadius:4,border:`1px solid ${T.border}`}}>
                        {dim.data_confidence?.toUpperCase()} CONF
                      </span>
                    </div>
                    <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:T.ink3,fontFamily:"'DM Sans',sans-serif"}}>Industry avg: {dim.industry_average??"-"}</span>
                      <span style={{fontSize:11,fontFamily:"'Sora',sans-serif",fontWeight:600,color:vs>0?T.green:vs<0?T.red:T.ink3}}>
                        {vs>0?`+${vs} above`:vs<0?`${vs} below`:"At avg"}
                      </span>
                      <span style={{fontSize:11,color:T.ink3,fontFamily:"'DM Sans',sans-serif"}}>Weight: {normW[d.key]}%</span>
                    </div>
                    <ScoreBar score={dim.score} industry={dim.industry_average}/>
                  </div>
                </div>

                {dim.is_red_flag&&(
                  <div style={{background:T.redFaint,border:`1px solid ${T.redBorder}`,borderRadius:7,padding:"8px 12px",marginBottom:12,fontSize:12,color:T.red,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>
                    <strong style={{fontFamily:"'Sora',sans-serif"}}>⚑ Missing EVP signal:</strong> {dim.red_flag_reason||"No meaningful public signals found."}
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}} className="grid-1-mobile">
                  <div>
                    <div style={{fontSize:10,color:T.green,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",marginBottom:8,fontWeight:600}}>STRENGTHS</div>
                    {(dim.strengths||[]).length===0
                      ?<div style={{fontSize:12,color:T.ink4,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>None identified</div>
                      :(dim.strengths||[]).map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:12,color:T.ink2,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>
                          <span style={{color:T.green,flexShrink:0,marginTop:1,fontWeight:700}}>+</span>{s}
                        </div>
                      ))}
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.red,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",marginBottom:8,fontWeight:600}}>GAPS</div>
                    {(dim.gaps||[]).length===0
                      ?<div style={{fontSize:12,color:T.ink4,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>None identified</div>
                      :(dim.gaps||[]).map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:8,marginBottom:7,fontSize:12,color:T.ink2,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}>
                          <span style={{color:T.red,flexShrink:0,marginTop:1,fontWeight:700}}>−</span>{s}
                        </div>
                      ))}
                  </div>
                </div>

                {(dim.recommendations||[]).length>0&&(
                  <div style={{background:"#f8fafc",borderRadius:7,padding:"10px 14px",marginBottom:10}}>
                    <div style={{fontSize:10,color:T.ink4,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",marginBottom:6,fontWeight:600}}>RECOMMENDED MOVES</div>
                    {(dim.recommendations||[]).map((s,i)=>(
                      <div key={i} style={{fontSize:12,color:T.ink1,marginBottom:5,lineHeight:1.6,display:"flex",gap:8,fontFamily:"'DM Sans',sans-serif"}}>
                        <span style={{color:T.brand,flexShrink:0,fontWeight:700,fontFamily:"'Sora',sans-serif"}}>{i+1}.</span>{s}
                      </div>
                    ))}
                  </div>
                )}

                <RubricToggle dimKey={d.key} score={dim.score}/>
              </div>
            );
          })}
        </div>

        <Divider/>

        {/* ─── § 03  Actual vs Plan ──────────────────────────── */}
        <div className="report-section">
          <SectionLabel n={3} title="Actual vs. Plan"/>
          <div style={{fontSize:13,color:T.ink2,lineHeight:1.7,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>
            Claims vs. Reality — What the company says on its website and in job descriptions, compared to what external signals actually show.
          </div>

          {DIMS.map((d,i)=>{
            const dim = R?.dimensions?.[d.key]; if(!dim)return null;
            const ac = dim.alignment_status||"partial";
            return(
              <div key={d.key} style={{marginBottom:10,border:`1px solid ${alignBorder(ac)}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",background:alignBg(ac),flexWrap:"wrap"}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:T.ink4}} className="hide-mobile">{String(i+1).padStart(2,"0")} · Dimension</span>
                  <span style={{fontWeight:700,color:T.ink1,flex:1,fontFamily:"'Sora',sans-serif",fontSize:13}}>{dim.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:alignColor(ac),fontFamily:"'Sora',sans-serif",textTransform:"capitalize",background:"#fff",padding:"3px 10px",borderRadius:10,border:`1px solid ${alignBorder(ac)}`,whiteSpace:"nowrap"}}>
                    {ac==="aligned"?"Aligned":ac==="partial"?"Partial":"Misaligned"}
                  </span>
                </div>
                <div style={{padding:"14px 16px",background:"#fff",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}} className="grid-1-mobile">
                  <div>
                    <div style={{fontSize:10,color:T.brand,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",marginBottom:5,fontWeight:600}}>THE CLAIM</div>
                    <p style={{fontSize:12,color:T.ink2,lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>{dim.the_claim||"—"}</p>
                  </div>
                  <div>
                    <div style={{fontSize:10,color:T.ink4,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",marginBottom:5,fontWeight:600}}>THE REALITY</div>
                    <p style={{fontSize:12,color:T.ink2,lineHeight:1.7,fontFamily:"'DM Sans',sans-serif"}}>{dim.the_reality||"—"}</p>
                  </div>
                </div>
                {dim.alignment_narrative&&(
                  <div style={{padding:"8px 16px 12px",background:"#fafafa",borderTop:`1px solid ${T.border}`}}>
                    <p style={{fontSize:12,color:T.ink3,lineHeight:1.65,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>{dim.alignment_narrative}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Divider/>

        {/* ─── § 04  Priority Interventions ─────────────────── */}
        <div className="report-section">
          <SectionLabel n={4} title="Priority Interventions"/>
          <div style={{fontSize:11,color:T.ink4,marginBottom:18,fontFamily:"'DM Sans',sans-serif"}}>Top {(R?.priority_interventions||[]).length} · ranked</div>
          {(R?.priority_interventions||[]).map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,padding:"clamp(10px,3vw,14px) 16px",background:"#fff",border:`1px solid ${T.border}`,borderRadius:9,marginBottom:8}}>
              <div style={{minWidth:32,height:32,borderRadius:"50%",background:i===0?T.red:i===1?T.orange:i===2?T.yellow:T.brandFaint,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontSize:12,fontWeight:700,color:i<=2?"#fff":T.brand,fontFamily:"'Sora',sans-serif"}}>{String(i+1).padStart(2,"0")}</span>
              </div>
              <p style={{fontSize:13,color:T.ink1,lineHeight:1.7,paddingTop:4,fontFamily:"'DM Sans',sans-serif"}}>{s}</p>
            </div>
          ))}
        </div>

        <Divider/>

        {/* ─── § 05  Historical Attractiveness ──────────────── */}
        <div className="report-section">
          <SectionLabel n={5} title="Historical Attractiveness Audit"/>
          <p style={{fontSize:13,color:T.ink2,lineHeight:1.7,marginBottom:20,fontFamily:"'DM Sans',sans-serif"}}>
            Retrospective EVP attractiveness reconstructed at three snapshots — <strong style={{fontFamily:"'Sora',sans-serif"}}>3 years ago · 1 year ago · now</strong> — using dated review data, archived news, and period-specific employer brand signals.
          </p>

          {R?.longitudinal&&(()=>{
            const L = R.longitudinal;
            const periods = [
              {key:"three_years_ago",label:"3 Years Ago",sub:"~2022"},
              {key:"one_year_ago",   label:"1 Year Ago", sub:"~2024"},
              {key:"now",            label:"Now",        sub:"2025"},
            ];
            const s3=L.three_years_ago?.attractiveness_score??0;
            const s1=L.one_year_ago?.attractiveness_score??0;
            const sN=L.now?.attractiveness_score??0;
            const netDelta=sN-s3;
            const td=[{t:"~2022",score:s3},{t:"~2024",score:s1},{t:"Now",score:sN}];

            return(<>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:16}}>
                {[["3 yrs → 1 yr",s1-s3],["1 yr → Now",sN-s1],["Net (3y)",netDelta]].map(([lbl,d])=>(
                  <div key={lbl} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,padding:"11px 14px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:T.ink4,fontFamily:"'DM Sans',sans-serif",marginBottom:4}}>{lbl}</div>
                    <div style={{fontSize:"clamp(20px,5vw,24px)",fontFamily:"'Sora',sans-serif",fontWeight:800,color:d>0?T.green:d<0?T.red:T.ink3,lineHeight:1}}>{d>0?`+${d}`:d}</div>
                    <div style={{fontSize:11,color:d>0?T.green:d<0?T.red:T.ink3,marginTop:3,fontFamily:"'DM Sans',sans-serif"}}>{d>0?"improved":d<0?"declined":"no change"}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
                {periods.map(p=>{
                  const data=L[p.key]; if(!data)return null;
                  const tc=tColor(data.trajectory);
                  return(
                    <div key={p.key} style={{flex:1,minWidth:clamp(160,200),background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"clamp(12px,3vw,16px) clamp(14px,3vw,18px)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div style={{fontSize:10,color:T.ink4,fontFamily:"'DM Sans',sans-serif",marginBottom:2}}>{data.period}</div>
                          <div style={{fontSize:"clamp(12px,3vw,14px)",fontWeight:700,color:T.ink1,fontFamily:"'Sora',sans-serif"}}>{p.label}</div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:"clamp(24px,6vw,32px)",fontFamily:"'Sora',sans-serif",fontWeight:800,color:scoreColor(data.attractiveness_score),lineHeight:1}}>{data.attractiveness_score}</div>
                          <div style={{fontSize:11,color:tc,marginTop:3,display:"flex",alignItems:"center",gap:4,justifyContent:"flex-end",fontFamily:"'DM Sans',sans-serif"}}>
                            <span>{tIcon(data.trajectory)}</span><span style={{textTransform:"capitalize"}}>{data.trajectory}</span>
                          </div>
                        </div>
                      </div>
                      <p style={{fontSize:12,color:T.ink2,lineHeight:1.65,marginBottom:10,fontFamily:"'DM Sans',sans-serif"}}>{data.narrative}</p>
                      <div style={{borderTop:`1px solid ${T.border}`,paddingTop:10}}>
                        <div style={{fontSize:10,color:T.ink4,fontFamily:"'Sora',sans-serif",marginBottom:6,letterSpacing:"0.06em",fontWeight:600}}>KEY SIGNALS</div>
                        {(data.key_signals||[]).map((s,i)=>(
                          <div key={i} style={{fontSize:11,color:T.ink3,marginBottom:4,display:"flex",gap:6,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>
                            <span style={{color:T.brand,flexShrink:0}}>◈</span>{s}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"clamp(14px,3vw,18px) clamp(14px,3vw,20px)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:6}}>
                  <div style={{fontSize:10,color:T.ink4,fontFamily:"'Sora',sans-serif",letterSpacing:"0.08em",fontWeight:600}}>ATTRACTIVENESS SCORE — 3-YEAR RETROSPECTIVE</div>
                  <div style={{fontSize:12,color:netDelta>0?T.green:netDelta<0?T.red:T.ink3,fontFamily:"'DM Sans',sans-serif"}}>
                    {tIcon(netDelta>0?"improving":netDelta<0?"declining":"stable")} Net {Math.abs(netDelta)} pts {netDelta>0?"improved":netDelta<0?"declined":"unchanged"} over 3 years
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={td} margin={{left:0,right:20,top:8,bottom:0}}>
                    <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="t" tick={{fill:T.ink3,fontSize:11,fontFamily:"'DM Sans',sans-serif"}} axisLine={false} tickLine={false}/>
                    <YAxis domain={[0,100]} tick={{fill:T.ink4,fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{border:`1px solid ${T.border}`,borderRadius:7,fontSize:12,fontFamily:"'DM Sans',sans-serif"}} labelStyle={{color:T.ink1}} formatter={(v)=>[v,"Attractiveness"]}/>
                    <ReferenceLine y={71} stroke={T.lime} strokeDasharray="4 4" label={{value:"Strong",fill:T.lime,fontSize:9}}/>
                    <ReferenceLine y={56} stroke={T.yellow} strokeDasharray="4 4" label={{value:"Average",fill:T.yellow,fontSize:9}}/>
                    <Line type="monotone" dataKey="score" stroke={T.brand} strokeWidth={2.5}
                      dot={(props)=>{const{cx,cy,index:ix}=props; return <circle key={ix} cx={cx} cy={cy} r={ix===2?7:5} fill={ix===2?T.brand:"#fff"} stroke={T.brand} strokeWidth={2}/>;}}
                      activeDot={{r:7,fill:T.brand}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>);
          })()}
        </div>

        <Divider/>

        {/* ─── § 06  Methodology ─────────────────────────────── */}
        <div className="report-section">
          <SectionLabel n={6} title="Methodology"/>
          <div style={{fontSize:13,color:T.ink3,marginBottom:18,fontFamily:"'DM Sans',sans-serif"}}>Signals inspected — <strong style={{color:T.ink1,fontFamily:"'Sora',sans-serif"}}>{totalSources} sources</strong></div>

          {R?.sources&&(()=>{
            const cats = [
              {key:"website",label:"Website",icon:"🌐"},
              {key:"news",label:"News",icon:"📰"},
              {key:"reviews",label:"Employee Reviews",icon:"⭐"},
              {key:"social",label:"Social / Discussion",icon:"💬"},
            ];
            return(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
                {cats.map(cat=>{
                  const items = R.sources[cat.key]||[]; if(items.length===0)return null;
                  return(
                    <div key={cat.key} style={{background:"#fff",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                        <span style={{fontSize:14}}>{cat.icon}</span>
                        <span style={{fontSize:12,fontWeight:700,color:T.ink1,fontFamily:"'Sora',sans-serif"}}>{cat.label}</span>
                        <span style={{fontSize:11,color:T.ink4,marginLeft:"auto",fontFamily:"'DM Sans',sans-serif"}}>{items.length}</span>
                      </div>
                      {items.map((src,i)=>(
                        <div key={i} style={{fontSize:11,color:T.ink2,marginBottom:6,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif"}}>
                          {src.url
                            ?<a href={src.url} target="_blank" rel="noreferrer" style={{color:T.brand}}>{src.label||src.url}</a>
                            :<span>{src.label||src}</span>}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Footer */}
          <div style={{marginTop:24,padding:"16px 20px",background:`linear-gradient(135deg, ${T.brand}08 0%, ${T.brandFaint} 100%)`,border:`1px solid ${T.brandBorder}`,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <InvokBizLogo size={22}/>
              <span style={{fontSize:11,color:T.ink4,fontFamily:"'DM Sans',sans-serif"}}>· EVP Intelligence Platform</span>
            </div>
            <div style={{fontSize:11,color:T.ink4,fontFamily:"'DM Sans',sans-serif",textAlign:"right"}}>
              Report: <span style={{color:T.ink2,fontFamily:"'Sora',sans-serif",fontWeight:600}}>{R?.company_name}</span> · {today}
            </div>
          </div>
        </div>

      </div>{/* /report container */}
    </div>
  );
}

// Helper to clamp values
function clamp(min, max) {
  return `clamp(${min}px, ${((min+max)/2/10).toFixed(1)}vw, ${max}px)`;
}