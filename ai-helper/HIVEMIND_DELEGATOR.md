# HiveMind Delegator System

## Overview
The HiveMind Delegator is an AI-powered intelligent routing system that analyzes user requests and automatically delegates them to the most appropriate agent in the NO SHIT boardroom.

## How It Works

### 1. **Context Analysis**
The delegator receives:
- **User Message**: The actual question/request
- **Idea Context**: Active idea name and description
- **Chat History**: Last 5 messages for conversation context
- **Agent Roster**: All available agents with their expertise

### 2. **AI-Powered Decision Making**
Instead of simple keyword matching, the delegator uses Gemini AI to:
- Understand the semantic meaning of the request
- Consider the conversation context
- Analyze which agent's expertise best matches the need
- Make an intelligent routing decision with confidence score

### 3. **Agent Selection**
The delegator chooses from 9 specialized agents:
- **CEO** 👔: Strategy, vision, direction, big decisions, roadmap
- **CTO** ⚡: Tech stack, architecture, development, APIs
- **CMO** 🎨: Brand, marketing, GTM, design, positioning
- **CFO** 💰: Pricing, costs, revenue, burn rate, funding
- **Pitch** 🎤: Investor decks, presentations, storytelling
- **Legal** ⚖️: Contracts, compliance, terms, privacy, IP
- **Growth** 📈: User acquisition, channels, traction, viral loops
- **Psych** 🧠: Founder mental health, burnout, stress
- **Assistant** 🎯: General tasks, operations (default fallback)

### 4. **Fallback Mechanism**
If AI routing fails, the system falls back to keyword-based routing to ensure reliability.

## Usage

### In Code
```typescript
import { hivemind } from '@/lib/orchestrator';

// AI-powered routing with full context
const routing = await hivemind.routeWithAI({
  userMessage: "How should I price my SaaS product?",
  ideaName: "My Startup",
  ideaDescription: "B2B SaaS platform",
  chatHistory: previousMessages,
});

console.log(routing.agent.name); // "CFO"
console.log(routing.confidence); // 0.95
console.log(routing.reasoning); // "Pricing strategy is CFO's core expertise"
```

### Legacy Support
```typescript
// Simple keyword-based routing (backward compatible)
const routing = hivemind.route("What tech stack should I use?");
// Returns CTO based on keywords
```

## Benefits

1. **Smarter Routing**: Understands context and nuance, not just keywords
2. **Context-Aware**: Considers conversation history and idea details
3. **Confidence Scoring**: Provides transparency on routing decisions
4. **Fallback Safety**: Never fails - falls back to keyword matching if needed
5. **Logging**: Console logs show routing decisions for debugging

## Example Scenarios

| User Request | Routed To | Reasoning |
|-------------|-----------|-----------|
| "How should I price this?" | CFO | Pricing is financial decision |
| "What tech stack for MVP?" | CTO | Technical architecture question |
| "How do I position against competitors?" | CMO | Marketing/positioning expertise |
| "I'm feeling burned out" | Psych | Mental health concern |
| "Help me organize my tasks" | Assistant | General operations |

## Implementation Details

**File**: `src/lib/orchestrator.ts`

**Key Methods**:
- `routeWithAI(context)`: AI-powered intelligent routing
- `routeWithKeywords(message)`: Fallback keyword-based routing
- `route(message)`: Legacy method (uses keyword routing)

**Used In**:
- `src/pages/DashboardHome.tsx`: HiveMind chat interface

## Future Enhancements

- [ ] Multi-agent responses for complex questions
- [ ] Learning from user feedback on routing decisions
- [ ] Agent collaboration for cross-functional questions
- [ ] Routing analytics and optimization

