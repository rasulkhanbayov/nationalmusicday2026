# Helper: forwards Stripe webhook events to your local dev server.
# Run this in its OWN terminal window while `npm run dev` runs in another.
#
#   1) First time only:  .\stripe-listen.ps1 -Login
#   2) Every time:       .\stripe-listen.ps1
#
# Copy the "whsec_..." it prints into STRIPE_WEBHOOK_SECRET in your .env,
# then restart `npm run dev`.

param([switch]$Login)

$stripe = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" `
  -Recurse -Filter "stripe.exe" -ErrorAction SilentlyContinue |
  Select-Object -First 1).FullName

if (-not $stripe) {
  Write-Host "stripe.exe not found. Install with: winget install Stripe.StripeCLI" -ForegroundColor Red
  exit 1
}

if ($Login) {
  & $stripe login
}

Write-Host "Forwarding Stripe events to http://localhost:3000/api/webhooks/stripe" -ForegroundColor Cyan
Write-Host "Copy the whsec_... below into .env (STRIPE_WEBHOOK_SECRET), then restart npm run dev." -ForegroundColor Yellow
& $stripe listen --forward-to localhost:3000/api/webhooks/stripe
