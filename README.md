# 🔴 RED Bot

> Onboarding & ticket management bot for [RED-Collective](https://github.com/RED-Collective).

RED is a Discord bot that helps newcomers understand the RED Engine project and lets contributors track work — all through slash commands. No database required.

---

## Commands

### Project Info
| Command | Description |
|---------|-------------|
| `/what` | What is RED Engine? |
| `/why` | Why does it exist? |
| `/how` | How is it architected and built? |
| `/stack` | Full tech stack |
| `/tasks` | Where and how to contribute |

### Ticket Management
| Command | Description |
|---------|-------------|
| `/ticket create <name>` | Open a new ticket (auto-assigned ID like `T-001`) |
| `/ticket list [all\|open\|done]` | List tickets with optional filter |
| `/ticket complete <id or name>` | Mark a ticket done |
| `/ticket delete <id or name>` | Delete a ticket |

Tickets persist to a local `tickets.json` file. No external database needed.

**Permissions:** Anyone can create and list tickets. Only the ticket creator or a user with an admin role (configurable in `config.js`) can complete or delete.

---


## Part of the RED-Collective

RED Bot is the companion tool to [RED Engine](https://github.com/RED-Collective/RED-Engine) — a self-hosted, federated knowledge-base server with cryptographic content verification.

