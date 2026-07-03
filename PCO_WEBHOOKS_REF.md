# Planning Center Webhooks: Operations Guide & Observed Payload Reference

This document is the evidence-backed operational reference for Planning Center webhooks. It explains how to discover valid events, create, secure, verify, monitor, recover, and remove webhook subscriptions. It also documents the payload structures observed from actual incoming webhook deliveries.

Operational instructions are based on verified live API behavior. Payload schemas are based only on captured incoming webhook data. Where behavior has not been verified, it is clearly labeled rather than treated as a guarantee.

# Planning Center Webhook Subscriptions

This section covers subscription discovery, creation, request verification, delivery troubleshooting, recovery, and removal.

## Requirements

Use one of these authentication methods:

- **Personal Access Token (PAT):** HTTP Basic authentication with application ID as the username and secret as the password.
- **OAuth 2:** for a multi-organization integration; request the `webhooks` scope.

```bash
export PCO_APP_ID="your_application_id"
export PCO_SECRET="your_personal_access_token_secret"
export WEBHOOK_URL="https://your-public-receiver.example/webhooks/pco"
```

The receiver URL must be publicly reachable over HTTPS.

**Do not commit credentials, subscription secrets, or production receiver URLs to source control.**

## 1. Discover valid event names

Always read the current event catalog before creating a subscription. Do not invent event names.

````bash
curl --fail-with-body -sS \
  -u "$PCO_APP_ID:$PCO_SECRET" \
  -H "Accept: application/json" \
  "https://api.planningcenteronline.com/webhooks/v2/available_events?per_page=100" \
  | python3 -m json.tool

The catalog may span more than one page. Follow the `links.next` URL or increment the `offset` query parameter by `per_page` (default 25, maximum 100) until all records are retrieved. Each returned entry's exact name is in:

```text
data[].attributes.name
````

```text
data[].attributes.name
```

Examples:

```text
people.v2.events.person.created
services.v2.events.plan.updated
publishing.v2.events.episode.created
```

One subscription is created for one exact event name. Create separate subscriptions for separate events.

## 2. Create a subscription

```bash
EVENT_NAME="people.v2.events.person.created"

curl --fail-with-body -sS -X POST \
  -u "$PCO_APP_ID:$PCO_SECRET" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "data": {
      "type": "Subscription",
      "attributes": {
        "name": "'"$EVENT_NAME"'",
        "url": "'"$WEBHOOK_URL"'",
        "active": true
      }
    }
  }' \
  "https://api.planningcenteronline.com/webhooks/v2/subscriptions" \
  | python3 -m json.tool
```

The live creation contract is:

```text
POST /webhooks/v2/subscriptions
data.type = "Subscription"
```

Do not use the older `/webhook_subscriptions` path or the `WebhookSubscription` resource type for live creation.

## 3. Record the creation result

Store these values in secure connection or flow state:

```text
data.id
data.attributes.name
data.attributes.url
data.attributes.authenticity_secret
data.links.self
data.links.events
data.links.rotate_secret
```

`data.id` is the subscription ID used for verification and removal.

The `authenticity_secret` is sensitive. Save it securely with the subscription record; do not put it in logs or source control.

## 4. Verify every incoming request

Planning Center sends the `X-PCO-Webhooks-Authenticity` header with every delivery.

Before parsing JSON, calculate:

```text
HMAC-SHA256(key = authenticity_secret, message = exact raw HTTP request body)
```

Compare the result with `X-PCO-Webhooks-Authenticity` using a timing-safe comparison. Reject a request when the header is missing or the signatures do not match.

Important rules:

- Validate the **unmodified raw body**, not JSON re-serialized after parsing.
- Retain the raw body only as long as your logging/privacy policy permits.
- A subscription secret is unique to that subscription. Do not validate deliveries from multiple subscriptions with one shared secret.

## 5. Verify the subscription

```bash
SUBSCRIPTION_ID="replace_with_data.id"

curl --fail-with-body -sS \
  -u "$PCO_APP_ID:$PCO_SECRET" \
  -H "Accept: application/json" \
  "https://api.planningcenteronline.com/webhooks/v2/subscriptions/$SUBSCRIPTION_ID" \
  | python3 -m json.tool
```

Check the returned event name, receiver URL, and active state.

## 6. Inspect and troubleshoot deliveries

After a real Planning Center change matching the event name, inspect the subscription’s events:

```bash
curl --fail-with-body -sS \
  -u "$PCO_APP_ID:$PCO_SECRET" \
  -H "Accept: application/json" \
  "https://api.planningcenteronline.com/webhooks/v2/subscriptions/$SUBSCRIPTION_ID/events" \
  | python3 -m json.tool
```

Use the returned event links whenever they are available. In particular, prefer API links returned by a live response over paths copied from older reference material.

Documented event statuses include:

```text
pending
delivered
failed
skipped
duplicated
ignored_failed
ignored_skipped
ignored_duplicated
```

For an event that did not arrive, inspect its delivery information and determine whether Planning Center recorded a failed request, a duplicate, a skipped delivery, or a receiver-side verification error.

For the received request body and the nested `attributes.payload` structure, use the companion observed payload-schema document. Log the original request body before transforming it.

## 7. Advanced recovery and maintenance

The following capabilities are documented in the webhook API spec. Because the supplied OpenAPI uses subscription paths and types that are now stale, **confirm the live endpoint for each operation** through the URLs returned by a subscription's `links` object or by verifying against the current live API before using these in production:

- Enable or disable a subscription by changing its active state.
- Rotate a subscription authenticity secret.
- Retrieve events by delivery status or event UUID.
- Inspect delivery request/response headers, bodies, status codes, and timing.
- Ignore a failed, skipped, or duplicate event.
- Request redelivery of an event.

**Compatibility rule:** older reference material uses `/webhook_subscriptions` and `WebhookSubscription`, which are not the verified live creation contract. For advanced operations, follow the URLs returned by live API responses, or verify the exact current endpoint before changing production state.

After rotating a secret, immediately replace the stored secret used by the receiver. During a secret rotation, avoid accepting a delivery based on an outdated secret without a deliberate transition plan.

## 8. Remove a subscription

Use the subscription ID returned at creation:

```bash
curl --fail-with-body -sS -X DELETE \
  -u "$PCO_APP_ID:$PCO_SECRET" \
  -H "Accept: application/json" \
  "https://api.planningcenteronline.com/webhooks/v2/subscriptions/$SUBSCRIPTION_ID"
```

Treat deletion as irreversible. Remove only the subscription belonging to the receiver or flow being retired.

## Implementation rules

1. Fetch `/available_events` and use an exact returned `attributes.name`.
2. Create one subscription per event name.
3. Persist the returned subscription ID and authenticity secret immediately.
4. Verify the HMAC signature against the exact raw request body before processing the request.
5. Keep the receiver URL stable for the lifetime of the subscription.
6. Log the unmodified incoming body before parsing `attributes.payload`.
7. Do not assume undocumented fields or payload shapes; rely on observed samples for event-specific parsing.
8. Prefer URLs returned by live API responses for advanced management operations.

# Planning Center Incoming Webhook Payload Schemas — Observed Capture Set

> **Trust level:** observed-only. Every statement in this document is derived from the 53 raw incoming webhook deliveries in the capture set. It intentionally does **not** document event types that were not captured, and it does not infer fields from related events.

## Scope and limits

- **Deliveries analyzed:** 100
- **Distinct event names:** 67
- **Capture range based on inner `meta.event_time` where present:** `2026-07-02T22:51:07Z` through `2026-07-02T23:53:04Z`
- **Samples per event:** one. Therefore, a field listed for an event was present in its single captured payload; a missing field may still occur in another valid payload. This document does **not** label resource fields as required or optional.
- **No HTTP headers were captured.** This document makes no claim about signature headers, request method, IP allowlists, retry timing, or HTTP response behavior.
- **Values are not reproduced.** The capture set contains person and organization data; this document records names, structural shapes, and observed JSON value types only.

## How to read the tables

- **Observed value shape** is the JSON value type actually seen: `string`, `integer`, `number`, `boolean`, `null`, `object`, or `array`.
- **`null` means the captured value was null.** It is not proof that a field is always null or that the API guarantees it is nullable.
- **Seen in capture(s)** is intentionally retained even though each event appears once. It prevents this document from implying broader statistical confidence than the capture set supports.
- A relationship described as **array (empty in this capture)** confirms only that the relationship container was an empty array in the captured event; it does not establish its member shape.

## Verified outer delivery envelope

All 100 raw request bodies had a top-level `data` array containing one observed delivery object. Each delivery had the following outer structure:

```json
{
  "data": [
    {
      "id": "<string>",
      "type": "EventDelivery",
      "attributes": {
        "name": "<event-name string>",
        "attempt": 1,
        "payload": "<string containing JSON>"
      },
      "relationships": {
        "organization": {
          "data": { "type": "Organization", "id": "<string>" }
        }
      }
    }
  ]
}
```

### Parsing rule

`data[0].attributes.payload` is a **string**, not an already-parsed object. Parse it exactly once before reading its inner fields:

```ts
const delivery = requestBody.data[0];
const eventName = delivery.attributes.name;
const payload = JSON.parse(delivery.attributes.payload);

