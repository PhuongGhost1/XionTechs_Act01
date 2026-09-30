// Ordered keyword rules for the scripted guide. Every answer is assembled from site.js so
// the chat can never contradict the page. Rule order matters: the first match wins.
import { chat, company, contact, faqs, pillars, roadmap } from '../content/site'

const pillar = (id) => pillars.find((p) => p.id === id)

const contactActions = () => [
  { type: 'copy', label: 'Copy email', value: contact.email },
  { type: 'link', label: `Call ${contact.phones[0]}`, href: `tel:${contact.phones[0].replace(/\s+/g, '')}` },
  { type: 'scroll', label: 'Go to contact', target: 'contact' },
]

export const intents = [
  {
    id: 'demo',
    chip: 'Show me an agent demo',
    keywords: ['demo', 'example', 'watch', 'see it'],
    answer: () => ({
      text: 'Here is an illustrative walkthrough of an agent handling a request from start to finish — three scenarios to pick from.',
      actions: [{ type: 'scroll', label: 'Watch the agent demo', target: 'demo' }],
    }),
  },
  {
    id: 'platform',
    chip: 'What is the Smart Agent Platform?',
    keywords: ['platform', 'iot', 'device', 'sensor', 'smart', 'factory'],
    answer: () => ({
      text: `${pillar('platform').title}: ${pillar('platform').outcome}`,
      actions: [{ type: 'scroll', label: 'See the platform pillar', target: 'solutions' }],
    }),
  },
  {
    id: 'start',
    chip: 'How does a project start?',
    keywords: ['start', 'begin', 'process', 'roadmap', 'pilot', 'first step', 'work with', 'engage', 'how do we'],
    answer: () => ({
      text: `It starts with ${roadmap[0].stage}: ${roadmap[0].get} Then a ${roadmap[1].stage}: ${roadmap[1].get}`,
      actions: [{ type: 'scroll', label: 'See the roadmap', target: 'roadmap' }],
    }),
  },
  {
    id: 'offices',
    chip: 'Where are your offices?',
    keywords: ['office', 'where are', 'where is', 'location', 'located', 'address', 'vietnam', 'dallas', 'time zone'],
    answer: () => ({
      text: `We work from ${company.offices.join(', ')}. Addresses: ${contact.addresses.join(' · ')}`,
      actions: [{ type: 'scroll', label: 'Go to contact', target: 'contact' }],
    }),
  },
  {
    id: 'human',
    chip: 'Talk to a human',
    keywords: ['human', 'person', 'talk', 'call', 'email', 'phone', 'contact', 'reach out', 'speak'],
    answer: () => ({
      text: `Happy to connect you. Email ${contact.email} or call ${contact.phones.join(' / ')}.`,
      actions: contactActions(),
    }),
  },
  {
    id: 'agent',
    chip: 'What can an AI agent do for my business?',
    keywords: ['agent', 'ai', 'automate', 'automation', 'assistant', 'chatbot', 'help', 'what do you do', 'services'],
    answer: () => ({
      text: `${pillar('agentic').outcome} ${faqs[0].a}`,
      actions: [
        { type: 'scroll', label: 'Watch the agent demo', target: 'demo' },
        { type: 'scroll', label: 'See our solutions', target: 'solutions' },
      ],
    }),
  },
]

export const FALLBACK_ID = 'fallback'

export const fallback = () => ({
  id: FALLBACK_ID,
  text: chat.fallback,
  actions: contactActions(),
})

// Chip order as shown in the UI (matches the spec, not the matching order above).
const CHIP_ORDER = ['agent', 'platform', 'start', 'offices', 'demo', 'human']
export const chips = CHIP_ORDER.map((id) => ({ id, label: intents.find((i) => i.id === id).chip }))
