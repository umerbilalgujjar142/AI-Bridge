# Bridgeway Labs — Azure Security Standards

> Fictional internal standards used for the AI Bridge learning project. All names, numbers and rules below are made up.

## Purpose and Scope

These standards describe how Bridgeway Labs uses Microsoft Azure securely. They apply to every Azure subscription owned by Bridgeway Labs, to every employee and contractor who creates or changes Azure resources, and to every application that runs in Azure, including BridgeDesk.

The Cloud Security Team owns these standards and reviews them every 6 months. Exceptions must be requested in writing from the Cloud Security Team at security@bridgeway.example, must have an end date, and are reviewed every 3 months. "Must" means mandatory; "should" means strongly recommended unless there is a documented reason.

## Subscriptions and Environments

Bridgeway Labs uses separate Azure subscriptions for each environment: `sub-bridgeway-dev` for development, `sub-bridgeway-test` for testing and `sub-bridgeway-prod` for production. Production data must never be copied to the development or test subscriptions.

Every resource must belong to a resource group, and each resource group must contain resources that share the same lifecycle; for example, all resources of one application in one environment. Resource groups follow the pattern `rg-<application>-<environment>`, for example `rg-bridgedesk-prod`.

## Allowed Regions

Bridgeway Labs production workloads may only run in the East US 2 and West Europe Azure regions. Any other region requires approval from the Cloud Security Team. Development resources should use East US 2.

All resources of one application should be placed in the same region to reduce latency and avoid data transfer costs between regions. Customer data for BridgeDesk must stay in West Europe, because of commitments made to European customers.

## Tagging and Cost Management

Every resource group and resource must have the tags `project`, `env` and `owner`. The `owner` tag contains the email address of the person or team responsible for the resource. Resources without these tags are reported every Monday and may be deleted after 30 days in the development subscription.

Every subscription must have a monthly budget with email alerts at 50%, 80% and 100% of the budget. Development resources that are not used should be stopped or deleted at the end of a project. The Cloud Security Team publishes a monthly cost report for each team.

## Identity and Access

All human access to Azure must use Microsoft Entra ID accounts with multi-factor authentication (MFA) enabled. Shared accounts, such as one login used by a whole team, are forbidden. Personal Microsoft accounts must not be added to company subscriptions.

Applications running in Azure must authenticate with Managed Identity. System-assigned Managed Identity should be used when an identity belongs to exactly one resource; user-assigned Managed Identity may be used when several resources need the same permissions. Application code must use `DefaultAzureCredential` or a specific credential from the Azure Identity library, never hardcoded credentials.

Service principals with client secrets are only allowed for CI/CD pipelines, and their secrets must expire within 90 days. Where the pipeline platform supports it, workload identity federation must be used instead of client secrets, because it needs no secret at all.

## Role Assignments

Roles must follow least privilege: assign the smallest role at the smallest scope that works. For example, an application that only reads secrets from one Key Vault gets the Key Vault Secrets User role on that Key Vault, not Contributor on the subscription.

The Owner role on a subscription is limited to a maximum of 3 people. The Contributor role on production subscriptions is limited to the Platform Team. Developers receive Reader on production and Contributor on development.

Every role assignment on production resources must be reviewed every 6 months by the resource owner. Role assignments for employees who leave Bridgeway Labs are removed automatically on their last working day. Privileged roles on production, such as Owner and User Access Administrator, must be activated just in time through Privileged Identity Management (PIM) for a maximum of 8 hours, with a written reason.

## Secrets and Key Vault

Secrets must never be stored in source code, Docker images, or `.env` files that are committed to git. All production secrets are stored in Azure Key Vault using the RBAC permission model; the older access policy model must not be used for new vaults.

Key Vault names follow the pattern `kv-<team>-<environment>`, for example `kv-payments-prod`. Each application and environment should have its own Key Vault, so that access can be granted per application.

Purge protection must be enabled on every production Key Vault, and the soft-delete retention period must be 90 days. Development Key Vaults may disable purge protection and use a retention period of 7 days.

Secrets must be rotated at least every 90 days, and immediately if a secret may have been exposed, for example in a log file, a screenshot or a chat message. Every secret should have an expiration date set in Key Vault so that expired secrets are easy to find. Applications should read secrets at startup and cache them, rather than calling Key Vault for every request, to avoid throttling.