const resourceType = payload.data.type;
const resourceId = payload.data.id;
```

Treat the outer `data` value as an array even though every captured request contained one delivery. Do not assume the inner resource has `attributes`, `relationships`, or `included`; their presence differs by event and action.

## Cross-event observations from this capture set

- **Created:** 28 captures. All had `data.attributes`, `included: []`, `meta.event_time`, and `meta.idempotency_token`.
- **Updated:** 15 captures. All had `data.attributes`, `included: []`, `meta.event_time`, and `meta.idempotency_token`.
- **Other non-destroyed events:** `1` `refreshed`, `1` `step_ready`, and `1` `approved`; all followed the same observed pattern of `data.attributes`, `included: []`, `meta.event_time`, and `meta.idempotency_token`.
- **Destroyed:** 22 captures. All omitted `data.attributes`, omitted `included`, and had `meta` containing only `parent`. Fourteen retained `data.relationships`; two (`people.v2.events.list.destroyed` and `services.v2.events.song.destroyed`) did not.
- **Inner `data.links`:** present in all 100 captures.
- **Inner `meta.parent`:** present in all 100 captures.
- **Inner `meta.previous`:** observed only once, on `people.v2.events.workflow_card.updated`.
- **Plan attachment types:** in both observed Plan payloads, `relationships.attachment_types.data` was an empty array—not `null`.

## Observed event index

| App          | Event                                                      | Resource type          | Action       |
| ------------ | ---------------------------------------------------------- | ---------------------- | ------------ |
| `groups`     | `groups.v2.events.group.created`                           | `Group`                | `created`    |
| `groups`     | `groups.v2.events.group.destroyed`                         | `Group`                | `destroyed`  |
| `groups`     | `groups.v2.events.group.updated`                           | `Group`                | `updated`    |
| `groups`     | `groups.v2.events.membership.created`                      | `Membership`           | `created`    |
| `groups`     | `groups.v2.events.membership.destroyed`                    | `Membership`           | `destroyed`  |
| `groups`     | `groups.church_center.v2.events.group_application.created` | `GroupApplication`     | `created`    |
| `groups`     | `groups.church_center.v2.events.group_application.updated` | `GroupApplication`     | `updated`    |
| `people`     | `people.v2.events.address.created`                         | `Address`              | `created`    |
| `people`     | `people.v2.events.address.destroyed`                       | `Address`              | `destroyed`  |
| `people`     | `people.v2.events.email.created`                           | `Email`                | `created`    |
| `people`     | `people.v2.events.email.destroyed`                         | `Email`                | `destroyed`  |
| `people`     | `people.v2.events.field_datum.created`                     | `FieldDatum`           | `created`    |
| `people`     | `people.v2.events.field_datum.destroyed`                   | `FieldDatum`           | `destroyed`  |
| `people`     | `people.v2.events.field_definition.created`                | `FieldDefinition`      | `created`    |
| `people`     | `people.v2.events.form_submission.created`                 | `FormSubmission`       | `created`    |
| `people`     | `people.v2.events.household.created`                       | `Household`            | `created`    |
| `people`     | `people.v2.events.household.destroyed`                     | `Household`            | `destroyed`  |
| `people`     | `people.v2.events.household.updated`                       | `Household`            | `updated`    |
| `people`     | `people.v2.events.list.created`                            | `List`                 | `created`    |
| `people`     | `people.v2.events.list.destroyed`                          | `List`                 | `destroyed`  |
| `people`     | `people.v2.events.list.refreshed`                          | `List`                 | `refreshed`  |
| `people`     | `people.v2.events.list.updated`                            | `List`                 | `updated`    |
| `people`     | `people.v2.events.list_result.created`                     | `ListResult`           | `created`    |
| `people`     | `people.v2.events.list_result.destroyed`                   | `ListResult`           | `destroyed`  |
| `people`     | `people.v2.events.note.created`                            | `Note`                 | `created`    |
| `people`     | `people.v2.events.note.destroyed`                          | `Note`                 | `destroyed`  |
| `people`     | `people.v2.events.person.created`                          | `Person`               | `created`    |
| `people`     | `people.v2.events.person.updated`                          | `Person`               | `updated`    |
| `people`     | `people.v2.events.phone_number.created`                    | `PhoneNumber`          | `created`    |
| `people`     | `people.v2.events.phone_number.destroyed`                  | `PhoneNumber`          | `destroyed`  |
| `people`     | `people.v2.events.phone_number.updated`                    | `PhoneNumber`          | `updated`    |
| `people`     | `people.v2.events.workflow.created`                        | `Workflow`             | `created`    |
| `people`     | `people.v2.events.workflow.destroyed`                      | `Workflow`             | `destroyed`  |
| `people`     | `people.v2.events.workflow.updated`                        | `Workflow`             | `updated`    |
| `people`     | `people.v2.events.workflow_card.created`                   | `WorkflowCard`         | `created`    |
| `people`     | `people.v2.events.workflow_card.destroyed`                 | `WorkflowCard`         | `destroyed`  |
| `people`     | `people.v2.events.workflow_card.step_ready`                | `WorkflowCard`         | `step_ready` |
| `people`     | `people.v2.events.workflow_card.updated`                   | `WorkflowCard`         | `updated`    |
| `people`     | `people.v2.events.workflow_card_activity.created`          | `WorkflowCardActivity` | `created`    |
| `people`     | `people.v2.events.workflow_card_activity.destroyed`        | `WorkflowCardActivity` | `destroyed`  |
| `people`     | `people.v2.events.workflow_share.created`                  | `WorkflowShare`        | `created`    |
| `people`     | `people.v2.events.workflow_step.created`                   | `WorkflowStep`         | `created`    |
| `people`     | `people.v2.events.workflow_step.destroyed`                 | `WorkflowStep`         | `destroyed`  |
| `people`     | `people.v2.events.workflow_step.updated`                   | `WorkflowStep`         | `updated`    |
| `publishing` | `publishing.v2.events.episode.created`                     | `Episode`              | `created`    |
| `publishing` | `publishing.v2.events.episode.destroyed`                   | `Episode`              | `destroyed`  |
| `publishing` | `publishing.v2.events.episode.updated`                     | `Episode`              | `updated`    |
| `publishing` | `publishing.v2.events.episode_time.created`                | `EpisodeTime`          | `created`    |
| `publishing` | `publishing.v2.events.episode_time.destroyed`              | `EpisodeTime`          | `destroyed`  |
| `publishing` | `publishing.v2.events.episode_time.updated`                | `EpisodeTime`          | `updated`    |
| `services`   | `services.v2.events.arrangement.created`                   | `Arrangement`          | `created`    |
| `services`   | `services.v2.events.arrangement.destroyed`                 | `Arrangement`          | `destroyed`  |
| `services`   | `services.v2.events.key.created`                           | `Key`                  | `created`    |
| `services`   | `services.v2.events.key.destroyed`                         | `Key`                  | `destroyed`  |
| `services`   | `services.v2.events.key.updated`                           | `Key`                  | `updated`    |
| `services`   | `services.v2.events.plan.destroyed`                        | `Plan`                 | `destroyed`  |
| `services`   | `services.v2.events.plan.updated`                          | `Plan`                 | `updated`    |
| `services`   | `services.v2.events.plan_item.created`                     | `Item`                 | `created`    |
| `services`   | `services.v2.events.plan_item.destroyed`                   | `Item`                 | `destroyed`  |
| `services`   | `services.v2.events.plan_item.updated`                     | `Item`                 | `updated`    |
| `services`   | `services.v2.events.plan_note.created`                     | `PlanNote`             | `created`    |
| `services`   | `services.v2.events.plan_note.destroyed`                   | `PlanNote`             | `destroyed`  |
| `services`   | `services.v2.events.song.created`                          | `Song`                 | `created`    |
| `services`   | `services.v2.events.song.destroyed`                        | `Song`                 | `destroyed`  |
| `calendar`   | `calendar.v2.events.event_request.created`                 | `EventRequest`         | `created`    |
| `calendar`   | `calendar.v2.events.event_request.approved`                | `EventRequest`         | `approved`   |
| `calendar`   | `calendar.v2.events.event_request.updated`                 | `EventRequest`         | `updated`    |

## Event schemas

### Groups

#### `groups.v2.events.group.created`

- **Captured deliveries:** 1
- **Resource type:** `Group`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                | Observed value shape | Seen in capture(s) |
| ------------------------------------ | -------------------- | ------------------ |
| `archived_at`                        | null                 | 1/1                |
| `chat_enabled`                       | boolean              | 1/1                |
| `contact_email`                      | null                 | 1/1                |
| `created_at`                         | string               | 1/1                |
| `description`                        | null                 | 1/1                |
| `description_as_plain_text`          | null                 | 1/1                |
| `events_listed`                      | boolean              | 1/1                |
| `events_visibility`                  | string               | 1/1                |
| `header_image`                       | object               | 1/1                |
| `leaders_can_search_people_database` | boolean              | 1/1                |
| `listed`                             | boolean              | 1/1                |
| `location_type_preference`           | string               | 1/1                |
| `members_are_confidential`           | boolean              | 1/1                |
| `memberships_count`                  | integer              | 1/1                |
| `name`                               | string               | 1/1                |
| `public_church_center_web_url`       | null                 | 1/1                |
| `schedule`                           | null                 | 1/1                |
| `virtual_location_url`               | null                 | 1/1                |

**Relationships observed**

| Field        | Observed value shape                 | Seen in capture(s) |
| ------------ | ------------------------------------ | ------------------ |
| `group_type` | `GroupType` reference (`id`: string) | 1/1                |
| `location`   | null                                 | 1/1                |

**Links observed**

| Field             | Observed value shape | Seen in capture(s) |
| ----------------- | -------------------- | ------------------ |
| `applications`    | string               | 1/1                |
| `assign_campuses` | string               | 1/1                |
| `campuses`        | string               | 1/1                |
| `disable_chat`    | string               | 1/1                |
| `duplicate`       | string               | 1/1                |
| `enable_chat`     | string               | 1/1                |
| `enrollment`      | string               | 1/1                |
| `events`          | string               | 1/1                |
| `group_type`      | string               | 1/1                |
| `location`        | null                 | 1/1                |
| `memberships`     | string               | 1/1                |
| `my_membership`   | null                 | 1/1                |
| `people`          | string               | 1/1                |
| `resources`       | string               | 1/1                |
| `tags`            | string               | 1/1                |
| `self`            | string               | 1/1                |
| `html`            | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `onboarding`        | boolean              | 1/1                |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `groups.v2.events.membership.created`

- **Captured deliveries:** 1
- **Resource type:** `Membership`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field       | Observed value shape | Seen in capture(s) |
| ----------- | -------------------- | ------------------ |
| `joined_at` | string               | 1/1                |
| `role`      | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `group`  | `Group` reference (`id`: string)  | 1/1                |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `group`  | string               | 1/1                |
| `person` | string               | 1/1                |
| `self`   | string               | 1/1                |
| `html`   | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `groups.v2.events.membership.destroyed`

- **Captured deliveries:** 2
- **Resource type:** `Membership`
- **Inner payload keys observed:** `data` (object; 2/2), `meta` (object; 2/2)
- **Inner `data` keys observed:** `type` (string; 2/2), `id` (string; 2/2), `relationships` (object; 2/2), `links` (object; 2/2)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `group`  | `Group` reference (`id`: string)  | 2/2                |
| `person` | `Person` reference (`id`: string) | 2/2                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 2/2                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 2/2                |

#### `groups.v2.events.group.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Group`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field        | Observed value shape                 | Seen in capture(s) |
| ------------ | ------------------------------------ | ------------------ |
| `group_type` | `GroupType` reference (`id`: string) | 1/1                |
| `location`   | null                                 | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `groups.v2.events.group.updated`

- **Captured deliveries:** 1
- **Resource type:** `Group`
- **Inner payload keys observed:** `data` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                | Observed value shape | Seen in capture(s) |
| ------------------------------------ | -------------------- | ------------------ |
| `archived_at`                        | null                 | 1/1                |
| `chat_enabled`                       | boolean              | 1/1                |
| `contact_email`                      | null                 | 1/1                |
| `created_at`                         | string               | 1/1                |
| `description`                        | null                 | 1/1                |
| `description_as_plain_text`          | null                 | 1/1                |
| `events_listed`                      | boolean              | 1/1                |
| `events_visibility`                  | string               | 1/1                |
| `header_image`                       | object               | 1/1                |
| `leaders_can_search_people_database` | boolean              | 1/1                |
| `listed`                             | boolean              | 1/1                |
| `location_type_preference`           | string               | 1/1                |
| `members_are_confidential`           | boolean              | 1/1                |
| `memberships_count`                  | integer              | 1/1                |
| `name`                               | string               | 1/1                |
| `public_church_center_web_url`       | null                 | 1/1                |
| `schedule`                           | null                 | 1/1                |
| `virtual_location_url`               | null                 | 1/1                |

**Relationships observed**

| Field        | Observed value shape                 | Seen in capture(s) |
| ------------ | ------------------------------------ | ------------------ |
| `group_type` | `GroupType` reference (`id`: string) | 1/1                |
| `location`   | null                                 | 1/1                |

**Links observed**

| Field             | Observed value shape | Seen in capture(s) |
| ----------------- | -------------------- | ------------------ |
| `applications`    | string               | 1/1                |
| `assign_campuses` | string               | 1/1                |
| `campuses`        | string               | 1/1                |
| `disable_chat`    | string               | 1/1                |
| `duplicate`       | string               | 1/1                |
| `enable_chat`     | string               | 1/1                |
| `enrollment`      | string               | 1/1                |
| `events`          | string               | 1/1                |
| `group_type`      | string               | 1/1                |
| `location`        | null                 | 1/1                |
| `members`         | string               | 1/1                |
| `self`            | string               | 1/1                |

**Meta fields observed**

_Not present in the captured payload._

#### `groups.church_center.v2.events.group_application.created`

- **Captured deliveries:** 1
- **Resource type:** `GroupApplication`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `applied_at`               | string               | 1/1                |
| `approval_status`          | string               | 1/1                |
| `group_name`               | string               | 1/1                |
| `message`                  | null                 | 1/1                |
| `public_church_center_url` | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `group`  | `Group` reference (`id`: string)  | 1/1                |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field                           | Observed value shape | Seen in capture(s) |
| ------------------------------- | -------------------- | ------------------ |
| `approve`                       | string               | 1/1                |
| `group`                         | string               | 1/1                |
| `latest_scam_prevention_report` | null                 | 1/1                |
| `person`                        | string               | 1/1                |
| `reject`                        | string               | 1/1                |
| `self`                          | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `groups.church_center.v2.events.group_application.updated`

- **Captured deliveries:** 1
- **Resource type:** `GroupApplication`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `applied_at`               | string               | 1/1                |
| `approval_status`          | string               | 1/1                |
| `group_name`               | string               | 1/1                |
| `message`                  | null                 | 1/1                |
| `public_church_center_url` | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `group`  | `Group` reference (`id`: string)  | 1/1                |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field                           | Observed value shape | Seen in capture(s) |
| ------------------------------- | -------------------- | ------------------ |
| `approve`                       | string               | 1/1                |
| `group`                         | string               | 1/1                |
| `latest_scam_prevention_report` | null                 | 1/1                |
| `person`                        | string               | 1/1                |
| `reject`                        | string               | 1/1                |
| `self`                          | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

### People

#### `people.v2.events.address.created`

- **Captured deliveries:** 1
- **Resource type:** `Address`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field          | Observed value shape | Seen in capture(s) |
| -------------- | -------------------- | ------------------ |
| `city`         | string               | 1/1                |
| `country_code` | string               | 1/1                |
| `country_name` | string               | 1/1                |
| `created_at`   | string               | 1/1                |
| `location`     | string               | 1/1                |
| `primary`      | boolean              | 1/1                |
| `state`        | string               | 1/1                |
| `street`       | string               | 1/1                |
| `updated_at`   | string               | 1/1                |
| `zip`          | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field     | Observed value shape | Seen in capture(s) |
| --------- | -------------------- | ------------------ |
| `country` | string               | 1/1                |
| `self`    | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.address.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Address`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.email.created`

- **Captured deliveries:** 1
- **Resource type:** `Email`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field        | Observed value shape | Seen in capture(s) |
| ------------ | -------------------- | ------------------ |
| `address`    | string               | 1/1                |
| `blocked`    | boolean              | 1/1                |
| `created_at` | string               | 1/1                |
| `location`   | string               | 1/1                |
| `primary`    | boolean              | 1/1                |
| `updated_at` | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `person` | string               | 1/1                |
| `self`   | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.email.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Email`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.field_datum.created`

- **Captured deliveries:** 1
- **Resource type:** `FieldDatum`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `created_at`        | string               | 1/1                |
| `file`              | object               | 1/1                |
| `file_content_type` | null                 | 1/1                |
| `file_name`         | null                 | 1/1                |
| `file_size`         | null                 | 1/1                |
| `updated_at`        | string               | 1/1                |
| `value`             | string               | 1/1                |

**Relationships observed**

| Field              | Observed value shape                       | Seen in capture(s) |
| ------------------ | ------------------------------------------ | ------------------ |
| `field_definition` | `FieldDefinition` reference (`id`: string) | 1/1                |
| `customizable`     | `Person` reference (`id`: string)          | 1/1                |

**Links observed**

| Field              | Observed value shape | Seen in capture(s) |
| ------------------ | -------------------- | ------------------ |
| `field_definition` | string               | 1/1                |
| `field_option`     | null                 | 1/1                |
| `person`           | string               | 1/1                |
| `tab`              | string               | 1/1                |
| `self`             | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.field_datum.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `FieldDatum`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field              | Observed value shape                       | Seen in capture(s) |
| ------------------ | ------------------------------------------ | ------------------ |
| `field_definition` | `FieldDefinition` reference (`id`: string) | 1/1                |
| `customizable`     | `Person` reference (`id`: string)          | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.field_definition.created`

