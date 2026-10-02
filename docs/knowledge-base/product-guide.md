# BridgeDesk — Product Guide

> Fictional product used for the AI Bridge learning project. All names, prices and features below are made up.

## What is BridgeDesk

BridgeDesk is Bridgeway Labs' customer support platform. It lets small and medium-sized businesses receive customer questions by email and WhatsApp, assign them to support agents, and track response times in one dashboard.

Every customer question in BridgeDesk becomes a **ticket**. A ticket has a status (New, Open, Waiting on customer, Solved or Closed), a priority (Low, Normal, High or Urgent), an assigned agent, and a full history of every message and internal note. Customers never need a BridgeDesk account; they simply reply to emails or WhatsApp messages as usual.

BridgeDesk runs in the web browser on desktop computers. A mobile app for iOS and Android lets agents read and reply to tickets on the go, but administration settings are only available in the web version.

## Key Concepts

**Workspace.** A workspace represents one company using BridgeDesk. Each workspace has its own agents, channels, tickets and billing. One person can belong to several workspaces, for example a consultant who supports several clients.

**Agents.** Agents are the people who answer tickets. Every agent is a paid seat on the subscription.

**Roles.** Each agent has one role: Owner, Admin, Agent or Viewer. The Owner manages billing and can delete the workspace; each workspace has exactly one Owner. Admins manage settings, channels and team members. Agents answer tickets. Viewers can read tickets and reports but cannot reply; Viewer seats are free.

**Channels.** A channel is a way customers reach you, such as an email address or a WhatsApp Business number. Tickets from all channels appear in the same inbox.

**Macros.** Macros are saved replies that agents can insert with one click, for example a standard answer about delivery times. Macros can also change the ticket status or priority automatically.

## Plans and Pricing

BridgeDesk has three plans, billed monthly per agent:

- **Starter** — USD 9 per agent, up to 3 agents, email channel only, 1 inbox, basic reports.
- **Team** — USD 19 per agent, up to 25 agents, email and WhatsApp channels, up to 10 inboxes, macros, business hours and SLA reports.
- **Business** — USD 39 per agent, unlimited agents, all channels plus single sign-on (SSO), audit logs, custom roles and an uptime commitment of 99.9%.

Annual billing gives a 15% discount on every plan. Every new account starts with a 14-day free trial of the Team plan; no credit card is required. At the end of the trial, the workspace becomes read-only until a plan is chosen. No data is deleted when a trial ends; it is kept for 60 days.

Customers can upgrade at any time; the price difference is charged immediately for the remaining days of the billing period. Downgrades take effect at the start of the next billing period. If a downgrade would exceed the limits of the smaller plan, for example more agents than allowed, the downgrade is blocked until extra agents are removed.

Non-profit organizations and schools registered in Pakistan receive 50% off the Team plan after verification by the Sales team at sales@bridgedesk.example.

## Getting Started

Setting up a new workspace takes about 15 minutes:

1. Sign up at the BridgeDesk website with your work email address and confirm it using the link in the welcome email.
2. Choose a workspace name. The name becomes part of your support address, for example `acme@help.bridgedesk.example`.
3. Connect your first channel. For email, either use the provided BridgeDesk address or forward your existing support address to it.
4. Invite your team members (see "Adding Team Members").
5. Set your business hours and time zone under Settings, then General.
6. Create two or three macros for the questions you receive most often.

New workspaces include a sample ticket that explains the main features. You can delete it at any time.

## Connecting WhatsApp

WhatsApp is available on the Team and Business plans. To connect it, you need a WhatsApp Business account with a phone number that is not already used in the normal WhatsApp app.

Go to Settings, then Channels, then "Add WhatsApp", and follow the steps to log in with your Meta Business account. Verification normally takes between 10 minutes and 2 business days, depending on Meta.

WhatsApp rules require that businesses reply within 24 hours of the customer's last message. After 24 hours, agents can only send pre-approved message templates. BridgeDesk shows a countdown on each WhatsApp ticket so agents know how much time is left. Messages sent through WhatsApp templates are charged by Meta, not by BridgeDesk, and appear on your Meta invoice.

## Resetting Your Password

To reset your BridgeDesk password, open the login page and click "Forgot password?". Enter the email address of your account and BridgeDesk sends a 6-digit reset code. The code expires after 15 minutes. If the email does not arrive within 5 minutes, check your spam folder and make sure you entered the correct address.