The preferred approach is to avoid secrets entirely: when an Azure service supports Microsoft Entra ID authentication, applications must use Managed Identity instead of keys or passwords stored in Key Vault.

## Networking

Production databases, Key Vaults and storage accounts should not be reachable from the public internet; they should use private endpoints inside a virtual network. Development resources may use public access, but must still require Entra ID authentication.

All web applications must use HTTPS only, with TLS 1.2 or higher. Inbound traffic to production web applications must pass through Azure Front Door with the Web Application Firewall enabled. Opening management ports such as SSH (22) or RDP (3389) to the internet is forbidden.

## Containers

Container images must be built from official base images, for example the official Node.js images, and must be rebuilt at least every month to include security updates. Images are stored in Azure Container Registry; public registries must not be used for production images.

Containers must run as a non-root user where possible. Secrets must never be baked into images or passed as build arguments; they are provided at runtime through Managed Identity, Key Vault references or Container Apps secrets. Production containers run on Azure Container Apps with at least 2 replicas for availability.

## Databases

Production databases use Azure Database for PostgreSQL Flexible Server. Database access from applications should use Microsoft Entra ID authentication with Managed Identity. If password authentication cannot be avoided, the password must be stored in Key Vault and rotated every 90 days.

Automated backups must be enabled with a retention of at least 14 days for production. A restore must be tested at least once every 6 months, and the result documented in the wiki.

## AI Services

Azure AI and Foundry resources must use keyless (Microsoft Entra ID) authentication; API keys must be disabled in production. Applications receive the Cognitive Services OpenAI User role on the Foundry resource they use, and nothing more.

Every model deployment must keep the default content filter enabled. Model deployments must have a tokens-per-minute limit that matches the expected load, to protect against unexpected costs. Applications must set a maximum output length for model responses.

Customer personal data must not be sent to AI models unless the customer has given consent. System prompts must instruct the model to answer only from the provided context when the application uses retrieval-augmented generation (RAG), and user input must be treated as untrusted, because it may contain prompt injection attempts.

Every model has a retirement date. Teams must check the retirement dates of their deployments every quarter and plan upgrades at least 2 months before a model is retired.

## Logging and Monitoring

All production applications must send logs to a Log Analytics workspace, and logs must be kept for at least 90 days. Logs must never contain secrets, access tokens, passwords or full customer messages. Log the fact that an action happened, not the sensitive data involved.

Microsoft Defender for Cloud must be enabled on every production subscription. High-severity alerts are sent to the #security-incidents channel and must be acknowledged within 1 hour during working hours.

## Reporting Security Incidents

Suspected security incidents must be reported within 1 hour to the Cloud Security Team at security@bridgeway.example or in the #security-incidents channel. Examples of incidents include a leaked secret, an unknown role assignment, a lost laptop with Azure access, or unexpected costs that suggest misuse.

Never try to investigate an incident alone, and do not delete logs or resources involved in the incident, because they may be needed as evidence. If a secret has leaked, report it first and then rotate it together with the Cloud Security Team. Reporting a mistake quickly is always appreciated; nobody is punished for reporting an incident they caused by accident.

## Storage Accounts

Storage accounts must disable anonymous public access to blobs and must require secure transfer (HTTPS). Applications should access storage with Managed Identity and the smallest data role they need, such as Storage Blob Data Reader for read-only access. Shared access signatures (SAS tokens) may only be used for short-lived downloads, must expire within 24 hours, and must never be stored in source code.

Storage account keys must not be used by applications. Where possible, "Allow storage account key access" should be disabled so that only Entra ID authentication works.

## Infrastructure as Code

Production resources must be created and changed through infrastructure as code, using Bicep or Terraform files stored in git. Changes to production infrastructure must go through a pull request reviewed by at least one member of the Platform Team. Manual changes in the Azure Portal are allowed in development, and in production only during an incident, after which the code must be updated within 2 working days to match.

## Training and Awareness

Every employee with Azure access must complete the Bridgeway Labs cloud security training within 30 days of joining and repeat it every year. Engineers working on production systems are encouraged to earn a Microsoft Azure certification; exam fees are paid from the yearly learning budget described in the company handbook.

New team members should read these standards together with their manager during their first week, and ask the Cloud Security Team if anything is unclear.
