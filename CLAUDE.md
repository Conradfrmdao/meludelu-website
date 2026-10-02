@AGENTS.md

Read docs/PRD.md before making product decisions. Payments are MTN / Airtel merchant USSD with manual confirmation
in the admin (see docs/PRD.md section 9); there is no payment gateway yet.

UI rules from the owner:
- Never use browser dialogs (alert, confirm, prompt). Use the in-app `useConfirm()` dialog in
  src/components/ui/confirm-dialog.tsx, or an inline message.
- Icon links that open a page (Search, Track an order, Wishlist) act as toggles: tapping again goes back.
- Primary buttons on phones are at least 48px tall.
