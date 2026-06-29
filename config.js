// ============================================================
//  RED Bot — Project Content Config
//  Edit this file to update what the bot tells newcomers.
// ============================================================

module.exports = {
  project: {
    name: "RED Engine",
    color: 0xe63946, // embed accent color (red)

    what: `
**RED Engine** is a self-hosted, federated knowledge-base server built by RED-Collective.

It turns Obsidian-style Markdown vaults into a browsable wiki with cryptographic content verification. Anyone can run a node, publish knowledge, and prove that content hasn't been tampered with.

A RED node can:
- Pull content from **git repos, archives, raw URLs, or peer nodes**
- Render Markdown (including Obsidian \`[[wikilinks]]\` and \`![[embeds]]\`) into HTML
- Verify note authenticity via **Ed25519 signatures** in frontmatter
- **Federate** with other nodes — peer discovery, content sync, URL gossip
- Serve a **React SPA** with full-text search, tag browsing, backlinks, and a link graph
- Run behind **cloudflared** for zero-config public access or **Caddy** for production TLS
    `.trim(),

    why: `
The web is full of knowledge that's controlled, censored, or silently modified.

**RED Engine** exists because we believe knowledge should be:
- ✦ **Verifiable** — every note carries an Ed25519 signature you can check
- ✦ **Decentralized** — no central authority; anyone runs a node
- ✦ **Open** — federated, self-hostable, and fully open source

The current internet gives you no way to prove that what you read is what was written. RED Engine fixes that — truth is signed, not just stated.
    `.trim(),

    how: `
**Content & Signatures**
Notes are Markdown files signed by the author using the \`red-feather\` CLI. The signature lives in YAML frontmatter (\`red_sig\`, \`red_hash\`, \`red_author\`). The engine verifies every note against the contributor keyring — returning \`verified\`, \`unverified\`, \`tampered\`, or \`unsigned\`.

**Ingestion & Indexing**
On startup, the engine pulls content from configured sources (git, zip, tar.gz, peer manifests) into \`dataDir/\`. It then walks the filesystem, parses frontmatter, verifies signatures, renders Markdown to HTML via \`goldmark\`, and builds two indexes:
- An **in-memory store** for fast article/wikilink lookup
- A **SQLite navigation index** (\`nav.db\`) with FTS5 full-text search and a wikilink graph

**Serving**
A \`net/http\` mux serves a JSON API at \`/api/*\`, admin endpoints at \`/-/admin/*\`, raw content at \`/content/*\`, and the compiled React SPA at \`/\`.

**Federation**
Nodes authenticate each other via Ed25519 key pairs. When a node's URL changes (e.g. cloudflared tunnel restart), it re-registers with peers via a signed challenge-response handshake. Content syncs via signed manifests with SHA256 file hashes. Peer discovery uses gossip — nodes share their peer lists and rediscover each other even after simultaneous restarts.
    `.trim(),

    stack: `
| Layer | Tech |
|-------|------|
| Language | **Go** |
| HTTP Server | \`net/http\` (custom mux) |
| Markdown Rendering | **goldmark** + bluemonday sanitizer |
| Database | **SQLite** (modernc.org/sqlite) — registry + nav index |
| Crypto | **Ed25519** signatures (node identity + note signing) |
| Content Fetching | **go-git** (native git), zip/tar.gz/raw URL support |
| Frontend | **React SPA** (Vite + React Router) + legacy Vue 3 SPA |
| Tunnel / Proxy | **cloudflared** (dev/quick), **Caddy** (production TLS) |
| Containerization | **Docker** (multi-stage) + **docker-compose** |
| Dev Tooling | **Air** (live reload), \`.air.toml\`, PowerShell + shell scripts |
| CI | GitHub Actions → Discord notifications |

Repository: [RED-Collective/RED-Engine](https://github.com/RED-Collective/RED-Engine)
    `.trim(),

    tasks: `
Here's how you can contribute to RED Engine:

**🟢 Good First Issues**
- Write or improve documentation (any \`internal/\` package is under-documented)
- Add test cases for signature verification (\`internal/fetch/notesig.go\`)
- Improve error messages in the HTTP handlers (\`internal/router/\`)
- Add missing edge cases to wikilink rendering tests (\`internal/render/wikilinks_test.go\`)

**🟡 Intermediate**
- Work on the **React SPA** — it's early stage, lots of pages still needed (\`internal/router/red-engine-frontend/\`)
- Improve the **navigation scanner** (\`internal/navigation/scanner.go\`)
- Add new API endpoints to the router (\`internal/router/api.go\`)
- Improve the federation heartbeat logic (\`cmd/red/main.go\`)

**🔴 Advanced**
- Federation protocol improvements — gossip reliability, peer rediscovery edge cases
- Performance: store reload is a full filesystem walk — incremental indexing
- Conflict resolution in \`OrganizeVault\` for multi-source deployments
- Vue → React migration (the legacy Vue SPA still exists alongside React)

Check open tickets with \`/ticket list\` or reach out to an admin to get assigned.
    `.trim(),
  },

  // Roles that can manage all tickets (complete/delete any)
  adminRoles: ["Admin", "Maintainer", "Mod"],
};