- **Captured deliveries:** 1
- **Resource type:** `FieldDefinition`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field        | Observed value shape | Seen in capture(s) |
| ------------ | -------------------- | ------------------ |
| `config`     | null                 | 1/1                |
| `data_type`  | string               | 1/1                |
| `deleted_at` | null                 | 1/1                |
| `name`       | string               | 1/1                |
| `sequence`   | integer              | 1/1                |
| `slug`       | string               | 1/1                |
| `tab_id`     | integer              | 1/1                |

**Relationships observed**

| Field | Observed value shape           | Seen in capture(s) |
| ----- | ------------------------------ | ------------------ |
| `tab` | `Tab` reference (`id`: string) | 1/1                |

**Links observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `field_options` | string               | 1/1                |
| `tab`           | string               | 1/1                |
| `self`          | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.form_submission.created`

- **Captured deliveries:** 1
- **Resource type:** `FormSubmission`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `created_at`                | string               | 1/1                |
| `selected_options_by_field` | object               | 1/1                |
| `updated_at`                | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |
| `form`   | `Form` reference (`id`: string)   | 1/1                |

**Links observed**

| Field                    | Observed value shape | Seen in capture(s) |
| ------------------------ | -------------------- | ------------------ |
| `form`                   | string               | 1/1                |
| `form_fields`            | string               | 1/1                |
| `form_submission_values` | string               | 1/1                |
| `person`                 | string               | 1/1                |
| `self`                   | string               | 1/1                |
| `html`                   | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.household.created`

- **Captured deliveries:** 1
- **Resource type:** `Household`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                  | Observed value shape | Seen in capture(s) |
| ---------------------- | -------------------- | ------------------ |
| `avatar`               | string               | 1/1                |
| `created_at`           | string               | 1/1                |
| `member_count`         | integer              | 1/1                |
| `name`                 | string               | 1/1                |
| `primary_contact_id`   | string               | 1/1                |
| `primary_contact_name` | string               | 1/1                |
| `updated_at`           | string               | 1/1                |

**Relationships observed**

| Field             | Observed value shape                       | Seen in capture(s) |
| ----------------- | ------------------------------------------ | ------------------ |
| `primary_contact` | `Person` reference (`id`: string)          | 1/1                |
| `people`          | array of `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `household_memberships` | string               | 1/1                |
| `people`                | string               | 1/1                |
| `self`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.household.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Household`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field             | Observed value shape                       | Seen in capture(s) |
| ----------------- | ------------------------------------------ | ------------------ |
| `primary_contact` | `Person` reference (`id`: string)          | 1/1                |
| `people`          | array of `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.household.updated`

- **Captured deliveries:** 1
- **Resource type:** `Household`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                  | Observed value shape | Seen in capture(s) |
| ---------------------- | -------------------- | ------------------ |
| `avatar`               | string               | 1/1                |
| `created_at`           | string               | 1/1                |
| `member_count`         | integer              | 1/1                |
| `name`                 | string               | 1/1                |
| `primary_contact_id`   | string               | 1/1                |
| `primary_contact_name` | string               | 1/1                |
| `updated_at`           | string               | 1/1                |

**Relationships observed**

| Field             | Observed value shape                       | Seen in capture(s) |
| ----------------- | ------------------------------------------ | ------------------ |
| `primary_contact` | `Person` reference (`id`: string)          | 1/1                |
| `people`          | array of `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `household_memberships` | string               | 1/1                |
| `people`                | string               | 1/1                |
| `self`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.list.created`

- **Captured deliveries:** 1
- **Resource type:** `List`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `active_automations_count` | integer              | 1/1                |
| `auto_refresh`             | boolean              | 1/1                |
| `auto_refresh_frequency`   | string               | 1/1                |
| `automations_active`       | boolean              | 1/1                |
| `automations_count`        | integer              | 1/1                |
| `batch_completed_at`       | null                 | 1/1                |
| `created_at`               | string               | 1/1                |
| `description`              | string               | 1/1                |
| `has_inactive_results`     | null                 | 1/1                |
| `include_inactive`         | boolean              | 1/1                |
| `invalid`                  | boolean              | 1/1                |
| `name`                     | null                 | 1/1                |
| `name_or_description`      | string               | 1/1                |
| `paused_automations_count` | integer              | 1/1                |
| `recently_viewed`          | boolean              | 1/1                |
| `refreshed_at`             | null                 | 1/1                |
| `return_original_if_none`  | boolean              | 1/1                |
| `returns`                  | string               | 1/1                |
| `starred`                  | boolean              | 1/1                |
| `status`                   | string               | 1/1                |
| `subset`                   | string               | 1/1                |
| `total_people`             | integer              | 1/1                |
| `updated_at`               | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `campus`                | null                 | 1/1                |
| `category`              | null                 | 1/1                |
| `created_by`            | string               | 1/1                |
| `list_results`          | string               | 1/1                |
| `mailchimp_sync`        | string               | 1/1                |
| `mailchimp_sync_status` | null                 | 1/1                |
| `owner`                 | string               | 1/1                |
| `people`                | string               | 1/1                |
| `rules`                 | string               | 1/1                |
| `run`                   | string               | 1/1                |
| `shares`                | string               | 1/1                |
| `star`                  | string               | 1/1                |
| `updated_by`            | string               | 1/1                |
| `self`                  | string               | 1/1                |
| `html`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.list.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `List`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.list.refreshed`

- **Captured deliveries:** 1
- **Resource type:** `List`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `active_automations_count` | integer              | 1/1                |
| `auto_refresh`             | boolean              | 1/1                |
| `auto_refresh_frequency`   | string               | 1/1                |
| `automations_active`       | boolean              | 1/1                |
| `automations_count`        | integer              | 1/1                |
| `batch_completed_at`       | string               | 1/1                |
| `created_at`               | string               | 1/1                |
| `description`              | string               | 1/1                |
| `has_inactive_results`     | boolean              | 1/1                |
| `include_inactive`         | boolean              | 1/1                |
| `invalid`                  | boolean              | 1/1                |
| `name`                     | string               | 1/1                |
| `name_or_description`      | string               | 1/1                |
| `paused_automations_count` | integer              | 1/1                |
| `recently_viewed`          | boolean              | 1/1                |
| `refreshed_at`             | string               | 1/1                |
| `return_original_if_none`  | boolean              | 1/1                |
| `returns`                  | string               | 1/1                |
| `starred`                  | boolean              | 1/1                |
| `status`                   | string               | 1/1                |
| `subset`                   | string               | 1/1                |
| `total_people`             | integer              | 1/1                |
| `updated_at`               | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `campus`                | null                 | 1/1                |
| `category`              | string               | 1/1                |
| `created_by`            | string               | 1/1                |
| `list_results`          | string               | 1/1                |
| `mailchimp_sync`        | string               | 1/1                |
| `mailchimp_sync_status` | null                 | 1/1                |
| `owner`                 | string               | 1/1                |
| `people`                | string               | 1/1                |
| `rules`                 | string               | 1/1                |
| `run`                   | string               | 1/1                |
| `shares`                | string               | 1/1                |
| `star`                  | string               | 1/1                |
| `updated_by`            | string               | 1/1                |
| `self`                  | string               | 1/1                |
| `html`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.list.updated`

