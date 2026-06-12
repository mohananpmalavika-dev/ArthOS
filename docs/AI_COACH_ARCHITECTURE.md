
# ARTH.OS AI Coach System
## Comprehensive Architecture & Implementation Guide

**Version:** 1.0  
**Last Updated:** Session 3  
**Status:** Ready for Deployment  

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Core Components](#core-components)
5. [API Reference](#api-reference)
6. [Frontend Integration](#frontend-integration)
7. [Configuration & Setup](#configuration--setup)
8. [Integration with Cognition Graph](#integration-with-cognition-graph)
9. [Deployment Checklist](#deployment-checklist)
10. [Usage Examples](#usage-examples)
11. [Troubleshooting](#troubleshooting)
12. [Performance & Optimization](#performance--optimization)

---

## Overview

The **AI Coach System** is a conversational financial advisor powered by GPT-4 that provides personalized guidance based on ARTH.OS Cognition Graph data. Unlike static recommendation engines, the coach:

- **Understands user psychology**: Analyzes beliefs, biases, triggers, and decision patterns
- **Remembers interactions**: Maintains coaching memory to learn preferences and effectiveness
- **Personalizes guidance**: Adapts communication style, depth, and recommendations
- **Tracks outcomes**: Measures recommendation effectiveness and behavioral change
- **Builds relationships**: Maintains conversation context across sessions

### Key Differentiators

| Feature | Static Recommender | AI Coach |
|---------|-------------------|----------|
| Context | Current financials | Beliefs + history + psychology |
| Personalization | Rule-based | AI-driven with learning |
| Memory | None | Full conversation history + patterns |
| Engagement | Transactional | Relational coaching |
| Effectiveness | Tracked later | Real-time feedback loop |

---

## Architecture

### System Diagram

```
User Interface (React)
        ↓
AI Coach API Router (Express)
        ↓
AI Coach Engine (GPT-4)
        ↓
Supabase PostgreSQL
├── coach_conversations (messages)
├── coach_session_context (session metadata)
├── coach_recommendations (action items)
├── coach_memory_profiles (user preferences)
└── coach_performance_metrics (analytics)
        ↓
Cognition Graph Data
├── money_beliefs
├── cognitive_biases
├── emotional_triggers
├── financial_decisions
└── decision_outcomes
```

### Component Interaction

1. **Frontend (AiCoachInterface.jsx)**
   - User initiates coaching session with optional concern
   - Sends messages via API
   - Receives coach responses in real-time
   - Views recommendations and statistics
   - Manages preferences

2. **Backend API (ai-coach-index.js)**
   - Routes requests to AI Coach Engine
   - Validates userId and sessionId
   - Handles error responses
   - Returns JSON responses

3. **AI Coach Engine (ai-coach-engine.js)**
   - Queries Cognition Graph for context
   - Generates system prompts with user data
   - Calls OpenAI GPT-4-turbo
   - Stores conversations and updates memory
   - Generates recommendations

4. **Database (V8 migration)**
   - Persists conversations with full context
   - Tracks session metadata and outcomes
   - Stores coaching recommendations
   - Maintains user memory profiles
   - Records performance analytics

---

## Database Schema

### 1. coach_conversations
**Purpose**: Individual messages in conversations  
**Key Fields**:
- `user_id`: User identifier
- `session_id`: Conversation session
- `message_type`: 'user_message' or 'coach_response'
- `content`: Message text
- `message_order`: Conversation sequence
- `user_emotional_state`: Detected emotion (happy, anxious, frustrated, etc.)
- `relevant_belief_ids`: References to beliefs discussed
- `relevant_bias_ids`: References to biases addressed
- `tokens_used`: For cost tracking
- `confidence_score`: 0-100 for coach response quality

**Indexes**: user_session (search), created_at (timeline), emotional_state (filtering)

### 2. coach_session_context
**Purpose**: High-level session information and outcomes  
**Key Fields**:
- `session_start_date`: When session started
- `session_end_date`: When session ended
- `primary_concern`: Why user initiated session
- `message_count`: Total messages in session
- `total_tokens_used`: Cost tracking
- `focus_belief_id`, `focus_bias_id`, `focus_decision_id`: Main topics
- `session_theme`: Category (spending_control, savings_building, etc.)
- `key_insights`: Array of insights generated
- `session_summary`: AI-generated summary
- `user_satisfaction_score`: 0-100 rating
- `user_receptiveness`: 0-100 openness to guidance
- `behavior_change_likely`: Boolean

**Indexes**: user_date (timeline), theme (categorization), follow_up_date (reminder)

### 3. coach_recommendations
**Purpose**: Specific recommendations with tracking  
**Key Fields**:
- `recommendation_text`: Full recommendation
- `recommendation_type`: action, insight, reframe, challenge
- `priority_level`: critical, high, medium, low
- `related_belief_id`, `related_bias_id`, `related_decision_id`: Context links
- `recommendation_status`: offered → accepted → in_progress → completed
- `status_updated_at`: When status changed
- `time_frame`: When to do it (this_week, this_month, etc.)
- `success_metric`: How to measure success
- `effectiveness_rating`: User's rating after completion

**Indexes**: user_status (filtering), priority (sorting), created_at (timeline)

### 4. coach_memory_profiles
**Purpose**: User preferences and coaching effectiveness  
**Key Fields**:
- `preferred_coaching_style`: compassionate, analytical, motivational, direct
- `response_length_preference`: concise, detailed, conversational
- `total_conversations`: Number of sessions
- `acceptance_rate`: % of recommendations accepted
- `recommendations_with_behavior_change`: Count of effective recommendations
- `last_conversation_date`: Most recent interaction
- `previous_decision_patterns`: JSONB of patterns
- `previous_recommendation_patterns`: JSONB of what worked
- `known_spending_triggers`: Array of triggers
- `known_motivations`: What drives this user

**Purpose**: Enables personalization without reloading all history

### 5. coach_performance_metrics
**Purpose**: Aggregate analytics (daily/weekly)  
**Key Fields**:
- `metric_date`: Date of metrics
- `total_conversations`: Number of sessions
- `total_users_coached`: Unique users
- `acceptance_rate`: % of recommendations accepted
- `behavior_change_rate`: % with observed behavior change
- `average_user_satisfaction`: Overall satisfaction
- `top_discussion_topics`: JSONB of topics
- `total_tokens_used`: API cost tracking
- `estimated_api_cost`: USD cost

**Purpose**: Cohort analytics and system optimization

---

## Core Components

### 1. AICoachEngine.js (800 lines)

**Static Methods**:

#### initiateCoachingSession(userId, primaryConcern)
- Fetches user's cognition data
- Creates session context in database
- Returns sessionId and greeting

#### getUserCognitionData(userId)
- Parallel fetch: beliefs, biases, triggers, decisions, outcomes
- Estimates health score and survival window
- Returns complete user profile

#### sendMessage(userId, sessionId, userMessage)
- Stores user message
- Fetches session context and conversation history
- Loads coaching memory
- Generates system prompt with all context
- Calls OpenAI GPT-4-turbo
- Stores coach response
- Updates session metrics
- Updates coaching memory

#### generateRecommendation(userId, sessionId)
- Analyzes cognition data
- Creates focused prompt
- Generates specific, actionable recommendation
- Parses components (timeframe, metric, impact)
- Stores in database

#### generateSystemPrompt(cognitionData, coachMemory, sessionContext)
- Builds comprehensive system prompt including:
  - Top 3 beliefs with strength scores
  - Top 2 biases with impact estimates
  - Emotional triggers
  - Financial snapshot
  - Coaching history if returning user
  - Personalized guidelines

#### endCoachingSession(userId, sessionId, satisfactionScore)
- Fetches last 10 messages
- Generates AI summary
- Stores satisfaction score
- Updates session end time

#### updateCoachingMemory(userId, userMessage, coachResponse)
- Creates or updates coaching memory
- Learns patterns over time
- Tracks effectiveness

---

### 2. AI Coach API Router (ai-coach-index.js) - 400 lines

**Endpoints**:

#### POST /api/coach/sessions
```
Body: { userId, primaryConcern? }
Response: { success, sessionId, coachGreeting, readyForChat }
```

#### GET /api/coach/sessions
```
Query: { userId }
Response: { success, sessions: [...], count }
```

#### POST /api/coach/sessions/:sessionId/messages
```
Body: { userId, message }
Response: { success, coachResponse, tokensUsed }
```

#### GET /api/coach/sessions/:sessionId/history
```
Query: { userId }
Response: { success, messages: [...], count }
```

#### POST /api/coach/sessions/:sessionId/recommendations
```
Body: { userId, focusArea? }
Response: { success, recommendation, components }
```

#### PUT /api/coach/recommendations/:recommendationId
```
Body: { status, effectivenessRating?, behavioralChange? }
Response: { success, recommendation }
```

#### POST /api/coach/sessions/:sessionId/end
```
Body: { userId, userSatisfactionScore? }
Response: { success, summary, messageCount }
```

#### GET /api/coach/memory
```
Query: { userId }
Response: { success, memory, isFirstInteraction }
```

#### PUT /api/coach/memory
```
Body: { userId, preferredCoachingStyle, responseLengthPreference, preferredLanguage }
Response: { success, memory }
```

#### GET /api/coach/analytics
```
Query: { userId }
Response: { success, analytics: { totalSessions, acceptanceRate, ... } }
```

---

### 3. Frontend Interface (AiCoachInterface.jsx) - 700 lines

**Features**:

1. **Session Start**
   - 6 preset concerns (Spending, Savings, Debt, Investment, Belief, General)
   - Free-form option
   - Shows greeting based on cognition data

2. **Real-time Chat**
   - Message history with timestamps
   - Typing indicator while waiting
   - Smooth scrolling
   - User/Coach message distinction

3. **Preferences Panel**
   - Coaching style selection
   - Response length preference
   - Persistence to database

4. **Recommendations Sidebar**
   - Display 5 most recent
   - Status dropdown (offered → completed)
   - Priority and timeframe display

5. **Statistics Dashboard**
   - Total sessions
   - Total recommendations
   - Acceptance rate
   - User satisfaction score

6. **Session Management**
   - Active session tracking
   - End session with feedback
   - Summary display

---

## Integration with Cognition Graph

The AI Coach **requires** the Cognition Graph system to function. The integration points:

### Data Read (Coach reads Cognition Graph)

1. **beliefs** → System prompt includes top 3 beliefs
2. **cognitive_biases** → Detects which biases to address
3. **emotional_triggers** → Understands what drives user emotions
4. **financial_decisions** → Context for recommendation generation
5. **decision_outcomes** → Learns what advice worked before

### Data Write (Coach creates Cognition Graph data)

1. **coach_recommendations** → Links to related_belief_id, related_bias_id, related_decision_id
2. **financial_decisions** → Coach can suggest recording new decisions
3. **money_beliefs** → Coach can surface newly discovered beliefs

### Example Flow

```
User: "I always spend too much when stressed"
  ↓
Coach queries:
  - financial_decisions WHERE decision_context LIKE '%stress%'
  - financial_emotional_triggers WHERE trigger_type = 'stress'
  - cognitive_biases WHERE bias_name = 'emotional_spending'
  ↓
Coach generates response:
  - References specific stress-spending pattern from decisions
  - Addresses underlying belief/bias
  - Suggests concrete intervention
  ↓
Coach creates recommendation:
  - Links to identified_bias_id
  - Stores in coach_recommendations
```

---

## Configuration & Setup

### 1. Environment Variables

```
# OpenAI Configuration (NEW)
OPENAI_API_KEY=sk-... (from OpenAI dashboard)

# Supabase Configuration (existing)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Node/Express (existing)
NODE_ENV=production
PORT=3000
```

### 2. NPM Dependencies

```bash
# Install OpenAI SDK (NEW)
npm install openai

# Verify other dependencies
npm list @supabase/supabase-js  # Should be present
npm list express                 # Should be present
```

### 3. Database Setup

```bash
# Deploy V8 migration to Supabase
cd migrations
# Copy contents of V8__ai_coach_system.sql
# Run in Supabase SQL editor or via flyway

# Or via CLI:
psql postgresql://user:password@host/db < V8__ai_coach_system.sql
```

### 4. API Registration

In your main Express app:

```javascript
const aiCoachRouter = require('./api_src/longitudinal/ai-coach-index');
app.use('/api/coach', aiCoachRouter);
```

### 5. Frontend Integration

In your main React app:

```jsx
import AiCoachInterface from './components/AiCoachInterface';

// In your routing or main component:
<AiCoachInterface userId={currentUserId} />
```

---

## Deployment Checklist

- [ ] V8 migration deployed to Supabase
- [ ] All coach_* tables created with RLS policies
- [ ] OPENAI_API_KEY set in environment
- [ ] openai npm package installed
- [ ] ai-coach-engine.js deployed to api_src/longitudinal/
- [ ] ai-coach-index.js deployed and registered with Express
- [ ] AiCoachInterface.jsx deployed to src/components/
- [ ] Coach router mounted at /api/coach
- [ ] Cognition Graph API and data available
- [ ] Error handling tested
- [ ] Rate limiting configured (optional)
- [ ] Cost monitoring set up (track tokens_used)

---

## Usage Examples

### Example 1: Starting a Session

```javascript
// User clicks "Spending Control" button
POST /api/coach/sessions
{
  "userId": "user-123",
  "primaryConcern": "Spending Control"
}

Response:
{
  "success": true,
  "sessionId": "sess-abc123",
  "coachGreeting": "I notice you often spend when stressed. Let's work on building resilience.",
  "readyForChat": true
}
```

### Example 2: Sending a Message

```javascript
// User types and sends message
POST /api/coach/sessions/sess-abc123/messages
{
  "userId": "user-123",
  "message": "I spent too much on coffee this week. It's a habit."
}

Response:
{
  "success": true,
  "coachResponse": "I see a pattern here - you mentioned stress-spending before. Coffee is often an emotional comfort purchase. Let's dig deeper: what emotion are you typically feeling when you grab that coffee?",
  "tokensUsed": 245,
  "sessionId": "sess-abc123"
}
```

### Example 3: Generating a Recommendation

```javascript
// User clicks "Get Recommendation"
POST /api/coach/sessions/sess-abc123/recommendations
{
  "userId": "user-123"
}

Response:
{
  "success": true,
  "recommendation": {
    "id": "rec-xyz",
    "recommendation_text": "Track every coffee purchase for the next 7 days. Note the time, location, and feeling before you bought it. This awareness alone often reduces impulsive spending by 30%.",
    "recommendation_type": "action",
    "priority_level": "high",
    "time_frame": "this_week",
    "success_metric": "Track at least 5 purchases with emotions noted"
  }
}
```

### Example 4: Ending a Session

```javascript
// User clicks "End Session"
POST /api/coach/sessions/sess-abc123/end
{
  "userId": "user-123",
  "userSatisfactionScore": 4
}

Response:
{
  "success": true,
  "summary": "INSIGHTS: You have a stress-spending pattern with coffee purchases. You recognized the emotional trigger. NEXT_STEPS: Track purchases for 7 days with emotions. Try an alternative calming ritual.",
  "messageCount": 8
}
```

---

## Troubleshooting

### Issue: OpenAI API 401 Error

**Cause**: Invalid or missing OPENAI_API_KEY

**Solution**:
```bash
# Verify key in environment
echo $OPENAI_API_KEY

# Get new key from https://platform.openai.com/api-keys
# Add to .env or environment variables
```

### Issue: Session Not Found Error

**Cause**: Invalid sessionId or user mismatch

**Solution**:
```javascript
// Verify session exists and belongs to user
GET /api/coach/sessions/:sessionId?userId={userId}
// Should return the session, otherwise 404 is correct
```

### Issue: Slow Coach Responses

**Cause**: GPT-4-turbo latency (3-10 seconds normal)

**Solution**:
- Add loading indicator to UI (done in AiCoachInterface)
- Consider timeout: 30 seconds max
- Log tokens to track cost vs. latency

### Issue: Cognition Data Not Showing in Context

**Cause**: Tables don't exist or RLS blocks access

**Solution**:
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' AND table_name LIKE 'coach_%';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Issue: Memory Not Persisting

**Cause**: Coach memory profile not created

**Solution**:
```javascript
// Manually create memory profile
POST /api/coach/memory
{
  "userId": "user-123",
  "preferredCoachingStyle": "compassionate",
  "responseLengthPreference": "detailed"
}
```

---

## Performance & Optimization

### Token Usage Optimization

**Cost**: ~$0.004 per message (1,000 tokens = $0.03 at GPT-4-turbo prices)

**Optimization**:
1. Trim conversation history to last 10 messages
2. Compress older messages into summaries
3. Cache coaching memory profile (1 per user)
4. Batch recommendation generation

### Database Query Optimization

All queries include:
- Appropriate indexes for filtering and sorting
- Row-level security for data isolation
- Denormalization in JSONB columns for patterns
- TTL on performance metrics (archive after 90 days)

### Response Time Targets

- Session initiation: < 500ms
- Message processing: 3-10 seconds (GPT-4 latency)
- Recommendation generation: 5-15 seconds
- API responses: < 100ms (excluding GPT calls)

### Scaling Considerations

**Current capacity**: ~100 concurrent users per instance

**Scaling approach**:
1. Use connection pooling (PgBouncer)
2. Cache cognition data (Redis)
3. Batch process recommendations (async jobs)
4. Archive old conversations (>1 year old)

---

## Files Created

1. **migrations/V8__ai_coach_system.sql** (350 lines)
   - 5 tables with RLS and indexes
   - Audit triggers
   - Performance setup

2. **api_src/longitudinal/ai-coach-engine.js** (800 lines)
   - Core coaching logic
   - OpenAI integration
   - Memory management

3. **api_src/longitudinal/ai-coach-index.js** (400 lines)
   - REST API endpoints
   - Request validation
   - Error handling

4. **src/components/AiCoachInterface.jsx** (700 lines)
   - React chat interface
   - Session management
   - Preference UI

5. **docs/AI_COACH_ARCHITECTURE.md** (this file)
   - Complete reference
   - Examples
   - Troubleshooting

---

## Integration Status

### ✅ Complete
- Database schema with RLS
- AI Coach engine with OpenAI integration
- Conversation memory system
- REST API endpoints
- Frontend chat interface
- Cognition Graph integration points

### ⏳ Future Enhancements
- Multi-turn recommendation refinement
- Behavioral coaching milestones
- Coach performance dashboard
- A/B testing coaching styles
- Integration with SMS/WhatsApp
- Voice coaching interface

---

## Support & Documentation

For questions or issues:
1. Check Troubleshooting section above
2. Review API endpoint examples
3. Check database schema definitions
4. Verify environment configuration
5. Check OpenAI rate limits and quota

---

**End of Document**
