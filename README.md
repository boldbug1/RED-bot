# 🔴 RED Bot

Onboarding & ticket management bot for RED-Collective.

---

## Commands

| Command | Description |
|---------|-------------|
| `/what` | What is RED Engine? |
| `/why` | Why does it exist? |
| `/how` | How is it built? |
| `/stack` | Tech stack |
| `/tasks` | Contribution tasks |
| `/ticket create <name>` | Create a ticket |
| `/ticket complete <id or name>` | Mark ticket done |
| `/ticket delete <id or name>` | Delete a ticket |
| `/ticket list [filter]` | List all/open/done tickets |

---

## Setup

### 1. Create the Discord App

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. **New Application** → name it `RED`
3. Go to **Bot** tab → **Add Bot**
4. Copy the **Token** → paste into `.env` as `BOT_TOKEN`
5. Copy the **Application ID** from General Information → `APP_ID`
6. Enable **Server Members Intent** and **Message Content Intent** (Bot tab → Privileged Gateway Intents)

### 2. Invite the bot to your server

Go to **OAuth2 → URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`

Copy the URL, open it, and invite to your server.

### 3. Configure

```bash
cp .env.example .env
# Fill in BOT_TOKEN, APP_ID, GUILD_ID
```

### 4. Install & Run

```bash
npm install
node index.js
```

---

## Customizing Project Content

Edit `config.js` to update what the bot says in `/what`, `/why`, `/how`, `/stack`, and `/tasks`. No logic changes needed.

```js
module.exports = {
  project: {
    name: "RED Engine",
    what: `Your description here...`,
    // ...
  },
  adminRoles: ["Admin", "Maintainer"], // roles that can manage all tickets
};
```

---

## Ticket Permissions

| Action | Who can do it |
|--------|---------------|
| Create | Anyone |
| Complete | Creator or Admin role |
| Delete | Creator or Admin role |
| List | Anyone |

Admin roles are defined in `config.js` under `adminRoles`.

---

## Files

```
red-bot/
├── index.js      # Bot logic + all commands
├── config.js     # Project content (edit this)
├── tickets.js    # Ticket storage (JSON)
├── tickets.json  # Auto-created on first ticket
├── .env          # Your secrets (don't commit!)
└── .env.example  # Template
```

---

## Production Tips

- Run with `pm2`: `pm2 start index.js --name red-bot`
- For global commands (all servers), remove `GUILD_ID` from `.env` — takes ~1hr to propagate
- Swap `tickets.js` backend for SQLite when ticket count grows