- **Captured deliveries:** 1
- **Resource type:** `List`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `active_automations_count` | integer              | 1/1                |
| `auto_refresh`             | boolean              | 1/1                |
| `auto_refresh_frequency`   | string               | 1/1                |
| `automations_active`       | boolean              | 1/1                |
| `automations_count`        | integer              | 1/1                |
| `batch_completed_at`       | string               | 1/1                |
| `created_at`               | string               | 1/1                |
| `description`              | string               | 1/1                |
| `has_inactive_results`     | boolean              | 1/1                |
| `include_inactive`         | boolean              | 1/1                |
| `invalid`                  | boolean              | 1/1                |
| `name`                     | null                 | 1/1                |
| `name_or_description`      | string               | 1/1                |
| `paused_automations_count` | integer              | 1/1                |
| `recently_viewed`          | boolean              | 1/1                |
| `refreshed_at`             | string               | 1/1                |
| `return_original_if_none`  | boolean              | 1/1                |
| `returns`                  | string               | 1/1                |
| `starred`                  | boolean              | 1/1                |
| `status`                   | string               | 1/1                |
| `subset`                   | string               | 1/1                |
| `total_people`             | integer              | 1/1                |
| `updated_at`               | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `campus`                | null                 | 1/1                |
| `category`              | null                 | 1/1                |
| `created_by`            | string               | 1/1                |
| `list_results`          | string               | 1/1                |
| `mailchimp_sync`        | string               | 1/1                |
| `mailchimp_sync_status` | null                 | 1/1                |
| `owner`                 | string               | 1/1                |
| `people`                | string               | 1/1                |
| `rules`                 | string               | 1/1                |
| `run`                   | string               | 1/1                |
| `shares`                | string               | 1/1                |
| `star`                  | string               | 1/1                |
| `updated_by`            | string               | 1/1                |
| `self`                  | string               | 1/1                |
| `html`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.list_result.created`

- **Captured deliveries:** 1
- **Resource type:** `ListResult`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field        | Observed value shape | Seen in capture(s) |
| ------------ | -------------------- | ------------------ |
| `created_at` | string               | 1/1                |
| `updated_at` | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |
| `list`   | `List` reference (`id`: string)   | 1/1                |

**Links observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `person` | string               | 1/1                |
| `self`   | string               | 1/1                |
| `html`   | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.list_result.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `ListResult`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |
| `list`   | `List` reference (`id`: string)   | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.note.created`

- **Captured deliveries:** 1
- **Resource type:** `Note`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field              | Observed value shape | Seen in capture(s) |
| ------------------ | -------------------- | ------------------ |
| `created_at`       | string               | 1/1                |
| `created_by_id`    | integer              | 1/1                |
| `display_date`     | string               | 1/1                |
| `note`             | string               | 1/1                |
| `note_category_id` | integer              | 1/1                |
| `organization_id`  | integer              | 1/1                |
| `person_id`        | integer              | 1/1                |
| `updated_at`       | string               | 1/1                |

**Relationships observed**

| Field           | Observed value shape                    | Seen in capture(s) |
| --------------- | --------------------------------------- | ------------------ |
| `note_category` | `NoteCategory` reference (`id`: string) | 1/1                |
| `organization`  | `Organization` reference (`id`: string) | 1/1                |
| `person`        | `Person` reference (`id`: string)       | 1/1                |
| `created_by`    | `Person` reference (`id`: string)       | 1/1                |

**Links observed**

| Field        | Observed value shape | Seen in capture(s) |
| ------------ | -------------------- | ------------------ |
| `category`   | string               | 1/1                |
| `created_by` | string               | 1/1                |
| `person`     | string               | 1/1                |
| `self`       | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.note.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Note`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field           | Observed value shape                    | Seen in capture(s) |
| --------------- | --------------------------------------- | ------------------ |
| `note_category` | `NoteCategory` reference (`id`: string) | 1/1                |
| `organization`  | `Organization` reference (`id`: string) | 1/1                |
| `person`        | `Person` reference (`id`: string)       | 1/1                |
| `created_by`    | `Person` reference (`id`: string)       | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.person.created`

- **Captured deliveries:** 1
- **Resource type:** `Person`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `accounting_administrator`  | boolean              | 1/1                |
| `anniversary`               | null                 | 1/1                |
| `avatar`                    | string               | 1/1                |
| `birthdate`                 | null                 | 1/1                |
| `can_create_forms`          | boolean              | 1/1                |
| `can_email_lists`           | boolean              | 1/1                |
| `child`                     | boolean              | 1/1                |
| `created_at`                | string               | 1/1                |
| `demographic_avatar_url`    | string               | 1/1                |
| `directory_status`          | string               | 1/1                |
| `first_name`                | string               | 1/1                |
| `gender`                    | null                 | 1/1                |
| `given_name`                | null                 | 1/1                |
| `grade`                     | null                 | 1/1                |
| `graduation_year`           | null                 | 1/1                |
| `inactivated_at`            | null                 | 1/1                |
| `last_name`                 | string               | 1/1                |
| `login_identifier`          | null                 | 1/1                |
| `medical_notes`             | null                 | 1/1                |
| `membership`                | null                 | 1/1                |
| `middle_name`               | null                 | 1/1                |
| `name`                      | string               | 1/1                |
| `nickname`                  | null                 | 1/1                |
| `passed_background_check`   | boolean              | 1/1                |
| `people_permissions`        | null                 | 1/1                |
| `remote_id`                 | null                 | 1/1                |
| `resource_permission_flags` | object               | 1/1                |
| `school_type`               | null                 | 1/1                |
| `site_administrator`        | boolean              | 1/1                |
| `status`                    | string               | 1/1                |
| `updated_at`                | string               | 1/1                |

**Relationships observed**

| Field            | Observed value shape | Seen in capture(s) |
| ---------------- | -------------------- | ------------------ |
| `primary_campus` | null                 | 1/1                |
| `gender`         | null                 | 1/1                |

**Links observed**

| Field                                  | Observed value shape | Seen in capture(s) |
| -------------------------------------- | -------------------- | ------------------ |
| `addresses`                            | string               | 1/1                |
| `apps`                                 | string               | 1/1                |
| `connected_people`                     | string               | 1/1                |
| `emails`                               | string               | 1/1                |
| `field_data`                           | string               | 1/1                |
| `household_memberships`                | string               | 1/1                |
| `households`                           | string               | 1/1                |
| `inactive_reason`                      | null                 | 1/1                |
| `marital_status`                       | null                 | 1/1                |
| `message_groups`                       | string               | 1/1                |
| `messages`                             | string               | 1/1                |
| `name_prefix`                          | null                 | 1/1                |
| `name_suffix`                          | null                 | 1/1                |
| `notes`                                | string               | 1/1                |
| `organization`                         | string               | 1/1                |
| `person_apps`                          | string               | 1/1                |
| `phone_numbers`                        | string               | 1/1                |
| `platform_notifications`               | string               | 1/1                |
| `primary_campus`                       | null                 | 1/1                |
| `school`                               | null                 | 1/1                |
| `social_profiles`                      | string               | 1/1                |
| `workflow_assignee_workflow_summaries` | string               | 1/1                |
| `workflow_cards`                       | string               | 1/1                |
| `workflow_shares`                      | string               | 1/1                |
| `self`                                 | string               | 1/1                |
| `html`                                 | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |
| `public`            | object               | 1/1                |

#### `people.v2.events.person.updated`

- **Captured deliveries:** 1
- **Resource type:** `Person`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `accounting_administrator`  | boolean              | 1/1                |
| `anniversary`               | null                 | 1/1                |
| `avatar`                    | string               | 1/1                |
| `birthdate`                 | null                 | 1/1                |
| `can_create_forms`          | boolean              | 1/1                |
| `can_email_lists`           | boolean              | 1/1                |
| `child`                     | boolean              | 1/1                |
| `created_at`                | string               | 1/1                |
| `demographic_avatar_url`    | string               | 1/1                |
| `directory_status`          | string               | 1/1                |
| `first_name`                | string               | 1/1                |
| `gender`                    | null                 | 1/1                |
| `given_name`                | null                 | 1/1                |
| `grade`                     | null                 | 1/1                |
| `graduation_year`           | null                 | 1/1                |
| `inactivated_at`            | null                 | 1/1                |
| `last_name`                 | string               | 1/1                |
| `login_identifier`          | null                 | 1/1                |
| `medical_notes`             | null                 | 1/1                |
| `membership`                | string               | 1/1                |
| `middle_name`               | null                 | 1/1                |
| `name`                      | string               | 1/1                |
| `nickname`                  | null                 | 1/1                |
| `passed_background_check`   | boolean              | 1/1                |
| `people_permissions`        | null                 | 1/1                |
| `remote_id`                 | null                 | 1/1                |
| `resource_permission_flags` | object               | 1/1                |
| `school_type`               | null                 | 1/1                |
| `site_administrator`        | boolean              | 1/1                |
| `status`                    | string               | 1/1                |
| `updated_at`                | string               | 1/1                |

**Relationships observed**

| Field            | Observed value shape | Seen in capture(s) |
| ---------------- | -------------------- | ------------------ |
| `primary_campus` | null                 | 1/1                |
| `gender`         | null                 | 1/1                |

**Links observed**

| Field                                  | Observed value shape | Seen in capture(s) |
| -------------------------------------- | -------------------- | ------------------ |
| `addresses`                            | string               | 1/1                |
| `apps`                                 | string               | 1/1                |
| `connected_people`                     | string               | 1/1                |
| `emails`                               | string               | 1/1                |
| `field_data`                           | string               | 1/1                |
| `household_memberships`                | string               | 1/1                |
| `households`                           | string               | 1/1                |
| `inactive_reason`                      | null                 | 1/1                |
| `marital_status`                       | null                 | 1/1                |
| `message_groups`                       | string               | 1/1                |
| `messages`                             | string               | 1/1                |
| `name_prefix`                          | null                 | 1/1                |
| `name_suffix`                          | null                 | 1/1                |
| `notes`                                | string               | 1/1                |
| `organization`                         | string               | 1/1                |
| `person_apps`                          | string               | 1/1                |
| `phone_numbers`                        | string               | 1/1                |
| `platform_notifications`               | string               | 1/1                |
| `primary_campus`                       | null                 | 1/1                |
| `school`                               | null                 | 1/1                |
| `social_profiles`                      | string               | 1/1                |
| `workflow_assignee_workflow_summaries` | string               | 1/1                |
| `workflow_cards`                       | string               | 1/1                |
| `workflow_shares`                      | string               | 1/1                |
| `self`                                 | string               | 1/1                |
| `html`                                 | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |
| `public`            | object               | 1/1                |

