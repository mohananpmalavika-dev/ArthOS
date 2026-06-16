/**
 * API Router Integration for Capabilities Endpoint
 * 
 * Add this to your api/index.js to enable the capabilities endpoint
 */

// ============================================================================
// STEP 1: Import the capabilities handler
// ============================================================================

import capabilitiesHandler from '../api_src/config/capabilities-endpoint.js';

// ============================================================================
// STEP 2: Add to routeDefinitions array
// ============================================================================

// Find your routeDefinitions array and add this entry:

const routeDefinitions = [
  // ... existing routes ...

  // Add this capability endpoint:
  {
    pathname: '/api/config/capabilities',
    handler: capabilitiesHandler,
    methods: ['GET', 'OPTIONS'],
    description: 'Get system capabilities based on environment and user role',
  },

  // ... rest of routes ...
];

// ============================================================================
// COMPLETE EXAMPLE: How to add to existing router
// ============================================================================

/*
// In your api/index.js file, find the routes section and update it like this:

import loginHandler from '../api_src/auth/login.js';
import registerHandler from '../api_src/auth/register.js';
import meHandler from '../api_src/auth/me.js';
import decisionHandler from '../api_src/decision.js';
import followUpHandler from '../api_src/follow-up/follow-up-handler.js';
import capabilitiesHandler from '../api_src/config/capabilities-endpoint.js'; // ADD THIS

// ... other imports

export default async function handler(req, res) {
  // ... CORS and other setup code ...

  // Your route definitions:
  const routeDefinitions = [
    // Auth routes
    { pathname: '/api/auth/login', handler: loginHandler, methods: ['POST', 'OPTIONS'] },
    { pathname: '/api/auth/register', handler: registerHandler, methods: ['POST', 'OPTIONS'] },
    { pathname: '/api/auth/me', handler: meHandler, methods: ['GET', 'OPTIONS'] },

    // Decision tracking
    { pathname: '/api/decision', handler: decisionHandler, methods: ['GET', 'POST', 'OPTIONS'] },

    // Follow-ups
    { pathname: '/api/follow-up/schedule', handler: followUpHandler, methods: ['POST', 'OPTIONS'] },
    { pathname: '/api/follow-up/pending', handler: followUpHandler, methods: ['GET', 'OPTIONS'] },

    // ADD THIS ROUTE:
    {
      pathname: '/api/config/capabilities',
      handler: capabilitiesHandler,
      methods: ['GET', 'OPTIONS'],
    },

    // ... rest of your routes ...
  ];

  // ... rest of router logic ...
}
*/

// ============================================================================
// ENDPOINT USAGE
// ============================================================================

/*
// Get all capabilities with their status
GET /api/config/capabilities?query=all&role=user

// Get only enabled capabilities grouped by category
GET /api/config/capabilities?query=enabled&role=user

// Get capabilities in a specific category
GET /api/config/capabilities?query=category&category=banking&role=user

// Get details for a specific capability
GET /api/config/capabilities?query=specific&capabilityId=banking:integration&role=user
*/

// ============================================================================
// TESTING THE ENDPOINT
// ============================================================================

/*
// In your terminal, test the endpoint:

// Test with curl:
curl "http://localhost:3000/api/config/capabilities?query=all&role=user"

// Or in JavaScript/Node:
const response = await fetch(
  '/api/config/capabilities?query=all&role=user'
);
const data = await response.json();
console.log(data);

// Expected response:
{
  "success": true,
  "capabilities": {
    "auth:jwt": {
      "name": "JWT Authentication",
      "description": "JWT-based user authentication",
      "category": "core",
      "required": true,
      "enabled": true,
      "reason": undefined
    },
    "banking:integration": {
      "name": "Banking Integration",
      "description": "Connect to financial institutions via Plaid/Yodlee",
      "category": "banking",
      "enabled": false,
      "reason": "Missing environment variable: BANKING_API_KEY",
      "requiresEnv": ["BANKING_API_KEY"]
    },
    "coach:conversations": {
      "name": "AI Coach Conversations",
      "description": "Conversational AI coaching for financial goals",
      "category": "ai",
      "enabled": false,
      "reason": "Missing environment variable: OPENAI_API_KEY",
      "requiresEnv": ["OPENAI_API_KEY"]
    },
    // ... more capabilities ...
  },
  "userRole": "user",
  "timestamp": "2026-06-16T10:30:00.000Z"
}
*/

// ============================================================================
// VERIFYING THE INTEGRATION
// ============================================================================

/*
Checklist to verify the endpoint is working:

1. [ ] Endpoint is imported in api/index.js
2. [ ] Route is added to routeDefinitions array
3. [ ] Test with: curl "http://localhost:3000/api/config/capabilities?query=all"
4. [ ] Response status is 200
5. [ ] Response includes "success": true
6. [ ] Response includes "capabilities" object
7. [ ] At least one capability shows "enabled": true
8. [ ] At least one capability shows "enabled": false (with reason)
9. [ ] Frontend can fetch from /api/config/capabilities
10. [ ] CapabilitiesContext properly caches and displays results
*/

// ============================================================================
// DEBUGGING
// ============================================================================

/*
If the endpoint returns 404:
- Ensure the import is at the top of api/index.js
- Ensure the route is in the routeDefinitions array
- Check the pathname exactly matches: /api/config/capabilities
- Restart the server after making changes

If the endpoint returns 500:
- Check server console for error messages
- Ensure environment variables are set correctly
- Check that all required modules are imported

If capabilities show disabled but shouldn't be:
- Verify environment variables are set
- Check process.env has the right values
- Restart the server (environment vars may be cached)
- Test directly: console.log(process.env.BANKING_API_KEY)

If frontend can't fetch capabilities:
- Check CORS headers are correct (already set in handler)
- Verify /api/config/capabilities is the exact path
- Check browser console for fetch errors
- Ensure CapabilitiesProvider is wrapped around your app
*/

// ============================================================================
// NEXT STEPS
// ============================================================================

/*
After integrating the endpoint:

1. Wrap App.jsx with CapabilitiesProvider
2. Update MainNavigation to check capabilities
3. Update sensitive module components to use useCapability hook
4. Add feature availability checks for premium features
5. Test with different environment variable configurations
6. Set up production environment variables
7. Create monitoring/logging for capability status changes
*/

export const ROUTER_INTEGRATION = {
  file: 'api/index.js',
  import: "import capabilitiesHandler from '../api_src/config/capabilities-endpoint.js';",
  route: {
    pathname: '/api/config/capabilities',
    handler: 'capabilitiesHandler',
    methods: ['GET', 'OPTIONS'],
  },
  testUrl: 'http://localhost:3000/api/config/capabilities?query=all&role=user',
};
