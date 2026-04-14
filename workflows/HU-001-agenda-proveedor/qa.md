# QA plan — HU-001

## Scope

Availability CRUD (provider), read path (couple), booking conflict prevention.

## Cases

| ID | Case | Steps | Expected |
|----|------|-------|----------|
| Q1 | Happy path slot | Select open slot → booking → confirmed | Booking created; slot removed from available |
| Q2 | Double booking | Two parallel requests same slot | One succeeds; one 409/valid error |
| Q3 | Provider closes day | Edit availability after user loaded calendar | New selection rejected server-side |
| Q4 | Authz | Couple A cannot edit provider B availability | 403 |
| Q5 | Mobile | Small viewport calendar | Usable; no clipped CTAs |

## Non-functional

- Response time acceptable on `GET availability` for default range (define SLA with Tech).

## Sign-off

- [ ] All blockers fixed  
- [ ] Regression on marketplace browse  