#### `people.v2.events.phone_number.created`

- **Captured deliveries:** 1
- **Resource type:** `PhoneNumber`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `carrier`       | null                 | 1/1                |
| `country_code`  | string               | 1/1                |
| `created_at`    | string               | 1/1                |
| `e164`          | string               | 1/1                |
| `international` | string               | 1/1                |
| `location`      | string               | 1/1                |
| `national`      | string               | 1/1                |
| `number`        | string               | 1/1                |
| `primary`       | boolean              | 1/1                |
| `updated_at`    | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.phone_number.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `PhoneNumber`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.phone_number.updated`

- **Captured deliveries:** 1
- **Resource type:** `PhoneNumber`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `carrier`       | null                 | 1/1                |
| `country_code`  | string               | 1/1                |
| `created_at`    | string               | 1/1                |
| `e164`          | string               | 1/1                |
| `international` | string               | 1/1                |
| `location`      | string               | 1/1                |
| `national`      | string               | 1/1                |
| `number`        | string               | 1/1                |
| `primary`       | boolean              | 1/1                |
| `updated_at`    | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `person` | `Person` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow.created`

- **Captured deliveries:** 1
- **Resource type:** `Workflow`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                | Observed value shape | Seen in capture(s) |
| ------------------------------------ | -------------------- | ------------------ |
| `archived_at`                        | null                 | 1/1                |
| `campus_id`                          | null                 | 1/1                |
| `completed_card_count`               | integer              | 1/1                |
| `created_at`                         | string               | 1/1                |
| `deleted_at`                         | null                 | 1/1                |
| `my_ready_card_count`                | integer              | 1/1                |
| `name`                               | string               | 1/1                |
| `recently_viewed`                    | boolean              | 1/1                |
| `total_cards_count`                  | integer              | 1/1                |
| `total_overdue_card_count`           | integer              | 1/1                |
| `total_ready_and_snoozed_card_count` | integer              | 1/1                |
| `total_ready_card_count`             | integer              | 1/1                |
| `total_steps_count`                  | integer              | 1/1                |
| `total_unassigned_card_count`        | integer              | 1/1                |
| `total_unassigned_steps_count`       | integer              | 1/1                |
| `updated_at`                         | string               | 1/1                |
| `workflow_category_id`               | null                 | 1/1                |

**Relationships observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `workflow_category` | null                 | 1/1                |
| `campus`            | null                 | 1/1                |

**Links observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `cards`         | string               | 1/1                |
| `category`      | null                 | 1/1                |
| `shared_people` | string               | 1/1                |
| `shares`        | string               | 1/1                |
| `steps`         | string               | 1/1                |
| `self`          | string               | 1/1                |
| `html`          | string               | 1/1                |

**Meta fields observed**

| Field                         | Observed value shape | Seen in capture(s) |
| ----------------------------- | -------------------- | ------------------ |
| `total_recoverable_count`     | integer              | 1/1                |
| `total_unfiltered_count`      | integer              | 1/1                |
| `total_recently_viewed_count` | integer              | 1/1                |
| `total_has_my_cards_count`    | integer              | 1/1                |
| `has_workflows`               | boolean              | 1/1                |
| `total_unassigned_count`      | integer              | 1/1                |
| `can_include`                 | array                | 1/1                |
| `parent`                      | object               | 1/1                |
| `event_time`                  | string               | 1/1                |
| `idempotency_token`           | string               | 1/1                |

#### `people.v2.events.workflow.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Workflow`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `workflow_category` | null                 | 1/1                |
| `campus`            | null                 | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.workflow.updated`

- **Captured deliveries:** 1
- **Resource type:** `Workflow`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                | Observed value shape | Seen in capture(s) |
| ------------------------------------ | -------------------- | ------------------ |
| `archived_at`                        | null                 | 1/1                |
| `campus_id`                          | null                 | 1/1                |
| `completed_card_count`               | integer              | 1/1                |
| `created_at`                         | string               | 1/1                |
| `deleted_at`                         | null                 | 1/1                |
| `my_ready_card_count`                | integer              | 1/1                |
| `name`                               | string               | 1/1                |
| `recently_viewed`                    | boolean              | 1/1                |
| `total_cards_count`                  | integer              | 1/1                |
| `total_overdue_card_count`           | integer              | 1/1                |
| `total_ready_and_snoozed_card_count` | integer              | 1/1                |
| `total_ready_card_count`             | integer              | 1/1                |
| `total_steps_count`                  | integer              | 1/1                |
| `total_unassigned_card_count`        | integer              | 1/1                |
| `total_unassigned_steps_count`       | integer              | 1/1                |
| `updated_at`                         | string               | 1/1                |
| `workflow_category_id`               | null                 | 1/1                |

**Relationships observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `workflow_category` | null                 | 1/1                |
| `campus`            | null                 | 1/1                |

**Links observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `cards`         | string               | 1/1                |
| `category`      | null                 | 1/1                |
| `shared_people` | string               | 1/1                |
| `shares`        | string               | 1/1                |
| `steps`         | string               | 1/1                |
| `self`          | string               | 1/1                |
| `html`          | string               | 1/1                |

**Meta fields observed**

| Field                         | Observed value shape | Seen in capture(s) |
| ----------------------------- | -------------------- | ------------------ |
| `total_recoverable_count`     | integer              | 1/1                |
| `total_unfiltered_count`      | integer              | 1/1                |
| `total_recently_viewed_count` | integer              | 1/1                |
| `total_has_my_cards_count`    | integer              | 1/1                |
| `has_workflows`               | boolean              | 1/1                |
| `total_unassigned_count`      | integer              | 1/1                |
| `can_include`                 | array                | 1/1                |
| `parent`                      | object               | 1/1                |
| `event_time`                  | string               | 1/1                |
| `idempotency_token`           | string               | 1/1                |

#### `people.v2.events.workflow_card.created`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCard`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                           | Observed value shape | Seen in capture(s) |
| ------------------------------- | -------------------- | ------------------ |
| `calculated_due_at`             | null                 | 1/1                |
| `calculated_due_at_in_days_ago` | null                 | 1/1                |
| `completed_at`                  | null                 | 1/1                |
| `created_at`                    | string               | 1/1                |
| `flagged_for_notification_at`   | null                 | 1/1                |
| `moved_to_step_at`              | string               | 1/1                |
| `overdue`                       | boolean              | 1/1                |
| `pending_skip_evaluation`       | boolean              | 1/1                |
| `removed_at`                    | null                 | 1/1                |
| `snooze_until`                  | null                 | 1/1                |
| `stage`                         | string               | 1/1                |
| `sticky_assignment`             | boolean              | 1/1                |
| `updated_at`                    | string               | 1/1                |

**Relationships observed**

| Field          | Observed value shape                    | Seen in capture(s) |
| -------------- | --------------------------------------- | ------------------ |
| `assignee`     | `Assignee` reference (`id`: string)     | 1/1                |
| `person`       | `Person` reference (`id`: string)       | 1/1                |
| `workflow`     | `Workflow` reference (`id`: string)     | 1/1                |
| `current_step` | `WorkflowStep` reference (`id`: string) | 1/1                |

**Links observed**

| Field          | Observed value shape | Seen in capture(s) |
| -------------- | -------------------- | ------------------ |
| `activities`   | string               | 1/1                |
| `assignee`     | string               | 1/1                |
| `current_step` | string               | 1/1                |
| `go_back`      | string               | 1/1                |
| `notes`        | string               | 1/1                |
| `person`       | string               | 1/1                |
| `promote`      | string               | 1/1                |
| `remove`       | string               | 1/1                |
| `restore`      | string               | 1/1                |
| `send_email`   | string               | 1/1                |
| `skip_step`    | string               | 1/1                |
| `snooze`       | string               | 1/1                |
| `unsnooze`     | string               | 1/1                |
| `workflow`     | string               | 1/1                |
| `self`         | string               | 1/1                |
| `html`         | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow_card.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCard`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field          | Observed value shape                    | Seen in capture(s) |
| -------------- | --------------------------------------- | ------------------ |
| `assignee`     | `Assignee` reference (`id`: string)     | 1/1                |
| `person`       | `Person` reference (`id`: string)       | 1/1                |
| `workflow`     | `Workflow` reference (`id`: string)     | 1/1                |
| `current_step` | `WorkflowStep` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.workflow_card.step_ready`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCard`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                           | Observed value shape | Seen in capture(s) |
| ------------------------------- | -------------------- | ------------------ |
| `calculated_due_at`             | null                 | 1/1                |
| `calculated_due_at_in_days_ago` | null                 | 1/1                |
| `completed_at`                  | null                 | 1/1                |
| `created_at`                    | string               | 1/1                |
| `flagged_for_notification_at`   | null                 | 1/1                |
| `moved_to_step_at`              | string               | 1/1                |
| `overdue`                       | boolean              | 1/1                |
| `pending_skip_evaluation`       | boolean              | 1/1                |
| `removed_at`                    | null                 | 1/1                |
| `snooze_until`                  | null                 | 1/1                |
| `stage`                         | string               | 1/1                |
| `sticky_assignment`             | boolean              | 1/1                |
| `updated_at`                    | string               | 1/1                |

**Relationships observed**

| Field          | Observed value shape                    | Seen in capture(s) |
| -------------- | --------------------------------------- | ------------------ |
| `assignee`     | `Assignee` reference (`id`: string)     | 1/1                |
| `person`       | `Person` reference (`id`: string)       | 1/1                |
| `workflow`     | `Workflow` reference (`id`: string)     | 1/1                |
| `current_step` | `WorkflowStep` reference (`id`: string) | 1/1                |

**Links observed**

| Field          | Observed value shape | Seen in capture(s) |
| -------------- | -------------------- | ------------------ |
| `activities`   | string               | 1/1                |
| `assignee`     | string               | 1/1                |
| `current_step` | string               | 1/1                |
| `go_back`      | string               | 1/1                |
| `notes`        | string               | 1/1                |
| `person`       | string               | 1/1                |
| `promote`      | string               | 1/1                |
| `remove`       | string               | 1/1                |
| `restore`      | string               | 1/1                |
| `send_email`   | string               | 1/1                |
| `skip_step`    | string               | 1/1                |
| `snooze`       | string               | 1/1                |
| `unsnooze`     | string               | 1/1                |
| `workflow`     | string               | 1/1                |
| `self`         | string               | 1/1                |
| `html`         | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow_card.updated`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCard`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                           | Observed value shape | Seen in capture(s) |
| ------------------------------- | -------------------- | ------------------ |
| `calculated_due_at`             | null                 | 1/1                |
| `calculated_due_at_in_days_ago` | null                 | 1/1                |
| `completed_at`                  | string               | 1/1                |
| `created_at`                    | string               | 1/1                |
| `flagged_for_notification_at`   | null                 | 1/1                |
| `moved_to_step_at`              | string               | 1/1                |
| `overdue`                       | boolean              | 1/1                |
| `pending_skip_evaluation`       | boolean              | 1/1                |
| `removed_at`                    | null                 | 1/1                |
| `snooze_until`                  | null                 | 1/1                |
| `stage`                         | string               | 1/1                |
| `sticky_assignment`             | boolean              | 1/1                |
| `updated_at`                    | string               | 1/1                |

**Relationships observed**

| Field          | Observed value shape                | Seen in capture(s) |
| -------------- | ----------------------------------- | ------------------ |
| `assignee`     | `Assignee` reference (`id`: string) | 1/1                |
| `person`       | `Person` reference (`id`: string)   | 1/1                |
| `workflow`     | `Workflow` reference (`id`: string) | 1/1                |
| `current_step` | null                                | 1/1                |

**Links observed**

| Field          | Observed value shape | Seen in capture(s) |
| -------------- | -------------------- | ------------------ |
| `activities`   | string               | 1/1                |
| `assignee`     | string               | 1/1                |
| `current_step` | null                 | 1/1                |
| `go_back`      | string               | 1/1                |
| `notes`        | string               | 1/1                |
| `person`       | string               | 1/1                |
| `promote`      | string               | 1/1                |
| `remove`       | string               | 1/1                |
| `restore`      | string               | 1/1                |
| `send_email`   | string               | 1/1                |
| `skip_step`    | string               | 1/1                |
| `snooze`       | string               | 1/1                |
| `unsnooze`     | string               | 1/1                |
| `workflow`     | string               | 1/1                |
| `self`         | string               | 1/1                |
| `html`         | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |
| `previous`          | object               | 1/1                |

#### `people.v2.events.workflow_card_activity.created`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCardActivity`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                      | Observed value shape | Seen in capture(s) |
| -------------------------- | -------------------- | ------------------ |
| `attachments_meta`         | array                | 1/1                |
| `attachments_urls`         | array                | 1/1                |
| `automation_url`           | null                 | 1/1                |
| `comment`                  | string               | 1/1                |
| `content`                  | null                 | 1/1                |
| `content_is_html`          | boolean              | 1/1                |
| `created_at`               | string               | 1/1                |
| `form_submission_url`      | null                 | 1/1                |
| `person_avatar_url`        | string               | 1/1                |
| `person_name`              | string               | 1/1                |
| `reassigned_to_avatar_url` | string               | 1/1                |
| `reassigned_to_name`       | string               | 1/1                |
| `subject`                  | null                 | 1/1                |
| `type`                     | string               | 1/1                |

