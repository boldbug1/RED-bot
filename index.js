// ============================================================
//  RED Bot — index.js
//  Onboarding & ticket management bot for RED-Collective
// ============================================================

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} = require("discord.js");

const cfg = require("./config");
const store = require("./tickets");

const TOKEN   = process.env.BOT_TOKEN;
const APP_ID  = process.env.APP_ID;
const GUILD_ID = process.env.GUILD_ID; // set for instant guild-scoped deploy; remove for global

// ── Helpers ───────────────────────────────────────────────

function embed(title, description, color = cfg.project.color) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `RED Engine · RED-Collective` })
    .setTimestamp();
}

function isAdmin(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return cfg.adminRoles.some((r) => member.roles.cache.some((role) => role.name === r));
}

function ticketLine(t) {
  const icon = t.status === "complete" ? "✅" : "🔴";
  return `${icon} \`${t.id}\` — **${t.name}** _(by ${t.authorTag})_`;
}

// ── Command definitions ───────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName("what")
    .setDescription(`What is ${cfg.project.name}?`),

  new SlashCommandBuilder()
    .setName("why")
    .setDescription(`Why does ${cfg.project.name} exist?`),

  new SlashCommandBuilder()
    .setName("how")
    .setDescription(`How is ${cfg.project.name} built / solving problems?`),

  new SlashCommandBuilder()
    .setName("stack")
    .setDescription(`Tech stack used in ${cfg.project.name}`),

  new SlashCommandBuilder()
    .setName("tasks")
    .setDescription("What can I contribute to the repository?"),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage tickets for RED Engine")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new ticket")
        .addStringOption((opt) =>
          opt.setName("name").setDescription("Ticket name / short description").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("complete")
        .setDescription("Mark a ticket as complete")
        .addStringOption((opt) =>
          opt.setName("ticket").setDescription("Ticket ID (e.g. T-001) or name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a ticket (admin or creator only)")
        .addStringOption((opt) =>
          opt.setName("ticket").setDescription("Ticket ID (e.g. T-001) or name").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("List tickets")
        .addStringOption((opt) =>
          opt
            .setName("filter")
            .setDescription("Which tickets to show")
            .addChoices(
              { name: "All", value: "all" },
              { name: "Open only", value: "open" },
              { name: "Completed", value: "done" }
            )
        )
    ),
].map((c) => c.toJSON());

// ── Register commands ─────────────────────────────────────

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    console.log("Registering slash commands...");
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(APP_ID, GUILD_ID), { body: commands });
      console.log(`✓ Guild commands registered (${GUILD_ID})`);
    } else {
      await rest.put(Routes.applicationCommands(APP_ID), { body: commands });
      console.log("✓ Global commands registered (may take ~1hr to propagate)");
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  }
}

// ── Bot client ────────────────────────────────────────────

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`\n🔴 RED Bot online as ${client.user.tag}`);
  await registerCommands();
});

// ── Interaction handler ───────────────────────────────────

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // ── /what ──────────────────────────────────────────────
  if (commandName === "what") {
    return interaction.reply({
      embeds: [embed(`❓ What is ${cfg.project.name}?`, cfg.project.what)],
    });
  }

  // ── /why ──────────────────────────────────────────────
  if (commandName === "why") {
    return interaction.reply({
      embeds: [embed(`💡 Why does ${cfg.project.name} exist?`, cfg.project.why)],
    });
  }

  // ── /how ──────────────────────────────────────────────
  if (commandName === "how") {
    return interaction.reply({
      embeds: [embed(`⚙️ How is ${cfg.project.name} built?`, cfg.project.how)],
    });
  }

  // ── /stack ────────────────────────────────────────────
  if (commandName === "stack") {
    return interaction.reply({
      embeds: [embed(`🛠️ Tech Stack — ${cfg.project.name}`, cfg.project.stack)],
    });
  }

  // ── /tasks ────────────────────────────────────────────
  if (commandName === "tasks") {
    return interaction.reply({
      embeds: [embed(`📋 Tasks — How to Contribute`, cfg.project.tasks)],
    });
  }

  // ── /ticket ───────────────────────────────────────────
  if (commandName === "ticket") {
    const sub = interaction.options.getSubcommand();
    const member = interaction.member;

    // /ticket create
    if (sub === "create") {
      const name = interaction.options.getString("name");
      const ticket = store.create(name, member.id, member.user.tag);
      return interaction.reply({
        embeds: [
          embed(
            "🔴 Ticket Created",
            `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n**By:** ${ticket.authorTag}`,
            0xe63946
          ),
        ],
      });
    }

    // /ticket complete
    if (sub === "complete") {
      const query = interaction.options.getString("ticket");
      const found = store.find(query);

      if (!found) {
        return interaction.reply({
          embeds: [embed("❌ Not Found", `No ticket matching \`${query}\``, 0xff6b6b)],
          ephemeral: true,
        });
      }

      // Permission: admin OR ticket creator
      if (!isAdmin(member) && found.authorId !== member.id) {
        return interaction.reply({
          embeds: [embed("🚫 Permission Denied", "Only admins or the ticket creator can complete it.", 0xff6b6b)],
          ephemeral: true,
        });
      }

      const ticket = store.complete(query);
      return interaction.reply({
        embeds: [
          embed(
            "✅ Ticket Completed",
            `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n**Closed by:** ${member.user.tag}`,
            0x2ecc71
          ),
        ],
      });
    }

    // /ticket delete
    if (sub === "delete") {
      const query = interaction.options.getString("ticket");
      const found = store.find(query);

      if (!found) {
        return interaction.reply({
          embeds: [embed("❌ Not Found", `No ticket matching \`${query}\``, 0xff6b6b)],
          ephemeral: true,
        });
      }

      if (!isAdmin(member) && found.authorId !== member.id) {
        return interaction.reply({
          embeds: [embed("🚫 Permission Denied", "Only admins or the ticket creator can delete it.", 0xff6b6b)],
          ephemeral: true,
        });
      }

      const ticket = store.remove(query);
      return interaction.reply({
        embeds: [
          embed(
            "🗑️ Ticket Deleted",
            `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}`,
            0x95a5a6
          ),
        ],
      });
    }

    // /ticket list
    if (sub === "list") {
      const filter = interaction.options.getString("filter") || "all";
      const tickets = store.list(filter);

      if (tickets.length === 0) {
        return interaction.reply({
          embeds: [embed("📋 Tickets", `No ${filter === "all" ? "" : filter + " "}tickets found.`)],
        });
      }

      const lines = tickets.map(ticketLine).join("\n");
      const title =
        filter === "open" ? "🔴 Open Tickets"
        : filter === "done" ? "✅ Completed Tickets"
        : "📋 All Tickets";

      return interaction.reply({
        embeds: [embed(title, lines)],
      });
    }
  }
});

// ── Start ─────────────────────────────────────────────────

client.login(TOKEN).catch((err) => {
  console.error("Login failed:", err.message);
  process.exit(1);
});
