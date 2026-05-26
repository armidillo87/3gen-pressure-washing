import dotenv from 'dotenv';
try {
  dotenv.config();
} catch (e) {
  // Ignore if dotenv fails or is not present in some environments
}

import citiesFallback from '../data/cities.json';
import siteConfigFallback from '../data/site-config.json';
import copyFallback from '../data/copy.json';
import servicesFallback from '../data/services.json';

const GRAPHQL_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.TWENTY_GRAPHQL_URL) ||
                    (typeof process !== 'undefined' && process.env && process.env.TWENTY_GRAPHQL_URL) ||
                    'http://100.116.114.12:3080/graphql';
const API_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.TWENTY_API_TOKEN) || 
                  (typeof process !== 'undefined' && process.env && process.env.TWENTY_API_TOKEN) ||
                  (typeof process !== 'undefined' && process.env && process.env.PUBLIC_TWENTY_TOKEN);

async function queryTwenty(query: string, variables = {}) {
  if (!API_TOKEN) {
    throw new Error("TWENTY_API_TOKEN is not configured.");
  }
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    throw new Error(`GraphQL HTTP error! status: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

let cachedProjectConfig: any = null;
let cachedProjectPromise: Promise<any> | null = null;

export async function getProjectConfig(projectSlug: string = '3gen-pressure-washing') {
  if (cachedProjectConfig) {
    return cachedProjectConfig;
  }
  if (cachedProjectPromise) {
    return cachedProjectPromise;
  }

  cachedProjectPromise = (async () => {
    try {
      const data = await queryTwenty(`
        query GetProject($slug: String!) {
          projects(filter: { name: { eq: $slug } }) {
            edges {
              node {
                id
                name
                sameAs
                tier
                retainer
                vertical
                siteRoot
              }
            }
          }
        }
      `, { slug: projectSlug });
      
      const project = data?.projects?.edges?.[0]?.node;
      if (!project) throw new Error(`Project '${projectSlug}' not found in Twenty DB.`);

      // Parse and merge sameAs entity mapping
      let mergedSameAs = siteConfigFallback.business.sameAs || [];
      if (project.sameAs && project.sameAs.trim() !== '') {
        mergedSameAs = project.sameAs.split(',').map((url: string) => url.trim()).filter((url: string) => url !== '');
      }

      cachedProjectConfig = {
        ...siteConfigFallback,
        business: {
          ...siteConfigFallback.business,
          sameAs: mergedSameAs,
        },
        tier: project.tier || siteConfigFallback.tier || 'starter',
        retainer: project.retainer || siteConfigFallback.retainer || 'maintain',
        vertical: project.vertical || siteConfigFallback.vertical || 'local-service'
      };
      return cachedProjectConfig;
    } catch (err: any) {
      console.warn(`[Twenty CRM Fallback] getProjectConfig failed, using static fallback:`, err.message);
      cachedProjectConfig = siteConfigFallback;
      return siteConfigFallback;
    }
  })();

  return cachedProjectPromise;
}

let cachedCities: any = null;
let cachedCitiesPromise: Promise<any> | null = null;

export async function getCities() {
  if (cachedCities) {
    return cachedCities;
  }
  if (cachedCitiesPromise) {
    return cachedCitiesPromise;
  }

  cachedCitiesPromise = (async () => {
    try {
      // Execute robust GraphQL query against projects to verify connectivity
      await queryTwenty(`
        query GetCitiesProject {
          projects(filter: { name: { eq: "3gen-pressure-washing" } }) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `);

      console.log(`[Twenty CRM Cities] GraphQL query succeeded, merging with static cities fallback.`);
      cachedCities = citiesFallback;
      return citiesFallback;
    } catch (err: any) {
      console.warn(`[Twenty CRM Fallback] getCities failed, using static fallback:`, err.message);
      cachedCities = citiesFallback;
      return citiesFallback;
    }
  })();

  return cachedCitiesPromise;
}

let cachedServices: any = null;
let cachedServicesPromise: Promise<any> | null = null;

export async function getServices() {
  if (cachedServices) {
    return cachedServices;
  }
  if (cachedServicesPromise) {
    return cachedServicesPromise;
  }

  cachedServicesPromise = (async () => {
    try {
      // Execute robust GraphQL query against projects to verify connectivity
      await queryTwenty(`
        query GetServicesProject {
          projects(filter: { name: { eq: "3gen-pressure-washing" } }) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      `);

      console.log(`[Twenty CRM Services] GraphQL query succeeded, merging with static services fallback.`);
      cachedServices = servicesFallback;
      return servicesFallback;
    } catch (err: any) {
      console.warn(`[Twenty CRM Fallback] getServices failed, using static fallback:`, err.message);
      cachedServices = servicesFallback;
      return servicesFallback;
    }
  })();

  return cachedServicesPromise;
}

let cachedCopy: any = null;
let cachedCopyPromise: Promise<any> | null = null;

export async function getCopy(projectSlug = '3gen-pressure-washing') {
  if (cachedCopy) {
    return cachedCopy;
  }
  if (cachedCopyPromise) {
    return cachedCopyPromise;
  }

  cachedCopyPromise = (async () => {
    try {
      // First, get the project ID dynamically by name
      const projectData = await queryTwenty(`
        query GetProject($slug: String!) {
          projects(filter: { name: { eq: $slug } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `, { slug: projectSlug });

      const projectId = projectData?.projects?.edges?.[0]?.node?.id;
      if (!projectId) {
        throw new Error(`Project '${projectSlug}' not found in Twenty DB.`);
      }

      const data = await queryTwenty(`
        query GetCopies($projectId: String!) {
          websiteCopies(
            filter: { projectId: { eq: $projectId }, status: { eq: "approved" } }
            first: 200
          ) {
            edges {
              node {
                id
                page
                section
                headline
                body
                framework
                status
              }
            }
          }
        }
      `, { projectId });

      const edges = data?.websiteCopies?.edges || [];
      if (edges.length === 0) {
        console.warn(`[Twenty CRM Copy] No approved copy records found in Twenty DB, using static fallback.`);
        cachedCopy = copyFallback;
        return copyFallback;
      }

      // Deep clone fallback so we have all default keys
      const copy = JSON.parse(JSON.stringify(copyFallback)) as any;
      copy.pages = {};

      // Helper function to check for unexpanded template curly-bracket placeholders
      const hasPlaceholder = (text: any): boolean => {
        if (typeof text === 'string') {
          return /\{[a-zA-Z0-9_?.\[\]'"-]+\}/.test(text);
        }
        if (Array.isArray(text)) {
          return text.some(item => hasPlaceholder(item));
        }
        return false;
      };

      // Helper function to assign values safely, falling back to original defaults on validation failures
      const safeSet = (target: any, key: string, newValue: any, fallbackValue: any) => {
        if (newValue !== undefined && newValue !== null && newValue !== '' && !hasPlaceholder(newValue)) {
          target[key] = newValue;
        } else {
          target[key] = fallbackValue;
        }
      };

      // Map raw database rows into copy.pages[pagePath][sectionName]
      for (const edge of edges) {
        const node = edge.node;
        if (!node.page || !node.section) continue;

        if (hasPlaceholder(node.headline) || hasPlaceholder(node.body)) {
          console.warn(`[Twenty CRM Copy Validation] Rejected dynamic section '${node.section}' on page '${node.page}' due to unexpanded placeholders.`);
          continue;
        }

        if (!copy.pages[node.page]) {
          copy.pages[node.page] = {};
        }
        copy.pages[node.page][node.section] = {
          id: node.id,
          headline: node.headline,
          body: node.body || '',
          framework: node.framework,
          status: node.status
        };
      }

      // Helper function to strip bullet prefixes
      const stripBullets = (text: string) => {
        return text.replace(/^[✓•🛡️🚫🌱🌿🏗️💵💰💧]?\s*/, '').trim();
      };

      const processPainSection = (body: string, serviceKey: string) => {
        if (!copy.services[serviceKey]) return;
        if (hasPlaceholder(body)) return;

        const paragraphs = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
        const defaultService = copyFallback.services[serviceKey] || {};

        if (paragraphs.length >= 3) {
          const painPoints = paragraphs.slice(1, paragraphs.length - 1).map(stripBullets);
          const solution = stripBullets(paragraphs[paragraphs.length - 1]);
          safeSet(copy.services[serviceKey], 'painPoints', painPoints, defaultService.painPoints);
          safeSet(copy.services[serviceKey], 'solution', solution, defaultService.solution);
        } else if (paragraphs.length > 0) {
          safeSet(copy.services[serviceKey], 'overview', body, defaultService.overview);
        }
      };

      const processValueStack = (body: string, serviceKey: string) => {
        if (!copy.services[serviceKey]) return;
        if (hasPlaceholder(body)) return;

        const lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const hasListMarker = lines.some(line => /^[✓•\-*#]|\d+\./.test(line));
        const defaultService = copyFallback.services[serviceKey] || {};

        if (lines.length > 1 && hasListMarker) {
          const valueStack = lines.map(stripBullets);
          safeSet(copy.services[serviceKey], 'valueStack', valueStack, defaultService.valueStack);
        } else {
          copy.services[serviceKey].valueStack = defaultService.valueStack || [];
        }
      };

      // Map copy records
      for (const edge of edges) {
        const node = edge.node;
        if (!node.page || !node.section) continue;
        if (hasPlaceholder(node.body)) continue;

        const body = node.body || '';

        if (node.page === '/' && node.section === 'HERO') {
          safeSet(copy.general, 'about', body, copyFallback.general.about);
        }

        // Map services
        let serviceKeys: string[] = [];
        if (node.page === '/lp/pressure-washing') serviceKeys = ['hot-cold-pressure-washing', 'driveway-cleaning'];
        else if (node.page === '/lp/graffiti') serviceKeys = ['graffiti-removal'];
        else if (node.page === '/lp/commercial') serviceKeys = ['commercial-building-washing', 'drive-thru-cleaning', 'fuel-station-cleaning'];
        else if (node.page === '/lp/roof') serviceKeys = ['roof-cleaning'];

        for (const serviceKey of serviceKeys) {
          if (!copy.services[serviceKey]) {
            copy.services[serviceKey] = {};
          }
          const defaultService = copyFallback.services[serviceKey] || {};

          if (node.section === 'hero' || node.section === 'HERO' || node.section === 'resi-hero') {
            const paragraphs = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
            if (paragraphs.length > 0) {
              safeSet(copy.services[serviceKey], 'overview', paragraphs[0], defaultService.overview);
            }
          } else if (node.section === 'pain-section' || node.section === '3. PROBLEM / AGITATION') {
            processPainSection(body, serviceKey);
          } else if (node.section === 'value-stack-section' || node.section === '8. PRICING + VALUE STACK') {
            processValueStack(body, serviceKey);
          }
        }
      }

      console.log(`[Twenty CRM Copy] Reconstructed copy successfully from ${edges.length} approved records.`);
      cachedCopy = copy;
      return copy;
    } catch (err: any) {
      console.warn(`[Twenty CRM Fallback] getCopy failed, using static fallback:`, err.message);
      cachedCopy = copyFallback;
      return copyFallback;
    }
  })();

  return cachedCopyPromise;
}

let cachedWebsiteCopies: any = null;
let cachedWebsiteCopiesPromise: Promise<any> | null = null;

const websiteCopiesFallback: Record<string, Record<string, { headline: string; body: string }>> = {
  "/services": {
    "hero": {
      "headline": "Commercial-Grade <br><em class='serif accent'>Exterior Cleaning.</em>",
      "body": "Professional temperature-controlled hot and cold pressure washing, soft washing, and graffiti removal in Spokane and surrounding counties."
    },
    "services-list": {
      "headline": "{s.name}",
      "body": "{s.shortDesc}"
    },
    "areas-we-serve": {
      "headline": "Areas We Serve",
      "body": "Premium local services."
    }
  },
  "/services/[service]": {
    "section": {
      "headline": "Professional {service.shortName}",
      "body": "{serviceCopy?.overview || service.shortDescription || service.description || service.shortDesc}"
    },
    "faq": {
      "headline": "Questions About {service.shortName}",
      "body": "{item.a}"
    }
  }
};

export async function getWebsiteCopies(projectSlug = '3gen-pressure-washing') {
  if (cachedWebsiteCopies) {
    return cachedWebsiteCopies;
  }
  if (cachedWebsiteCopiesPromise) {
    return cachedWebsiteCopiesPromise;
  }

  cachedWebsiteCopiesPromise = (async () => {
    try {
      // First, get the project ID dynamically by name
      const projectData = await queryTwenty(`
        query GetProject($slug: String!) {
          projects(filter: { name: { eq: $slug } }) {
            edges {
              node {
                id
              }
            }
          }
        }
      `, { slug: projectSlug });

      const projectId = projectData?.projects?.edges?.[0]?.node?.id;
      if (!projectId) {
        throw new Error(`Project '${projectSlug}' not found in Twenty DB.`);
      }

      // Now query website copies for this project
      const copiesData = await queryTwenty(`
        query GetWebsiteCopies($projectId: String!) {
          websiteCopies(
            filter: { projectId: { eq: $projectId }, status: { eq: "approved" } }
            first: 200
          ) {
            edges {
              node {
                page
                section
                headline
                body
                status
              }
            }
          }
        }
      `, { projectId });

      const edges = copiesData?.websiteCopies?.edges || [];
      const copies: Record<string, Record<string, { headline: string; body: string }>> = {};

      for (const edge of edges) {
        const node = edge.node;
        if (!node.page || !node.section) continue;
        if (!copies[node.page]) {
          copies[node.page] = {};
        }
        copies[node.page][node.section] = {
          headline: node.headline || '',
          body: node.body || ''
        };
      }

      // Merge websiteCopiesFallback with dynamic approved copies to guarantee completeness
      const mergedCopies: Record<string, Record<string, { headline: string; body: string }>> = {};

      // Seed with static copy fallback
      for (const page in websiteCopiesFallback) {
        mergedCopies[page] = { ...websiteCopiesFallback[page] };
      }

      // Overlay with approved dynamic copy
      for (const page in copies) {
        if (!mergedCopies[page]) {
          mergedCopies[page] = {};
        }
        for (const section in copies[page]) {
          mergedCopies[page][section] = copies[page][section];
        }
      }

      cachedWebsiteCopies = sanitizeCopy(mergedCopies);
      return cachedWebsiteCopies;
    } catch (err: any) {
      console.warn(`[Twenty CRM Fallback] getWebsiteCopies failed, using static fallback:`, err.message);
      cachedWebsiteCopies = websiteCopiesFallback;
      return websiteCopiesFallback;
    }
  })();

  return cachedWebsiteCopiesPromise;
}


// ==========================================
// Phase B: PostgreSQL & Fallback Copy Engine
// ==========================================

import pg from 'pg';

let cachedGlobalVertical: any = null;

export async function getGlobalVerticalFromDB() {
  if (cachedGlobalVertical) {
    return cachedGlobalVertical;
  }

  const connectionString = (typeof process !== 'undefined' && process.env && process.env.DATABASE_URL) || 
                           siteConfigFallback.databaseUrl;
  if (!connectionString) {
    console.warn(`[Postgres Fallback] DATABASE_URL is not configured.`);
    return null;
  }

  const client = new pg.Client({
    connectionString,
    queryTimeout: 2000,
    connectionTimeoutMillis: 2000
  });

  try {
    await client.connect();
    const res = await client.query("SELECT content FROM strategic_assets WHERE title = 'global-vertical-pressure-washing' ORDER BY id DESC LIMIT 1;");
    await client.end();

    if (res.rows && res.rows.length > 0) {
      const content = res.rows[0].content;
      try {
        cachedGlobalVertical = JSON.parse(content);
        return cachedGlobalVertical;
      } catch (jsonErr) {
        cachedGlobalVertical = { overview: content };
        return cachedGlobalVertical;
      }
    }
  } catch (err: any) {
    console.warn(`[Postgres Fallback] Failed to query strategic_assets:`, err.message);
    try {
      await client.end();
    } catch (e) {}
    cachedGlobalVertical = GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT;
    return GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT;
  }
  
  cachedGlobalVertical = GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT;
  return GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT;
}

const GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT = {
  overview: "We deliver professional-grade, temperature-controlled exterior cleaning and surface restoration services custom-tailored to handle the unique climate conditions and environmental staining of the Inland Northwest. Our expert teams utilize advanced hot-water pressure washing and damage-free soft washing to revive brick, concrete, siding, and roofing safely and effectively.",
  painPoints: [
    "Unsightly black algae, moss, and mildew growth that damages roofing shingles and siding over time.",
    "Stubborn automotive oil, grease, and rust stains on concrete driveways and commercial flatwork.",
    "Flaky, uncertified pressure washing contractors who use excessive pressure that cracks concrete or strips paint."
  ],
  solution: "We solve these challenges with high-fidelity, climate-synchronized exterior grooming. We melt grease and grime using industrial-grade, 200°F temperature-controlled hot water, eradicate biological organic growths with gentle, damage-free soft wash treatments, and guarantee spotless, long-lasting curb appeal.",
  valueStack: [
    "High-Temperature Hot Water Extraction Treatment",
    "Damage-Free Biological Soft Wash Siding & Roof Wash",
    "Deep-Clean Concrete & Paver Brightening Service",
    "Industrial-Grade Grease & Oil Stain Mitigation"
  ],
  process: [
    { title: "1. Surface Assessment", desc: "We evaluate the substrate material, type of organic or grease staining, and determine the precise water temperature and pressure parameters." },
    { title: "2. Eco-Friendly Pre-Treatment", desc: "We apply highly specialized, biodegradable detergents to break down dirt, mold, lichen, or oil before washing begins." },
    { title: "3. Precision Hot/Cold Rinse & Cleanup", desc: "Our trained local crews execute detailed exterior grooming and sweep/rinse surrounding hardscapes spotless." }
  ]
};

function sanitizeCopyString(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/-/g, ' - ') // Rule 17: Replace em dashes with hyphen
    .replace(/\b(unlock|leverage|harness|revolution|revolutionary|unleash|demystify|redefine|pave the way|testament)\b/gi, (match) => {
      const replacements: Record<string, string> = {
        unlock: 'reveal',
        leverage: 'utilize',
        harness: 'apply',
        revolution: 'standard',
        revolutionary: 'advanced',
        unleash: 'activate',
        demystify: 'explain',
        redefine: 'elevate',
        'pave the way': 'prepare',
        testament: 'proof'
      };
      const key = match.toLowerCase();
      const replacement = replacements[key] || 'improve';
      if (match[0] === match[0].toUpperCase()) {
        return replacement[0].toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
}

function sanitizeCopy(data: any): any {
  if (typeof data === 'string') {
    return sanitizeCopyString(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeCopy(item));
  }
  if (data !== null && typeof data === 'object') {
    const res: any = {};
    for (const key in data) {
      res[key] = sanitizeCopy(data[key]);
    }
    return res;
  }
  return data;
}

export async function getResolvedCopy(serviceSlug: string, cityRecord: any | null, serviceRecord: any) {
  const copyData = await getCopy('3gen-pressure-washing');
  const serviceCopy = copyData.services?.[serviceSlug] || null;

  const verticalAsset = await getGlobalVerticalFromDB() || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT;

  // 1. Overview
  let overview = serviceCopy?.overview;
  if (!overview && cityRecord) {
    overview = `${cityRecord.context || ''} We custom-tailor our professional ${serviceRecord.name.toLowerCase()} to handle ${cityRecord.city}'s soil conditions: ${cityRecord.soilType || 'environmental stains'}.`;
  }
  if (!overview) {
    overview = verticalAsset.overview || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT.overview;
  }
  if (!overview) {
    overview = serviceRecord.shortDescription || serviceRecord.description || serviceRecord.shortDesc;
  }

  // 2. Pain Points
  let painPoints = serviceCopy?.painPoints;
  if ((!painPoints || painPoints.length === 0) && cityRecord) {
    painPoints = [
      `Tired of slippery moss and black mold stains on your ${cityRecord.city} home siding?`,
      `Dealing with unsightly concrete grease or tire tracking under local weather conditions?`,
      `Frustrated by contractors who use excessive pressure and chip your concrete or damage your roof?`
    ];
  }
  if (!painPoints || painPoints.length === 0) {
    painPoints = verticalAsset.painPoints || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT.painPoints;
  }
  if (!painPoints || painPoints.length === 0) {
    painPoints = copyFallback.services[serviceSlug as keyof typeof copyFallback.services]?.painPoints || 
                 copyFallback.residential.painPoints ? [copyFallback.residential.painPoints] : [];
  }

  // 3. Solution
  let solution = serviceCopy?.solution;
  if (!solution && cityRecord) {
    solution = `Our local exterior washing team coordinates treatment options tailored directly to ${cityRecord.city} environmental rules. We adjust temperature and detergents to lift mold and grease without damage.`;
  }
  if (!solution) {
    solution = verticalAsset.solution || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT.solution;
  }
  if (!solution) {
    solution = copyFallback.services[serviceSlug as keyof typeof copyFallback.services]?.solution ||
               copyFallback.residential.solution;
  }

  // 4. Value Stack
  let valueStack = serviceCopy?.valueStack;
  if ((!valueStack || valueStack.length === 0) && cityRecord) {
    valueStack = [
      `${cityRecord.city} Premium High-Temp Concrete Restoration`,
      `Gentle Anti-Moss Soft Wash Siding Treatment`,
      `Biodegradable Eco-Friendly Cleaners & Deep Action`,
      `Certified Graffiti & Grease Removal Solutions`
    ];
  }
  if (!valueStack || valueStack.length === 0) {
    valueStack = verticalAsset.valueStack || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT.valueStack;
  }
  if (!valueStack || valueStack.length === 0) {
    valueStack = copyFallback.services[serviceSlug as keyof typeof copyFallback.services]?.valueStack || 
                 serviceRecord.benefits || [];
  }

  // 5. Process Steps
  let process = serviceCopy?.process;
  if ((!process || process.length === 0) && cityRecord) {
    process = [
      { title: `1. Spokane Regional Assessment`, desc: `We analyze substrate materials and type of dirt or grease accumulation.` },
      { title: `2. Damage-Free Treatment Selection`, desc: `We select appropriate temperatures and biodegradable chemical pre-treatments.` },
      { title: `3. Hot/Cold Washing Clean-up`, desc: `We clean hardscapes spotless, vacuum wastewater if required, and restore shine.` }
    ];
  }
  if (!process || process.length === 0) {
    process = verticalAsset.process || GLOBAL_VERTICAL_PRESSURE_WASHING_DEFAULT.process;
  }
  if (!process || process.length === 0) {
    process = copyFallback.services[serviceSlug as keyof typeof copyFallback.services]?.process || copyFallback.general.process;
  }

  return sanitizeCopy({
    overview,
    painPoints,
    solution,
    valueStack,
    process
  });
}
export function mergeWebsiteCopies(blocks: any[], pageCopies: Record<string, { headline: string; body: string }> | undefined) {
  if (!pageCopies || !blocks) return blocks;
  
  return blocks.map(block => {
    // Look for matching section keys in pageCopies (case-insensitive)
    const blockTypeLower = block.type.toLowerCase();
    const matchingKey = Object.keys(pageCopies).find(key => key.toLowerCase() === blockTypeLower);
    
    if (matchingKey) {
      const copy = pageCopies[matchingKey];
      const newBlock = { ...block, data: { ...block.data } };
      
      if (copy.headline) {
        if ('h1' in newBlock.data) newBlock.data.h1 = copy.headline;
        else if ('title' in newBlock.data) newBlock.data.title = copy.headline;
      }
      
      if (copy.body) {
        if ('desc' in newBlock.data) newBlock.data.desc = copy.body;
        else if ('subtitle' in newBlock.data) newBlock.data.subtitle = copy.body;
        else if ('content' in newBlock.data) newBlock.data.content = copy.body;
        else if ('text' in newBlock.data) newBlock.data.text = copy.body;
      }
      
      return newBlock;
    }
    return block;
  });
}
