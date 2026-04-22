# Custom Build — Payment-First Flow

**Date:** 2026-04-22
**Status:** Approved

## Overview

Change the custom tag builder so the customer pays a fixed deposit before the owner receives the inquiry email. Today the email fires immediately on form submission with no payment. The new flow saves the design, redirects the customer to Shopify checkout, and sends the email only after payment is confirmed via webhook.

## Current Flow

1. Customer completes 5-step wizard (Shape → Colors → Details → Uploads → Order)
2. `BuildWizard.tsx` POSTs to `/api/custom-inquiry`
3. API saves design to Supabase `custom_inquiries` and emails owner immediately
4. Customer is redirected to `/custom/build/confirmation`

## New Flow

1. Customer completes 5-step wizard (unchanged)
2. `BuildWizard.tsx` POSTs to `/api/custom-inquiry` → receives `{ inquiryId }`
3. Wizard adds the deposit product to the customer's existing Shopify cart (or creates one) with `_custom_inquiry_id` as a line item attribute
4. Customer is redirected to Shopify checkout (`cart.checkoutUrl`)
5. Customer pays
6. Shopify fires `orders/paid` webhook to `/api/webhooks/shopify/orders-paid`
7. Webhook handler verifies HMAC, finds the `_custom_inquiry_id` attribute, looks up the design in Supabase, and sends the owner email

## Deposit Product

- **Handle:** `custom-miscellaneous-bottle-neck-tags-77013`
- **Shopify numeric ID:** `7706531430463`
- **Variant GID:** stored in env var `NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID` (format: `gid://shopify/ProductVariant/<id>`) — obtain the variant ID from Shopify Admin before deploying
- **Quantity:** matches `state.order.quantity` from the wizard

## Cart Behavior

The deposit product is added to the customer's **existing cart** (Option B). If no cart exists yet, one is created. The wizard calls `addToCart()` from `lib/shopify.ts` directly (bypassing `CartProvider.addItem`) so it can read the returned cart's `checkoutUrl` and redirect immediately. CartProvider state does not need to be synced since the customer is navigating away.

## Changes Required

### 1. `/api/custom-inquiry` — modified

- Remove the `resend.emails.send(...)` call and all email-related logic
- Return `{ ok: true, inquiryId: string }` (the Supabase-inserted row ID)
- Supabase insert is otherwise unchanged

### 2. `app/custom/build/BuildWizard.tsx` — modified

Replace `handleNext` final-step logic:

```
1. POST /api/custom-inquiry → { inquiryId }
2. const cartId = cart?.id ?? (await createCart()).id
3. const updatedCart = await addToCart(
     cartId,
     process.env.NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID,
     state.order.quantity,
     [{ key: '_custom_inquiry_id', value: inquiryId }]
   )
4. window.location.href = updatedCart.checkoutUrl
```

Import `createCart` and `addToCart` from `lib/shopify.ts`. Use `useCart()` to read the existing `cart?.id`.

### 3. `/api/webhooks/shopify/orders-paid` — new route

```
POST /api/webhooks/shopify/orders-paid
```

Steps:
1. Read raw request body
2. Verify `X-Shopify-Hmac-SHA256` using `SHOPIFY_WEBHOOK_SECRET` (same pattern as existing webhook routes)
3. Parse JSON payload — iterate `line_items[].properties` to find `{ name: '_custom_inquiry_id' }`
4. If found, query Supabase `custom_inquiries` by that ID
5. Generate signed upload URLs (same logic as the old `/api/custom-inquiry`)
6. Send owner email via Resend (same `buildEmailHtml` template, extracted to a shared module)
7. Return `200 OK` — Shopify retries on non-2xx

### 4. Email template — extracted

Move `buildEmailHtml` from `/api/custom-inquiry/route.ts` into `lib/custom-inquiry-email.ts` so both the old route (during transition) and the new webhook route can import it without duplication.

### 5. New environment variable

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SHOPIFY_CUSTOM_DEPOSIT_VARIANT_ID` | Shopify variant GID for the deposit product (`gid://shopify/ProductVariant/...`) |

### 6. Shopify Admin — webhook registration (manual step)

Register an `orders/paid` webhook in Shopify Admin pointing to:
```
https://www.tommyboydesigns.com/api/webhooks/shopify/orders-paid
```

Use the same `SHOPIFY_WEBHOOK_SECRET` already configured.

## What Does NOT Change

- The 5 wizard steps and all their UI
- The Supabase `custom_inquiries` schema
- The email HTML template content
- The existing `/custom/build/confirmation` page is no longer reachable from the wizard (Shopify handles order confirmation), but the route can remain in place

## Edge Cases

- **Abandoned checkout:** Design is saved to Supabase but no email fires. These rows are identifiable by `status = 'pending'` (or absence of a paid timestamp). A future cron job could clean them up — out of scope for this change.
- **Webhook fires for order with no custom inquiry:** Handler finds no `_custom_inquiry_id` in line items and exits silently — no email, no error.
- **Webhook fires multiple times (Shopify retry):** Email would be sent again. Mitigation is out of scope for this change; low risk given Shopify only retries on failure responses.
