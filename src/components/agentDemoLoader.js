// One import function for the lazy Agent Demo chunk, so links that lead to the demo can start
// loading it on hover or focus (the browser reuses the same request when React.lazy asks).
export const loadAgentDemo = () => import('./AgentDemo')
