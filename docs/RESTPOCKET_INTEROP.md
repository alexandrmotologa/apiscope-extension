# RestPocket Integration Guide

APIScope integrates directly with the RestPocket API client. This allows developers to capture live browser traffic and immediately replay, test, or organize calls inside RestPocket collections.

## Export formats

APIScope exports captured requests in three ways:

### 1. Single request JSON
Formats a captured call as a RestPocket `SavedRequestItem`:

```json
{
  "name": "POST /v1/payment_intents",
  "method": "POST",
  "url": "https://api.stripe.com/v1/payment_intents",
  "headers_json": "{\"Content-Type\":\"application/x-www-form-urlencoded\",\"Stripe-Version\":\"2024-06-20\"}",
  "body_json": "{\"amount\":4999,\"currency\":\"usd\"}",
  "created_at": "2026-09-13T20:00:00.000Z"
}
```

Internal browser pseudo-headers (`:authority`, `:method`, `:path`, `:scheme`) and transport headers (`content-length`) are removed automatically to ensure clean imports.

### 2. Multi-request collection JSON
You can export all captured requests in the current session into a collection JSON file:

```json
{
  "name": "APIScope Captured Session",
  "version": "1.0.0",
  "source": "APIScope Extension",
  "created_at": "2026-09-13T20:00:00.000Z",
  "requests": [
    {
      "name": "POST /api/2024-07/graphql.json",
      "method": "POST",
      "url": "https://store-api.myshopify.com/api/2024-07/graphql.json",
      "headers_json": "{\"Content-Type\":\"application/json\"}",
      "body_json": "{\"query\":\"...\"}",
      "created_at": "2026-09-13T20:00:00.000Z"
    }
  ]
}
```

### 3. Direct browser launch via deep link
Clicking **Open in RestPocket** in the Export tab generates a query string pointing to your local RestPocket instance:

```
http://localhost:5173/?import=apiscope&data=<encoded_json>
```

When opened, RestPocket can read the payload and populate its request editor directly.

## Replaying captured requests in RestPocket

1. In APIScope, select any captured request from the table.
2. Open the **Export** tab in the details panel.
3. Click **Open in RestPocket** to launch the request directly in your browser, or click **JSON** to copy the payload.
4. If copying manually, open RestPocket, navigate to your target collection, and paste the JSON into the import dialog.
5. In RestPocket, modify parameters or headers as needed and hit **Send** to replay the call.
