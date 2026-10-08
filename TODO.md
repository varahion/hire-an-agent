# TODO

Write items as notes to the agent.

# In progress

- Launch checklist below

# To do

- Deploy on Vercel: create the project from varahion/hire-an-agent, set every variable in .env.example (EVE_ENABLED=true, EVE_AGENT_ORIGIN = the production URL, fresh secrets), add Upstash Redis from the Vercel Marketplace
- Decide the domain (e.g. hire.varahion.com) and set NEXT_PUBLIC_SITE_URL
- Set NEXT_PUBLIC_VARAHION_ASSESSMENT_URL to the live Varahion assessment page
- Benchmark the model with the llm-bench skill (current: openai/gpt-6-luna)
- Confirm how long eve keeps session transcripts on Vercel before promising deletion
- Add the tool to the Tools page on the Varahion site (separate PR there)
- Launch post (X, Product Hunt) using the playbook's structure

# Done

- Brief, design spec, plan
- v1: describe → live work → interview → shareable CV card (PRs #1–#7)
