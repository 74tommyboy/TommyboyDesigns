# Chatbot Design Spec
**Date:** 2026-04-15  
**Project:** TommyboyDesigns V2  
**Status:** Approved

---

## Overview

A streaming AI chat widget embedded on every page of the site. Powered by OpenAI, it answers product and policy questions using live Shopify data, and automatically emails the owner when a customer expresses interest in a custom order.

---

## Architecture

### Components

- **`components/ui/ChatWidget.tsx`** — Floating client component added to `app/layout.tsx`. Manages open/closed state and conversation history in local React state. No persistence between sessions.
- **`app/api/chat/route.ts`** — Streaming Next.js API route. Fetches live Shopify product data, builds the OpenAI system prompt, streams the response, and fires a Resend email on custom order detection.

### Data Flow

1. Customer types a message in the widget
2. Widget POSTs full conversation history to `/api/chat`
3. Route fetches live product catalog via `getProducts` from `lib/shopify.ts`
4. Route builds a system prompt with product context + behavior instructions
5. Route calls OpenAI with streaming enabled
6. If the response includes a custom order marker, route fires a Resend email to `OWNER_EMAIL` with the conversation transcript, then strips the marker
7. Streamed response is forwarded to the widget in real-time
8. Widget renders the response word-by-word as it arrives

### New Environment Variable

```
OPENAI_API_KEY
```

---

## UI Widget

**Placement:** Fixed floating button, bottom-right corner, all pages (via `app/layout.tsx`)  
**Style:** Matches existing military/bourbon theme — navy background, amber accent, Tailwind CSS  
**Bot name:** "Tommy's Assistant"

**Panel contents:**
- Header with bot name and close button
- Scrollable message history
- Typing indicator while streaming
- Text input + send button

**State:** Local React state only — no database, no session persistence.

---

## Bot Knowledge & Behavior

### System Prompt Instructions

The bot is instructed to:

1. **Represent TommyboyDesigns** — answer questions about 3D-printed bourbon bottle tags using live product data injected into the prompt (names, descriptions, prices from Shopify)
2. **Answer policy questions** — shipping and returns, referencing the store's existing policy pages
3. **Tone** — friendly, approachable, consistent with a small craft/artisan shop
4. **Custom order escalation** — if the customer asks about custom designs, bulk orders, personalization, or custom artwork, acknowledge warmly, inform them the owner will be notified, and include a hidden `[CUSTOM_ORDER]` marker in the response
5. **Stay on topic** — politely decline questions unrelated to the store

### Custom Order Detection

The system prompt instructs the model to append `[CUSTOM_ORDER]` to its response when custom order intent is detected. The API route:
- Checks for this marker before streaming
- If present: fires Resend email to `OWNER_EMAIL` with subject "Chat inquiry: potential custom order" and full conversation transcript as the body
- Strips the marker from the streamed response before it reaches the customer

---

## Email Notification

- **Trigger:** `[CUSTOM_ORDER]` marker detected in OpenAI response
- **Provider:** Resend (already configured)
- **Recipient:** `OWNER_EMAIL` env var (already configured)
- **Subject:** `Chat inquiry: potential custom order`
- **Body:** Full conversation transcript (all messages in the session)
- **No customer contact info collected** — transcript only

---

## What's Not In Scope

- Conversation persistence / history across sessions
- Admin dashboard or chat log storage
- Customer authentication or identification
- Human handoff / live chat fallback
- Rate limiting (can be added later if abuse becomes an issue)
