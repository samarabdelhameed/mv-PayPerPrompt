# 🎬 PayPerPrompt - Extended Hackathon Demo Script (4 Minutes)
**Target Duration:** 4:00 Minutes
**Goal:** A comprehensive "Deep Dive" demonstration for judges, showcasing technical depth, user experience, and full blockchain integration.

---

## ⏱️ 0:00 - 0:45 | Introduction & Problem Statement
**(Camera: Face cam or Landing Page)**

**Script:**
"Hi everyone, this is the demo for **PayPerPrompt**, our submission for the Movement Hackathon.
We are building the future of decentralized AI agent monetization.

**The Problem:** Currently, accessing premium AI agents is fragmented. Developers have to integrate Stripe or crypto payments manually, and users hate connecting wallets for every micro-interaction.
**The Solution:** PayPerPrompt is a unified infrastructure on the **Movement Blockchain**. We use the **x402 Payment Standard** to enable seamless, trustless, and instant micropayments for AI services.

**Key Features we'll show today:**
1.  Seamless onboarding with **Privy**.
2.  Real-time payment splitting on-chain (85% to Agent, 15% to Platform).
3.  A full end-to-end AI interaction powered by Move Smart Contracts."

---

## ⏱️ 0:45 - 1:30 | Onboarding & Agent Discovery (Privy)
**(Camera: Screen Recording - Incognito Window)**

**Action:**
1.  Open `https://mv-payperprompt.vercel.app/`.
2.  Click **"Connect Wallet"**.
3.  **Showcase Privy:** "Notice how smooth this is. I can log in with Google, Twitter, or just an email."
4.  Perform the Login.
5.  **Highlight:** "Boom. I'm in. Privy just created a secure embedded wallet for me on the Movement network. No Metamask extension required, though we support that too."
6.  Navigate to the **Agent Marketplace**.
7.  Scroll through the list. "These agents aren't just database entries; their reputation and stats are fetched directly from our `AgentRegistry` smart contract on-chain."

---

## ⏱️ 1:30 - 2:30 | The Core Transaction (Live Demo)
**(Camera: Screen Recording - Dashboard)**

**Action:**
1.  Select the **"PayPerPrompt AI Agent"**.
2.  Type a challenging prompt: *"Write a Haiku about the Movement Blockchain."*
3.  Click **"Pay & Generate (1 MOVE)"**.

**Script:**
"Now, let's make a request. When I click verify, three things happen:
1.  The Relay Server requests an invoice from the Smart Contract.
2.  The Contract creates a pending invoice using the x402 standard.
3.  My wallet is prompted to sign."

**Action:**
4.  **Show the Notifications:** Point out "Invoice Created: INV-..." toast.
5.  **Show Signing:** "I'm signing this transaction with my Privy embedded wallet. It's fast and gas-efficient on Movement."
6.  **Wait for Spinner:** "Processing on-chain... verifying payment..."
7.  **Result:** Show the AI response appearing on screen. "And there it is! The payment unlocked the service instantly."

---

## ⏱️ 2:30 - 3:30 | The Technical Deep Dive (Blockchain Verification)
**(Camera: Screen Recording - Movement Explorer)**

**Action:**
1.  Click the **"View Transaction"** link (or copy hash manually).
2.  Open **Movement Testnet Explorer**.
3.  **Drill down into events:**
    *   Find the `PaymentSplitter` event.
    *   **Highlight:** "Look at this internal transaction. The user paid 1 MOVE. The contract *automagically* sent 0.85 MOVE to the Agent's wallet and 0.15 MOVE to the Protocol Treasury."
    *   **Script:** "This `PaymentSplitter` logic is immutable. Agents are guaranteed their payout instantly. No monthly settlements, no Stripe fees."
4.  Show the `InvoiceStatusEvent`: "We also see the Invoice status changed from `PENDING` to `PAID`. This is fully indexable for analytics."

---

## ⏱️ 3:30 - 4:00 | Architecture & Conclusion
**(Camera: Split VS Code / GitHub Repo)**

**Action:**
1.  Briefly flash the **Move Smart Contract** (`PaymentSplitter.move` or `X402InvoiceHandler.move`) in VS Code.
2.  Show the **GitHub Repo** structure.

**Script:**
"Under the hood, this is powered by Move 2.0 contracts, a Node.js Relay for safety, and a React frontend.
We've deployed everything: Contracts, Relay, and Frontend are live right now.
PayPerPrompt proves that Web3 UX can arguably be *better* than Web2.
Thanks for watching, and we hope you try it out on the Movement Testnet!"

---

## 📝 Pre-Demo Checklist
1.  **Fund Wallet:** Ensure your Privy test account has at least 5 MOVE coins.
2.  **Clear History:** Clear cookies/local storage to show the "New User" login flow cleanly.
3.  **Tabs Ready:** Have these tabs open:
    *   App: `https://mv-payperprompt.vercel.app/`
    *   Explorer: `https://explorer.movementlabs.xyz/?network=testnet`
    *   GitHub: `https://github.com/samarabdelhameed/mv-PayPerPrompt`
4.  **Zoom In:** Ensure browser zoom is at 110% or 125% for visibility on mobile screens.