**Relationships observed**

| Field           | Observed value shape                    | Seen in capture(s) |
| --------------- | --------------------------------------- | ------------------ |
| `workflow_card` | `WorkflowCard` reference (`id`: string) | 1/1                |
| `workflow_step` | null                                    | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow_card_activity.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowCardActivity`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field           | Observed value shape                    | Seen in capture(s) |
| --------------- | --------------------------------------- | ------------------ |
| `workflow_card` | `WorkflowCard` reference (`id`: string) | 1/1                |
| `workflow_step` | null                                    | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.workflow_share.created`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowShare`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field        | Observed value shape | Seen in capture(s) |
| ------------ | -------------------- | ------------------ |
| `group`      | null                 | 1/1                |
| `permission` | string               | 1/1                |
| `person_id`  | integer              | 1/1                |

**Relationships observed**

| Field      | Observed value shape                | Seen in capture(s) |
| ---------- | ----------------------------------- | ------------------ |
| `person`   | `Person` reference (`id`: string)   | 1/1                |
| `workflow` | `Workflow` reference (`id`: string) | 1/1                |

**Links observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `person` | string               | 1/1                |
| `self`   | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow_step.created`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowStep`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                            | Observed value shape | Seen in capture(s) |
| -------------------------------- | -------------------- | ------------------ |
| `auto_snooze_days`               | null                 | 1/1                |
| `auto_snooze_interval`           | null                 | 1/1                |
| `auto_snooze_value`              | null                 | 1/1                |
| `created_at`                     | string               | 1/1                |
| `default_assignee_id`            | string               | 1/1                |
| `description`                    | null                 | 1/1                |
| `expected_response_time_in_days` | integer              | 1/1                |
| `my_ready_card_count`            | integer              | 1/1                |
| `name`                           | string               | 1/1                |
| `sequence`                       | integer              | 1/1                |
| `skip_conditions_enabled`        | boolean              | 1/1                |
| `total_ready_card_count`         | integer              | 1/1                |
| `total_snoozed_card_count`       | integer              | 1/1                |
| `updated_at`                     | string               | 1/1                |

**Relationships observed**

| Field              | Observed value shape                | Seen in capture(s) |
| ------------------ | ----------------------------------- | ------------------ |
| `default_assignee` | `Person` reference (`id`: string)   | 1/1                |
| `workflow`         | `Workflow` reference (`id`: string) | 1/1                |

**Links observed**

| Field                 | Observed value shape | Seen in capture(s) |
| --------------------- | -------------------- | ------------------ |
| `assignee_summaries`  | string               | 1/1                |
| `default_assignee`    | string               | 1/1                |
| `workflow_step_rules` | string               | 1/1                |
| `self`                | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `people.v2.events.workflow_step.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowStep`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field              | Observed value shape                | Seen in capture(s) |
| ------------------ | ----------------------------------- | ------------------ |
| `default_assignee` | `Person` reference (`id`: string)   | 1/1                |
| `workflow`         | `Workflow` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `people.v2.events.workflow_step.updated`

- **Captured deliveries:** 1
- **Resource type:** `WorkflowStep`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                            | Observed value shape | Seen in capture(s) |
| -------------------------------- | -------------------- | ------------------ |
| `auto_snooze_days`               | null                 | 1/1                |
| `auto_snooze_interval`           | null                 | 1/1                |
| `auto_snooze_value`              | null                 | 1/1                |
| `created_at`                     | string               | 1/1                |
| `default_assignee_id`            | string               | 1/1                |
| `description`                    | null                 | 1/1                |
| `expected_response_time_in_days` | integer              | 1/1                |
| `my_ready_card_count`            | integer              | 1/1                |
| `name`                           | string               | 1/1                |
| `sequence`                       | integer              | 1/1                |
| `skip_conditions_enabled`        | boolean              | 1/1                |
| `total_ready_card_count`         | integer              | 1/1                |
| `total_snoozed_card_count`       | integer              | 1/1                |
| `updated_at`                     | string               | 1/1                |

**Relationships observed**

| Field              | Observed value shape                | Seen in capture(s) |
| ------------------ | ----------------------------------- | ------------------ |
| `default_assignee` | `Person` reference (`id`: string)   | 1/1                |
| `workflow`         | `Workflow` reference (`id`: string) | 1/1                |

**Links observed**

| Field                 | Observed value shape | Seen in capture(s) |
| --------------------- | -------------------- | ------------------ |
| `assignee_summaries`  | string               | 1/1                |
| `default_assignee`    | string               | 1/1                |
| `workflow_step_rules` | string               | 1/1                |
| `self`                | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

### Publishing

#### `publishing.v2.events.episode.created`

- **Captured deliveries:** 1
- **Resource type:** `Episode`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                     | Observed value shape | Seen in capture(s) |
| ----------------------------------------- | -------------------- | ------------------ |
| `art`                                     | object               | 1/1                |
| `church_center_url`                       | string               | 1/1                |
| `created_at`                              | string               | 1/1                |
| `description`                             | null                 | 1/1                |
| `library_audio_url`                       | null                 | 1/1                |
| `library_streaming_service`               | null                 | 1/1                |
| `library_video_embed_code`                | null                 | 1/1                |
| `library_video_thumbnail_url`             | null                 | 1/1                |
| `library_video_url`                       | null                 | 1/1                |
| `needs_library_audio_or_video_url`        | boolean              | 1/1                |
| `needs_notes_template`                    | boolean              | 1/1                |
| `needs_video_url`                         | boolean              | 1/1                |
| `page_actions`                            | array                | 1/1                |
| `published_live_at`                       | string               | 1/1                |
| `published_to_library_at`                 | string               | 1/1                |
| `sermon_audio`                            | object               | 1/1                |
| `services_plan_remote_identifier`         | string               | 1/1                |
| `services_service_type_remote_identifier` | string               | 1/1                |
| `stream_type`                             | string               | 1/1                |
| `streaming_service`                       | null                 | 1/1                |
| `title`                                   | string               | 1/1                |
| `updated_at`                              | string               | 1/1                |
| `video_embed_code`                        | null                 | 1/1                |
| `video_thumbnail_url`                     | null                 | 1/1                |
| `video_url`                               | null                 | 1/1                |

**Relationships observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `series` | null                 | 1/1                |

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `channel`               | string               | 1/1                |
| `episode_resources`     | string               | 1/1                |
| `episode_times`         | string               | 1/1                |
| `generate_download_url` | string               | 1/1                |
| `note_template`         | null                 | 1/1                |
| `notes`                 | string               | 1/1                |
| `series`                | null                 | 1/1                |
| `speakerships`          | string               | 1/1                |
| `self`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `publishing.v2.events.episode_time.created`

- **Captured deliveries:** 1
- **Resource type:** `EpisodeTime`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `caveats`           | array                | 1/1                |
| `current_state`     | string               | 1/1                |
| `current_timestamp` | number               | 1/1                |
| `ends_at`           | string               | 1/1                |
| `starts_at`         | string               | 1/1                |
| `streaming_service` | null                 | 1/1                |
| `video_embed_code`  | string               | 1/1                |
| `video_url`         | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `publishing.v2.events.episode_time.updated`

- **Captured deliveries:** 1
- **Resource type:** `EpisodeTime`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `caveats`           | array                | 1/1                |
| `current_state`     | string               | 1/1                |
| `current_timestamp` | number               | 1/1                |
| `ends_at`           | string               | 1/1                |
| `starts_at`         | string               | 1/1                |
| `streaming_service` | string               | 1/1                |
| `video_embed_code`  | string               | 1/1                |
| `video_url`         | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `publishing.v2.events.episode.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Episode`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `series` | `Series` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `publishing.v2.events.episode.updated`

- **Captured deliveries:** 1
- **Resource type:** `Episode`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                                     | Observed value shape | Seen in capture(s) |
| ----------------------------------------- | -------------------- | ------------------ |
| `art`                                     | object               | 1/1                |
| `church_center_url`                       | string               | 1/1                |
| `created_at`                              | string               | 1/1                |
| `description`                             | null                 | 1/1                |
| `library_audio_url`                       | null                 | 1/1                |
| `library_streaming_service`               | null                 | 1/1                |
| `library_video_embed_code`                | null                 | 1/1                |
| `library_video_thumbnail_url`             | null                 | 1/1                |
| `library_video_url`                       | null                 | 1/1                |
| `needs_library_audio_or_video_url`        | boolean              | 1/1                |
| `needs_notes_template`                    | boolean              | 1/1                |
| `needs_video_url`                         | boolean              | 1/1                |
| `page_actions`                            | array                | 1/1                |
| `published_live_at`                       | string               | 1/1                |
| `published_to_library_at`                 | string               | 1/1                |
| `sermon_audio`                            | object               | 1/1                |
| `services_plan_remote_identifier`         | string               | 1/1                |
| `services_service_type_remote_identifier` | string               | 1/1                |
| `stream_type`                             | string               | 1/1                |
| `streaming_service`                       | null                 | 1/1                |
| `title`                                   | string               | 1/1                |

**Relationships observed**

| Field    | Observed value shape              | Seen in capture(s) |
| -------- | --------------------------------- | ------------------ |
| `series` | `Series` reference (`id`: string) | 1/1                |

**Links observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `episode_times` | string               | 1/1                |
| `series`        | string               | 1/1                |
| `self`          | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `publishing.v2.events.episode_time.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `EpisodeTime`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