After 5 wrong attempts the account is locked for 30 minutes. This protects your account from people trying to guess the code. Support cannot unlock the account earlier, so please wait for the 30 minutes to pass.

New passwords must be at least 12 characters long and must not be one of your last 5 passwords. We recommend using a password manager.

Accounts that use single sign-on (Business plan) cannot reset their password in BridgeDesk and must contact their own IT administrator instead, because the password is managed by the customer's identity provider, such as Microsoft Entra ID or Google Workspace.

## Two-Factor Authentication

All BridgeDesk users can enable two-factor authentication (2FA) under Profile, then Security. BridgeDesk supports authenticator apps such as Microsoft Authenticator and Google Authenticator. SMS codes are not supported because they are less secure.

Owners and Admins on the Team and Business plans can require 2FA for every agent in the workspace. When required, agents without 2FA must set it up the next time they log in. When you enable 2FA, BridgeDesk shows 10 backup codes; store them safely, because each code works once if you lose your phone.

## Adding Team Members

Only users with the Owner or Admin role can invite new agents. Go to Settings, then Team, then "Invite agent", and enter their email address and role. Invitations expire after 7 days; expired invitations can be sent again from the same page.

Each accepted invitation adds one paid agent to the next invoice, except Viewers, which are free. When an agent is removed, their seat is freed immediately, but the price is not refunded for the current billing period. Tickets assigned to a removed agent are moved back to the unassigned queue.

On the Business plan, agents can also be added automatically through single sign-on: anyone from the customer's company who logs in with SSO gets the Agent role, if the Owner has enabled automatic provisioning.

## Ticket Assignment and Routing

By default, new tickets go to the unassigned queue and any agent can pick them up. Admins can enable **round-robin assignment**, which gives new tickets to available agents in turn. An agent is "available" when their status is set to Online.

Routing rules can send tickets to a specific team based on the channel, keywords in the subject, or the customer's email domain. For example, all tickets containing the word "invoice" can be sent to the Billing team. Rules are checked from top to bottom and the first matching rule wins.

Tickets marked as Urgent send a push notification to every online agent in the assigned team.

## Reports and SLAs

The Reports page shows the number of new tickets, first response time, resolution time and customer satisfaction (CSAT) score. Reports can be filtered by date, channel, team and agent, and exported as CSV.

On the Team and Business plans, Admins can define **service level agreements (SLAs)**, such as "first response within 4 business hours for High priority tickets". Tickets close to breaking an SLA are highlighted in orange, and breached tickets in red.

After a ticket is solved, customers receive a short survey asking them to rate the support from 1 to 5. The CSAT score is the percentage of ratings that are 4 or 5.

## Support and Response Times

BridgeDesk support is available Monday to Saturday, 09:00 to 21:00 Pakistan Standard Time. Starter customers receive a first response within 24 hours, Team customers within 8 hours, and Business customers within 2 hours. Customers can contact support at support@bridgedesk.example or from the "Help" button inside the app.

For outages affecting many customers, Business customers can also call the emergency support line, which is available 24 hours a day. The current status of BridgeDesk and any ongoing incidents are always shown on the status page at status.bridgedesk.example.

## Integrations and API

BridgeDesk integrates with Shopify, so agents can see a customer's recent orders next to the ticket. It also integrates with Slack, sending a message to a chosen Slack channel for every Urgent ticket.

Developers can use the BridgeDesk REST API to create tickets, read tickets and update their status. API access is available on the Team and Business plans. API keys are created by Admins under Settings, then API, and can be limited to read-only access. The API allows up to 100 requests per minute per workspace; requests above this limit receive HTTP 429 and should be retried after the time given in the `Retry-After` header.

## Data Export and Account Deletion

Owners can export all tickets as a CSV file from Settings, then Data, then "Export". Exports of more than 10,000 tickets are prepared in the background and a download link is sent by email; the link is valid for 48 hours.

Owners can delete a workspace from Settings, then Data, then "Delete workspace". Deleted accounts are kept for 30 days and can be restored during that period; after 30 days all data is permanently erased, including tickets, attachments and reports.

## Security and Privacy

BridgeDesk is hosted on Microsoft Azure in the West Europe region. All data is encrypted in transit with TLS 1.2 or higher and encrypted at rest. Backups are made every 6 hours and kept for 14 days.

Bridgeway Labs employees can only access customer data when a customer asks for help in a support ticket, and every access is recorded in the audit log. Business plan customers can view these audit logs themselves.
