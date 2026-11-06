Website: live countdown in the News & Updates banner
====================================================

Unzip into:  C:\Projects\WebDocs\RccgHopeHouse\RccgHopeHouse.Web

New files:
  (none)

Edited files:
  src/components/sections/NewsBanner.tsx   - countdown chip in banner and "Read more"; 00:00 times = all-day (dates only)
  src/styles/news-banner.css               - countdown chip styles (added before "Event meta")
  src/admin/pages/AdminNews.tsx            - hint text under "Event details" only

No API changes. No migration.

Deploy:
  cd C:\Projects\WebDocs\RccgHopeHouse\RccgHopeHouse.Web
  npm run lint
  npm run build
  git status
  git add src/components/sections/NewsBanner.tsx src/styles/news-banner.css src/admin/pages/AdminNews.tsx
  git commit -m "Website: Add live countdown to News & Updates banner"
  git push origin main