### Services

#### `services.v2.events.arrangement.created`

- **Captured deliveries:** 1
- **Resource type:** `Arrangement`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                     | Observed value shape | Seen in capture(s) |
| ------------------------- | -------------------- | ------------------ |
| `archived_at`             | null                 | 1/1                |
| `bpm`                     | null                 | 1/1                |
| `chord_chart`             | null                 | 1/1                |
| `chord_chart_chord_color` | integer              | 1/1                |
| `chord_chart_columns`     | integer              | 1/1                |
| `chord_chart_font`        | string               | 1/1                |
| `chord_chart_font_size`   | integer              | 1/1                |
| `chord_chart_key`         | null                 | 1/1                |
| `created_at`              | string               | 1/1                |
| `has_chord_chart`         | boolean              | 1/1                |
| `has_chords`              | boolean              | 1/1                |
| `length`                  | integer              | 1/1                |
| `lyrics`                  | null                 | 1/1                |
| `lyrics_enabled`          | boolean              | 1/1                |
| `meter`                   | null                 | 1/1                |
| `name`                    | string               | 1/1                |
| `notes`                   | null                 | 1/1                |
| `number_chart_enabled`    | boolean              | 1/1                |
| `numeral_chart_enabled`   | boolean              | 1/1                |
| `print_margin`            | string               | 1/1                |
| `print_orientation`       | string               | 1/1                |
| `print_page_size`         | string               | 1/1                |
| `sequence`                | array                | 1/1                |
| `sequence_full`           | array                | 1/1                |
| `sequence_short`          | array                | 1/1                |
| `updated_at`              | string               | 1/1                |

**Relationships observed**

| Field        | Observed value shape              | Seen in capture(s) |
| ------------ | --------------------------------- | ------------------ |
| `updated_by` | `Person` reference (`id`: string) | 1/1                |
| `created_by` | `Person` reference (`id`: string) | 1/1                |
| `song`       | `Song` reference (`id`: string)   | 1/1                |

**Links observed**

| Field         | Observed value shape | Seen in capture(s) |
| ------------- | -------------------- | ------------------ |
| `archive`     | string               | 1/1                |
| `assign_tags` | string               | 1/1                |
| `attachments` | string               | 1/1                |
| `keys`        | string               | 1/1                |
| `sections`    | string               | 1/1                |
| `tags`        | string               | 1/1                |
| `unarchive`   | string               | 1/1                |
| `self`        | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.arrangement.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Arrangement`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field        | Observed value shape              | Seen in capture(s) |
| ------------ | --------------------------------- | ------------------ |
| `updated_by` | `Person` reference (`id`: string) | 1/1                |
| `created_by` | `Person` reference (`id`: string) | 1/1                |
| `song`       | `Song` reference (`id`: string)   | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `services.v2.events.key.created`

- **Captured deliveries:** 1
- **Resource type:** `Key`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field            | Observed value shape | Seen in capture(s) |
| ---------------- | -------------------- | ------------------ |
| `alternate_keys` | array                | 1/1                |
| `created_at`     | string               | 1/1                |
| `ending_key`     | null                 | 1/1                |
| `ending_minor`   | boolean              | 1/1                |
| `name`           | null                 | 1/1                |
| `starting_key`   | string               | 1/1                |
| `starting_minor` | boolean              | 1/1                |
| `updated_at`     | string               | 1/1                |

**Relationships observed**

| Field         | Observed value shape                   | Seen in capture(s) |
| ------------- | -------------------------------------- | ------------------ |
| `arrangement` | `Arrangement` reference (`id`: string) | 1/1                |

**Links observed**

| Field         | Observed value shape | Seen in capture(s) |
| ------------- | -------------------- | ------------------ |
| `attachments` | string               | 1/1                |
| `self`        | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.key.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Key`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field         | Observed value shape                   | Seen in capture(s) |
| ------------- | -------------------------------------- | ------------------ |
| `arrangement` | `Arrangement` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `services.v2.events.key.updated`

- **Captured deliveries:** 1
- **Resource type:** `Key`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field            | Observed value shape | Seen in capture(s) |
| ---------------- | -------------------- | ------------------ |
| `alternate_keys` | array                | 1/1                |
| `created_at`     | string               | 1/1                |
| `ending_key`     | null                 | 1/1                |
| `ending_minor`   | boolean              | 1/1                |
| `name`           | null                 | 1/1                |
| `starting_key`   | string               | 1/1                |
| `starting_minor` | boolean              | 1/1                |
| `updated_at`     | string               | 1/1                |

**Relationships observed**

| Field         | Observed value shape                   | Seen in capture(s) |
| ------------- | -------------------------------------- | ------------------ |
| `arrangement` | `Arrangement` reference (`id`: string) | 1/1                |

**Links observed**

| Field         | Observed value shape | Seen in capture(s) |
| ------------- | -------------------- | ------------------ |
| `attachments` | string               | 1/1                |
| `self`        | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.plan.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Plan`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field                       | Observed value shape                   | Seen in capture(s) |
| --------------------------- | -------------------------------------- | ------------------ |
| `service_type`              | `ServiceType` reference (`id`: string) | 1/1                |
| `previous_plan`             | `Plan` reference (`id`: string)        | 1/1                |
| `next_plan`                 | null                                   | 1/1                |
| `series`                    | null                                   | 1/1                |
| `created_by`                | `Person` reference (`id`: string)      | 1/1                |
| `updated_by`                | `Person` reference (`id`: string)      | 1/1                |
| `linked_publishing_episode` | null                                   | 1/1                |
| `attachment_types`          | array (empty in this capture)          | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `services.v2.events.plan.updated`

- **Captured deliveries:** 1
- **Resource type:** `Plan`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                    | Observed value shape | Seen in capture(s) |
| ------------------------ | -------------------- | ------------------ |
| `can_view_order`         | boolean              | 1/1                |
| `created_at`             | string               | 1/1                |
| `dates`                  | string               | 1/1                |
| `files_expire_at`        | string               | 1/1                |
| `items_count`            | integer              | 1/1                |
| `last_time_at`           | string               | 1/1                |
| `multi_day`              | boolean              | 1/1                |
| `needed_positions_count` | integer              | 1/1                |
| `other_time_count`       | integer              | 1/1                |
| `permissions`            | string               | 1/1                |
| `plan_notes_count`       | integer              | 1/1                |
| `plan_people_count`      | integer              | 1/1                |
| `planning_center_url`    | string               | 1/1                |
| `prefers_order_view`     | boolean              | 1/1                |
| `public`                 | boolean              | 1/1                |
| `public_by_schedule`     | boolean              | 1/1                |
| `rehearsable`            | boolean              | 1/1                |
| `rehearsal_time_count`   | integer              | 1/1                |
| `reminders_disabled`     | boolean              | 1/1                |
| `series_title`           | null                 | 1/1                |
| `service_time_count`     | integer              | 1/1                |
| `short_dates`            | string               | 1/1                |
| `sort_date`              | string               | 1/1                |
| `title`                  | null                 | 1/1                |
| `total_length`           | integer              | 1/1                |
| `updated_at`             | string               | 1/1                |

**Relationships observed**

| Field                       | Observed value shape                               | Seen in capture(s) |
| --------------------------- | -------------------------------------------------- | ------------------ |
| `service_type`              | `ServiceType` reference (`id`: string)             | 1/1                |
| `previous_plan`             | `Plan` reference (`id`: string)                    | 1/1                |
| `next_plan`                 | `Plan` reference (`id`: string)                    | 1/1                |
| `series`                    | null                                               | 1/1                |
| `created_by`                | `Person` reference (`id`: string)                  | 1/1                |
| `updated_by`                | `Person` reference (`id`: string)                  | 1/1                |
| `linked_publishing_episode` | `LinkedPublishingEpisode` reference (`id`: string) | 1/1                |
| `attachment_types`          | array (empty in this capture)                      | 1/1                |

**Links observed**

| Field              | Observed value shape | Seen in capture(s) |
| ------------------ | -------------------- | ------------------ |
| `all_attachments`  | string               | 1/1                |
| `attachments`      | string               | 1/1                |
| `attendances`      | string               | 1/1                |
| `autoschedule`     | string               | 1/1                |
| `contributors`     | string               | 1/1                |
| `import`           | string               | 1/1                |
| `item_reorder`     | string               | 1/1                |
| `items`            | string               | 1/1                |
| `live`             | string               | 1/1                |
| `my_schedules`     | string               | 1/1                |
| `needed_positions` | string               | 1/1                |
| `next_plan`        | string               | 1/1                |
| `notes`            | string               | 1/1                |
| `plan_times`       | string               | 1/1                |
| `previous_plan`    | string               | 1/1                |
| `series`           | null                 | 1/1                |
| `signup_teams`     | string               | 1/1                |
| `team_members`     | string               | 1/1                |
| `self`             | string               | 1/1                |
| `html`             | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.plan_item.created`

- **Captured deliveries:** 1
- **Resource type:** `Item`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                               | Observed value shape | Seen in capture(s) |
| ----------------------------------- | -------------------- | ------------------ |
| `created_at`                        | string               | 1/1                |
| `custom_arrangement_sequence`       | null                 | 1/1                |
| `custom_arrangement_sequence_full`  | null                 | 1/1                |
| `custom_arrangement_sequence_short` | null                 | 1/1                |
| `description`                       | string               | 1/1                |
| `html_details`                      | null                 | 1/1                |
| `item_type`                         | string               | 1/1                |
| `key_name`                          | null                 | 1/1                |
| `length`                            | integer              | 1/1                |
| `sequence`                          | integer              | 1/1                |
| `service_position`                  | string               | 1/1                |
| `title`                             | string               | 1/1                |
| `updated_at`                        | string               | 1/1                |

**Relationships observed**

