export interface Example {
  label: string
  text: string
}

export const EXAMPLES: Example[] = [
  {
    label: "Deploy flow",
    text: `How our deploy actually works
ok so someone asked in standup... basically:
1. push to main triggers CI
2. CI runs tests and builds the image
3. image gets pushed to the registry
4. argo notices the new tag
5. argo syncs the cluster
6. smoke tests run against prod
honestly it's simpler than people think`,
  },
  {
    label: "Checkout sequence",
    text: `checkout flow (messy notes from the whiteboard)
Browser -> API: POST /checkout
API -> Payments: create intent
Payments -> API: client secret
API -> Browser: render payment form
Browser -> Payments: confirm card
Payments -> API: webhook payment_succeeded
API -> Browser: order confirmed`,
  },
  {
    label: "Repo structure",
    text: `where things live in the monorepo
src/
  commands/   parses user actions
    show-me.ts   expands the slash command
  sessions/   owns session state
    store.ts
    events.ts
  transport/   sends API requests
    client.ts
    stream.ts`,
  },
  {
    label: "Messy thread",
    text: `RT @dev_anna: hot take on why our onboarding is broken
@dev_anna 2:14 PM
the signup form asks for 11 fields before showing any value
@mike_replies
also the confirmation email lands in spam for half of gmail users
@dev_anna
and nobody sees the empty dashboard problem — new users churn in 90 seconds
https://x.com/some/link
we should show a live demo workspace before asking for anything
342 likes 51 reposts`,
  },
]
