import { AGENTS, Agent } from './agents';
import { sendToGemini } from './gemini';

interface RoutingDecision {
  agent: Agent;
  confidence: number;
  reasoning: string;
}

interface RoutingContext {
  userMessage: string;
  ideaName?: string;
  ideaDescription?: string;
  chatHistory?: Array<{ role: string; content: string; agentId?: string }>;
}

export class HiveMindOrchestrator {
  /**
   * HiveMind Delegator Agent - AI-powered intelligent routing
   * Analyzes the user's request, idea context, and chat history to delegate to the best agent
   */
  async routeWithAI(context: RoutingContext): Promise<RoutingDecision> {
    const { userMessage, ideaName, ideaDescription, chatHistory } = context;

    // Build agent roster for the delegator
    const agentRoster = Object.values(AGENTS)
      .filter(a => a.id !== 'oracle') // Exclude Oracle from HiveMind routing
      .map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        expertise: a.expertise.join(', '),
      }));

    // Build chat context summary
    let chatContextSummary = '';
    if (chatHistory && chatHistory.length > 0) {
      const recentChats = chatHistory.slice(-5); // Last 5 messages
      chatContextSummary = recentChats
        .map(m => `${m.agentId ? AGENTS[m.agentId]?.name || 'User' : 'User'}: ${m.content.substring(0, 100)}...`)
        .join('\n');
    }

    // HiveMind Delegator system prompt
    const delegatorPrompt = `You are the HiveMind Delegator - the intelligent routing system for NO SHIT's AI boardroom.

YOUR JOB:
Analyze the user's request and delegate it to the SINGLE BEST agent from the team.

AVAILABLE AGENTS:
${agentRoster.map(a => `- ${a.name} (${a.id}): ${a.role} | Expertise: ${a.expertise}`).join('\n')}

${ideaName ? `ACTIVE IDEA:
Name: ${ideaName}
Description: ${ideaDescription || 'N/A'}
` : ''}

${chatContextSummary ? `RECENT CHAT CONTEXT:
${chatContextSummary}
` : ''}

USER REQUEST:
"${userMessage}"

ROUTING RULES:
1. Choose the SINGLE MOST APPROPRIATE agent based on the request
2. CEO: Strategy, vision, direction, big decisions, roadmap, pivots
3. CTO: Tech stack, architecture, development, code, APIs, databases
4. CMO: Brand, marketing, GTM, design, positioning, messaging, style
5. CFO: Pricing, costs, revenue, burn rate, funding, unit economics
6. Pitch: Investor decks, presentations, storytelling, demos
7. Legal (Harvey): Contracts, compliance, terms, privacy, IP, legal risks
8. Growth: User acquisition, channels, traction, viral loops, retention
9. Psych: Founder mental health, burnout, stress, motivation, mindset
10. Assistant: General tasks, operations, organization, or when no clear match (DEFAULT)

RESPONSE FORMAT (JSON only):
{
  "agentId": "ceo|cto|cmo|cfo|pitch|legal|growth|psych|assistant",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this agent is best suited"
}

Be decisive. Choose ONE agent. No hedging.`;

    try {
      const response = await sendToGemini(delegatorPrompt, '');

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const decision = JSON.parse(jsonMatch[0]);

      // Validate agent exists
      const selectedAgent = AGENTS[decision.agentId];
      if (!selectedAgent) {
        throw new Error(`Invalid agent ID: ${decision.agentId}`);
      }

      return {
        agent: selectedAgent,
        confidence: decision.confidence || 0.8,
        reasoning: decision.reasoning || 'AI-powered routing decision',
      };

    } catch (error) {
      console.error('HiveMind delegator error:', error);
      // Fallback to keyword-based routing
      return this.routeWithKeywords(userMessage);
    }
  }

  /**
   * Fallback keyword-based routing (original logic)
   */
  private routeWithKeywords(userMessage: string): RoutingDecision {
    const message = userMessage.toLowerCase();

    // Calculate scores for each agent based on keyword matching
    const scores: Array<{ agent: Agent; score: number }> = [];

    for (const agent of Object.values(AGENTS)) {
      if (agent.id === 'oracle') continue; // Skip Oracle

      let score = 0;

      // Check expertise keywords
      for (const expertise of agent.expertise) {
        if (message.includes(expertise)) {
          score += 10;
        }
      }

      // Boost specific patterns
      if (agent.id === 'ceo' && (
        message.includes('strategy') ||
        message.includes('vision') ||
        message.includes('direction') ||
        message.includes('should i') ||
        message.includes('roadmap')
      )) {
        score += 15;
      }

      if (agent.id === 'cto' && (
        message.includes('build') ||
        message.includes('stack') ||
        message.includes('tech') ||
        message.includes('code') ||
        message.includes('api')
      )) {
        score += 15;
      }

      if (agent.id === 'cmo' && (
        message.includes('brand') ||
        message.includes('market') ||
        message.includes('gtm') ||
        message.includes('design') ||
        message.includes('style') ||
        message.includes('launch')
      )) {
        score += 15;
      }

      if (agent.id === 'cfo' && (
        message.includes('price') ||
        message.includes('cost') ||
        message.includes('revenue') ||
        message.includes('money') ||
        message.includes('burn') ||
        message.includes('funding')
      )) {
        score += 15;
      }

      if (agent.id === 'pitch' && (
        message.includes('pitch') ||
        message.includes('deck') ||
        message.includes('investor') ||
        message.includes('present')
      )) {
        score += 15;
      }

      if (agent.id === 'legal' && (
        message.includes('legal') ||
        message.includes('contract') ||
        message.includes('terms') ||
        message.includes('compliance') ||
        message.includes('privacy')
      )) {
        score += 15;
      }

      if (agent.id === 'growth' && (
        message.includes('growth') ||
        message.includes('user') ||
        message.includes('acquisition') ||
        message.includes('channel') ||
        message.includes('traction') ||
        message.includes('viral')
      )) {
        score += 15;
      }

      if (agent.id === 'psych' && (
        message.includes('burn') && message.includes('out') ||
        message.includes('stress') ||
        message.includes('mental') ||
        message.includes('tired') ||
        message.includes('overwhelm')
      )) {
        score += 15;
      }

      scores.push({ agent, score });
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // If top score is 0, default to Assistant
    if (scores[0].score === 0) {
      return {
        agent: AGENTS.assistant,
        confidence: 0.5,
        reasoning: 'No specific expertise match, routing to Assistant for general handling'
      };
    }

    // Return highest scoring agent
    const topAgent = scores[0];
    const confidence = Math.min(topAgent.score / 30, 1); // Normalize to 0-1

    return {
      agent: topAgent.agent,
      confidence,
      reasoning: `Matched ${topAgent.score} points based on expertise keywords`
    };
  }

  /**
   * Legacy synchronous route method (uses keyword-based routing)
   * Kept for backward compatibility
   */
  route(userMessage: string): RoutingDecision {
    return this.routeWithKeywords(userMessage);
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | null {
    return AGENTS[agentId] || null;
  }
  
  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Object.values(AGENTS);
  }
}

export const hivemind = new HiveMindOrchestrator();