| Field                 | Observed value shape            | Seen in capture(s) |
| --------------------- | ------------------------------- | ------------------ |
| `plan`                | `Plan` reference (`id`: string) | 1/1                |
| `song`                | null                            | 1/1                |
| `arrangement`         | null                            | 1/1                |
| `key`                 | null                            | 1/1                |
| `selected_layout`     | null                            | 1/1                |
| `selected_background` | null                            | 1/1                |

**Links observed**

| Field                 | Observed value shape | Seen in capture(s) |
| --------------------- | -------------------- | ------------------ |
| `arrangement`         | null                 | 1/1                |
| `attachments`         | string               | 1/1                |
| `custom_slides`       | string               | 1/1                |
| `item_assignments`    | string               | 1/1                |
| `item_notes`          | string               | 1/1                |
| `item_times`          | string               | 1/1                |
| `key`                 | null                 | 1/1                |
| `media`               | string               | 1/1                |
| `selected_attachment` | string               | 1/1                |
| `selected_background` | string               | 1/1                |
| `song`                | null                 | 1/1                |
| `self`                | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |
| `public`            | object               | 1/1                |

#### `services.v2.events.plan_item.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Item`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field                 | Observed value shape                   | Seen in capture(s) |
| --------------------- | -------------------------------------- | ------------------ |
| `plan`                | `Plan` reference (`id`: string)        | 1/1                |
| `song`                | `Song` reference (`id`: string)        | 1/1                |
| `arrangement`         | `Arrangement` reference (`id`: string) | 1/1                |
| `key`                 | `Key` reference (`id`: string)         | 1/1                |
| `selected_layout`     | null                                   | 1/1                |
| `selected_background` | null                                   | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `services.v2.events.plan_item.updated`

- **Captured deliveries:** 1
- **Resource type:** `Item`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                               | Observed value shape | Seen in capture(s) |
| ----------------------------------- | -------------------- | ------------------ |
| `created_at`                        | string               | 1/1                |
| `custom_arrangement_sequence`       | null                 | 1/1                |
| `custom_arrangement_sequence_full`  | null                 | 1/1                |
| `custom_arrangement_sequence_short` | null                 | 1/1                |
| `description`                       | null                 | 1/1                |
| `html_details`                      | null                 | 1/1                |
| `item_type`                         | string               | 1/1                |
| `key_name`                          | string               | 1/1                |
| `length`                            | integer              | 1/1                |
| `sequence`                          | integer              | 1/1                |
| `service_position`                  | string               | 1/1                |
| `title`                             | string               | 1/1                |
| `updated_at`                        | string               | 1/1                |

**Relationships observed**

| Field                 | Observed value shape                   | Seen in capture(s) |
| --------------------- | -------------------------------------- | ------------------ |
| `plan`                | `Plan` reference (`id`: string)        | 1/1                |
| `song`                | `Song` reference (`id`: string)        | 1/1                |
| `arrangement`         | `Arrangement` reference (`id`: string) | 1/1                |
| `key`                 | `Key` reference (`id`: string)         | 1/1                |
| `selected_layout`     | null                                   | 1/1                |
| `selected_background` | null                                   | 1/1                |

**Links observed**

| Field                 | Observed value shape | Seen in capture(s) |
| --------------------- | -------------------- | ------------------ |
| `arrangement`         | string               | 1/1                |
| `attachments`         | string               | 1/1                |
| `custom_slides`       | string               | 1/1                |
| `item_assignments`    | string               | 1/1                |
| `item_notes`          | string               | 1/1                |
| `item_times`          | string               | 1/1                |
| `key`                 | string               | 1/1                |
| `media`               | string               | 1/1                |
| `selected_attachment` | string               | 1/1                |
| `selected_background` | string               | 1/1                |
| `song`                | string               | 1/1                |
| `self`                | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |
| `public`            | object               | 1/1                |

#### `services.v2.events.plan_note.created`

- **Captured deliveries:** 1
- **Resource type:** `PlanNote`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field           | Observed value shape | Seen in capture(s) |
| --------------- | -------------------- | ------------------ |
| `category_name` | string               | 1/1                |
| `content`       | string               | 1/1                |
| `created_at`    | string               | 1/1                |
| `updated_at`    | string               | 1/1                |

**Relationships observed**

| Field                | Observed value shape                        | Seen in capture(s) |
| -------------------- | ------------------------------------------- | ------------------ |
| `created_by`         | `Person` reference (`id`: string)           | 1/1                |
| `plan_note_category` | `PlanNoteCategory` reference (`id`: string) | 1/1                |
| `teams`              | null                                        | 1/1                |

**Links observed**

| Field                | Observed value shape | Seen in capture(s) |
| -------------------- | -------------------- | ------------------ |
| `plan_note_category` | string               | 1/1                |
| `self`               | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `can_include`       | array                | 1/1                |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.plan_note.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `PlanNote`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

| Field                | Observed value shape                        | Seen in capture(s) |
| -------------------- | ------------------------------------------- | ------------------ |
| `created_by`         | `Person` reference (`id`: string)           | 1/1                |
| `plan_note_category` | `PlanNoteCategory` reference (`id`: string) | 1/1                |
| `teams`              | null                                        | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

#### `services.v2.events.song.created`

- **Captured deliveries:** 1
- **Resource type:** `Song`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                        | Observed value shape | Seen in capture(s) |
| ---------------------------- | -------------------- | ------------------ |
| `admin`                      | null                 | 1/1                |
| `author`                     | null                 | 1/1                |
| `ccli_number`                | null                 | 1/1                |
| `copyright`                  | null                 | 1/1                |
| `created_at`                 | string               | 1/1                |
| `hidden`                     | boolean              | 1/1                |
| `last_scheduled_at`          | null                 | 1/1                |
| `last_scheduled_short_dates` | null                 | 1/1                |
| `notes`                      | null                 | 1/1                |
| `themes`                     | null                 | 1/1                |
| `title`                      | string               | 1/1                |
| `updated_at`                 | string               | 1/1                |

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field                   | Observed value shape | Seen in capture(s) |
| ----------------------- | -------------------- | ------------------ |
| `arrangements`          | string               | 1/1                |
| `assign_tags`           | string               | 1/1                |
| `attachments`           | string               | 1/1                |
| `last_scheduled_item`   | null                 | 1/1                |
| `song_schedules`        | string               | 1/1                |
| `tags`                  | string               | 1/1                |
| `unscoped_arrangements` | string               | 1/1                |
| `self`                  | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `services.v2.events.song.destroyed`

- **Captured deliveries:** 1
- **Resource type:** `Song`
- **Inner payload keys observed:** `data` (object; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `links` (object; 1/1)

**Attributes observed**

_Not present in the captured payload._

**Relationships observed**

_Not present in the captured payload._

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |

**Meta fields observed**

| Field    | Observed value shape | Seen in capture(s) |
| -------- | -------------------- | ------------------ |
| `parent` | object               | 1/1                |

### Calendar

#### `calendar.v2.events.event_request.created`

- **Captured deliveries:** 1
- **Resource type:** `EventRequest`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `last_activity_at`          | string               | 1/1                |
| `selected_options_by_field` | object               | 1/1                |
| `status`                    | string               | 1/1                |

**Relationships observed**

| Field         | Observed value shape                          | Seen in capture(s) |
| ------------- | --------------------------------------------- | ------------------ |
| `event`       | `Event` reference (`id`: string)              | 1/1                |
| `form`        | `Form` reference (`id`: string)               | 1/1                |
| `person`      | `Person` reference (`id`: string)             | 1/1                |
| `form_fields` | array of `FormField` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |
| `html` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `calendar.v2.events.event_request.updated`

- **Captured deliveries:** 1
- **Resource type:** `EventRequest`
- **Inner payload keys observed:** `data` (object; 1/1), `included` (array; 1/1), `meta` (object; 1/1)
- **Inner `data` keys observed:** `type` (string; 1/1), `id` (string; 1/1), `attributes` (object; 1/1), `relationships` (object; 1/1), `links` (object; 1/1)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `last_activity_at`          | string               | 1/1                |
| `selected_options_by_field` | object               | 1/1                |
| `status`                    | string               | 1/1                |

**Relationships observed**

| Field         | Observed value shape                          | Seen in capture(s) |
| ------------- | --------------------------------------------- | ------------------ |
| `event`       | `Event` reference (`id`: string)              | 1/1                |
| `form`        | `Form` reference (`id`: string)               | 1/1                |
| `person`      | `Person` reference (`id`: string)             | 1/1                |
| `form_fields` | array of `FormField` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |
| `html` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

#### `calendar.v2.events.event_request.approved`

- **Captured deliveries:** 2
- **Resource type:** `EventRequest`
- **Inner payload keys observed:** `data` (object; 2/2), `included` (array; 2/2), `meta` (object; 2/2)
- **Inner `data` keys observed:** `type` (string; 2/2), `id` (string; 2/2), `attributes` (object; 2/2), `relationships` (object; 2/2), `links` (object; 2/2)

**Attributes observed**

| Field                       | Observed value shape | Seen in capture(s) |
| --------------------------- | -------------------- | ------------------ |
| `last_activity_at`          | string               | 2/2                |
| `selected_options_by_field` | object               | 2/2                |
| `status`                    | string               | 2/2                |

**Relationships observed**

| Field         | Observed value shape                          | Seen in capture(s) |
| ------------- | --------------------------------------------- | ------------------ |
| `event`       | `Event` reference (`id`: string)              | 1/1                |
| `form`        | `Form` reference (`id`: string)               | 1/1                |
| `person`      | `Person` reference (`id`: string)             | 1/1                |
| `form_fields` | array of `FormField` reference (`id`: string) | 1/1                |

**Links observed**

| Field  | Observed value shape | Seen in capture(s) |
| ------ | -------------------- | ------------------ |
| `self` | string               | 1/1                |
| `html` | string               | 1/1                |

**Meta fields observed**

| Field               | Observed value shape | Seen in capture(s) |
| ------------------- | -------------------- | ------------------ |
| `parent`            | object               | 1/1                |
| `event_time`        | string               | 1/1                |
| `idempotency_token` | string               | 1/1                |

## Implementation-safe expectations

Use the following as a safe baseline for code that consumes the observed captures. It deliberately treats variable subtrees as optional:

```ts
type PcoRelationship = {
  data:
    | null
    | { type: string; id: string }
    | Array<{ type: string; id: string }>;
};

type PcoPayload = {
  data: {
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
    relationships?: Record<string, PcoRelationship>;
    links: Record<string, string | null>;
  };
  included?: unknown[];
  meta: {
    parent: { id: string; type: string };
    event_time?: string;
    idempotency_token?: string;
    previous?: unknown;
    [key: string]: unknown;
  };
};

type PcoEventDelivery = {
  id: string;
  type: 'EventDelivery';
  attributes: {
    name: string;
    attempt: number;
    payload: string;
  };
  relationships: {
    organization: {
      data: { type: 'Organization'; id: string };
    };
  };
};
```

This is an implementation-safe representation of the capture set, not a promise that Planning Center will never add fields or change which resource-specific fields are included.

## Deliberate exclusions

This document contains exactly the 67 event names observed in the raw incoming capture set. Events not represented by a captured delivery are excluded rather than inferred from an event with a similar name or resource type.
