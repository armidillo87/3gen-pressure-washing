import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Set to production URL
  site: 'https://3genpressurewashing.com',
  output: 'static',
  compressHTML: true,

  redirects: {
    '/hotcold-pressure-washing-and-soft-washing': '/services/hot-cold-pressure-washing',
    '/headstone-cleaning': '/services/headstone-cleaning',
    '/driveways-and-walkways': '/services/driveway-cleaning',
    '/building-exteriors-and-storefronts': '/services/commercial-building-washing',
    '/graffiti-removal': '/services/graffiti-removal',
    '/fuel-station-cleaning': '/services/fuel-station-cleaning',
    '/drive-through-cleaning': '/services/drive-thru-cleaning',
    '/roof-treatments': '/services/roof-cleaning',
    '/outdoor-courts-and-patios': '/services/patio-cleaning',
    '/service-areas': '/',
    '/spokane-county-pressure-washing-services': '/',
    '/adams-county-pressure-washing-services': '/',
    '/ferry-county-pressure-washing-services': '/',
    '/stevens-county-pressure-washing-services': '/',
    '/lincoln-county-pressure-washing-services': '/',
    '/pend-oreille-county-pressure-washing-services': '/',
    '/whitman-county-pressure-washing-services': '/'
  },

  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/thank-you') && !page.includes('/404'),
    }),
  ],

  image: {
    domains: [],
    remotePatterns: [],
  },

  build: {
    inlineStylesheets: 'auto',
  },
});
