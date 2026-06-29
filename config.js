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

  redkt:`
    # RED Knowledge Tree

**A hierarchical, git-based knowledge verification system designed to prevent authority-based suppression of valid information.**

---

## 1. Core Problem

Traditional knowledge institutions (journals, encyclopedias, centralized wikis) concentrate verification power at the top of a hierarchy. This creates a structural bias: information can be rejected not because it's wrong, but because the people with gatekeeping authority refuse it — for reasons of ego, territory, ideology, or simple error — and there is no mechanism to distinguish "this was rejected because it's false" from "this was rejected because someone with power said no."

RED Knowledge Tree is designed so that:

- Verification flows from the bottom (specific, narrow expertise) to the top (broad, foundational claims).
- No single maintainer or branch can reject information by authority alone.
- Rejections must be justified by a specific, checkable claim — not asserted by fiat.
- Illegitimate rejections can be overturned by domain-qualified peers, without requiring escalation to a higher authority.
- A rejected-but-valid update is never erased or suppressed — at worst, it simply doesn't propagate further up the tree, and remains fully visible at the level it reached.

---

## 2. Structural Model

### 2.1 The Tree

Knowledge is organized as a hierarchical tree of self-hosted git repositories, mirroring increasing specificity:

Sciences
└── Applied Sciences
    └── Engineering
        ├── Computer Engineering
        │   ├── Computer Architecture
        │   ├── Digital System Design
        │   └── Programming
        │       └── Languages
        ├── Electrical Engineering
        ├── Network Engineering
        └── Communication Engineering
    └── Medicine
        └── ...

Each node in the tree is a repository with:

- Its own maintainer or maintainer group (not necessarily one person).
- Its own content (the body of knowledge claimed at that level).
- Its own **foundation file** (see §3).
- Pull requests open only to its direct parent.

### 2.2 Information Flow

- Updates originate at any branch and are proposed via pull request to that branch's **direct parent only**.
- A successful merge at a given level does _not_ obligate that level to push the update further upward. Propagation beyond one level requires the parent itself (and its own parent, recursively) to independently accept it.
- This means an update can be fully valid, fully merged, and permanently visible at, say, the Computer Engineering level — without ever reaching Engineering or Applied Sciences. This is not suppression; it is scope. The update is not hidden, only not (yet, or ever) elevated to broader-canon status.

---

## 3. The Foundation File: Jurisdiction, Not Authority

This is the mechanism that prevents arbitrary rejection.

### 3.1 What it is

Every branch maintains a **foundation file** — a small, explicit, versioned set of the axioms, definitions, and theory-level claims that constitute what that branch fundamentally asserts. It is not the branch's entire content; it is the narrow subset of claims that the branch is _foundationally responsible for_, and which any child branch is implicitly building on top of.

Example: Engineering's foundation file might include claims about how current flows, what a transistor fundamentally is, core thermodynamic constraints — the shared substrate that Computer Engineering, Electrical Engineering, and others all depend on. It does **not** include cache coherency protocols, which is Computer Engineering's own internal foundation-file matter, not Engineering's.

### 3.2 Why it matters

A parent branch has **no jurisdiction to reject a pull request on any grounds outside its own foundation file.** It cannot reject based on a sub-branch's internal technical matter — that is the child branch's own business to adjudicate with _its_ children, not the parent's. The parent's review surface is narrow by design: it checks whether the diff touches or contradicts a foundational claim it actually owns. If it doesn't, the parent has no legitimate basis to reject, full stop.

This converts gatekeeping from a discretionary power into an auditable check: anyone can look at the foundation file and the diff and verify whether the parent's jurisdiction claim is even plausible.

### 3.3 Rejection Requirements

A parent **cannot reject a PR on authority alone.** Every rejection must cite:

1. The specific foundation file clause being violated.
2. An explanation of how the diff violates it.

A rejection with no citation, or one that cites something outside the parent's own foundation file, is not a valid rejection — it is exactly the kind of move the override mechanism (§4) exists to catch.

---

## 4. The Override Mechanism

### 4.1 Purpose

To resolve the case where a parent rejects a PR, cites a foundation-file clause, but the citation doesn't actually hold up — i.e., the parent is technically following the rejection format but the reasoning is weak, stretched, or pretextual.

### 4.2 Who votes

**Siblings** — the other direct children of the same parent that rejected the PR. Not the rejected branch itself (it cannot vote itself into an override), not distant tree-mates at the same depth elsewhere in the tree, and not the parent. Eligibility is determined by shared parentage, not by tree-depth alone, because shared parentage is what guarantees actual domain proximity to the disputed foundation clause.

Example: If Computer Engineering rejects a Programming PR, the eligible voters are Computer Engineering's other children — Computer Architecture, Digital System Design, Networking-within-CompE, etc. — not Electrical Engineering, which sits at a different branch entirely.

### 4.3 What they vote on

Not "is the underlying science correct" — siblings are not always equipped to adjudicate that. They vote specifically on: **does the cited foundation-file clause actually support this rejection, or is the parent's citation a stretch / pretext / misapplication.**

This keeps the vote scoped to something siblings are actually positioned to judge — jurisdiction and citation legitimacy — rather than asking them to independently re-verify content that may be outside their specific expertise.

### 4.4 Threshold

**7/10 supermajority** of eligible sibling votes is required to overturn a rejection. If met, the parent is obligated to merge — it cannot refuse a second time on the same grounds.

### 4.5 Consequences for repeatedly-overridden parents

None are formally encoded. A maintainer or maintainer-group that is routinely overridden will, by design, lose community trust and standing over time and be organically replaced. The system does not need a formal penalty mechanism for this — it's treated as a social/reputational outcome, not a protocol-level one.

---

## 5. Why Jurisdictional Disputes Don't Need a Special Resolution Path

A natural worry: what about updates that straddle two levels — e.g., a claim that's part physics (Engineering-owned) and part architecture (Computer-Engineering-owned)?

This doesn't require a special arbitration path because review already happens sequentially, once per level, on the way up. Computer Engineering reviews and resolves its own foundation-file-relevant portion of the diff first. Only if it passes that gate does it reach Engineering, which then reviews _only_ its own foundation-file-relevant portion. Each level gets exactly one bite at the part it actually owns, in the order the tree already dictates. There is no ambiguous joint-custody case, because no level is ever reaching past its own foundation file to begin with — by construction.

---

## 6. Corrections and Reverts

If a foundational claim is later found to be wrong — not just locally disputed, but actually incorrect — the correction flows back down through the same structure that approved it, rather than requiring a graph-wide cascade invalidation across every downstream fork that built on it.

This is made tractable by the access model in §7: because nothing below the main trunk was ever claiming root-level certification in the first place, a revert doesn't need to chase down and invalidate every downstream dependent. It only needs to correct the level where the error lived and let that level's own children re-engage with the correction at their own pace, through the normal PR flow.

**Open consideration:** branches that haven't yet propagated upward should carry a visible status (e.g., _pending_, _disputed — see thread_, _reverted, awaiting revision_) so that someone accessing a branch directly isn't mistaking "hasn't climbed yet" for "uncontroversial."

---

## 7. Access Model: Main Trunk vs. Live Branches

- **Main branch**: represents only what has survived review at every single level, all the way up. By design, this is slow and conservative — reaching main requires passing the foundation-file gate at every ancestor level, with no shortcuts.
- **Direct branch access**: anyone may access any branch directly via its own URL/repo, bypassing main entirely. This exposes bleeding-edge, not-yet-fully-elevated information to anyone who specifically seeks it out.

The access path itself is the disclosure: reaching information through a branch URL rather than through main is an implicit signal that the information has not (yet, or ever) received root-level certification. This avoids the need to propagate invalidation through an entire downstream dependency graph — nothing downstream was ever representing itself as fully certified, so a revert at one level doesn't strand claims of certification it never made.

---

## 8. Summary of the Full Loop

1. A branch opens a PR to its direct parent only.
2. The parent reviews the diff strictly against its own foundation file — it has no jurisdiction over anything else in the diff.
3. The parent either merges, or rejects with a mandatory citation to the specific foundation-file clause violated. Rejection by authority alone, with no citation, is invalid.
4. If rejected, the child's siblings (other children of the same parent) vote on whether the citation legitimately applies. 7/10 supermajority overturns the rejection and forces a merge.
5. Once merged, the parent is under no obligation to push the update further upward. Propagation stalls naturally if the next level doesn't independently pick it up — this is not suppression, since the content remains fully visible at the level it reached.
6. Main represents only what has cleared this process at every level. Anyone can still access any branch directly for less-certified, live information — the access path is the disclosure of certification status.
7. If a foundational error is later found, correction flows back down through the same per-level review structure rather than requiring cascade invalidation across the whole tree, because nothing downstream was ever claiming root-level certification to begin with.
8. Maintainers who are repeatedly overridden are expected to lose standing and be replaced organically; no formal penalty protocol is defined.

---

## 9. Open Questions for Future Iteration

These were identified during design but intentionally left unresolved for now:

- **Status visibility**: should branches display a formal status tag (pending / disputed / reverted) so direct-access readers understand why something hasn't reached main?
- **Foundation file governance**: what process governs _changes to a branch's own foundation file_ itself? (This is a recursive version of the same problem the whole system solves for content — likely warrants its own pass.)
- **Vote weighting**: should sibling votes be weighted by contribution history / track record, or remain one-sibling-one-vote regardless of branch size or activity level?
  `.trim(),

  // Roles that can manage all tickets (complete/delete any)
  adminRoles: ["Admin", "Maintainer", "Mod"],
};