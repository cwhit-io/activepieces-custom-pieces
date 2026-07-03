67 distinct event payloads documented in `PCO_WEBHOOKS_REF.md`.

Each trigger maps to one PCO event name and follows the generic engine below.

## People

| Activepieces trigger name    | Event                                       |
| ---------------------------- | ------------------------------------------- |
| **Person Created**           | `people.v2.events.person.created`           |
| **Person Updated**           | `people.v2.events.person.updated`           |
| **Form Submitted**           | `people.v2.events.form_submission.created`  |
| **Person Added to List**     | `people.v2.events.list_result.created`      |
| **Person Removed from List** | `people.v2.events.list_result.destroyed`    |
| **Workflow Card Ready**      | `people.v2.events.workflow_card.step_ready` |
| **Workflow Card Created**    | `people.v2.events.workflow_card.created`    |
| **Workflow Card Updated**    | `people.v2.events.workflow_card.updated`    |

## Services

| Activepieces trigger name | Event                             |
| ------------------------- | --------------------------------- |
| **Plan Updated**          | `services.v2.events.plan.updated` |

## Publishing

| Activepieces trigger name | Event                                  |
| ------------------------- | -------------------------------------- |
| **Episode Created**       | `publishing.v2.events.episode.created` |
| **Episode Updated**       | `publishing.v2.events.episode.updated` |

## Groups

| Activepieces trigger name       | Event                                                      |
| ------------------------------- | ---------------------------------------------------------- |
| **Group Application Submitted** | `groups.church_center.v2.events.group_application.created` |
| **Group Application Updated**   | `groups.church_center.v2.events.group_application.updated` |
| **Person Joined Group**         | `groups.v2.events.membership.created`                      |
| **Person Left Group**           | `groups.v2.events.membership.destroyed`                    |
| **Group Created**               | `groups.v2.events.group.created`                           |

## Calendar

| Activepieces trigger name   | Event                                       |
| --------------------------- | ------------------------------------------- |
| **Event Request Submitted** | `calendar.v2.events.event_request.created`  |
| **Event Request Approved**  | `calendar.v2.events.event_request.approved` |
| **Event Request Updated**   | `calendar.v2.events.event_request.updated`  |

## Implementation

All triggers use the same generic webhook-subscription engine. Only the event name, display name, sample data, and output field mappings differ per trigger.

```text
Select event name
→ create PCO subscription on enable
→ save subscription ID + authenticity secret
→ validate raw incoming request
→ parse attributes.payload
→ return normalized webhook output
→ delete subscription on disable
```
