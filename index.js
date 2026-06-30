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
  ChannelType,
} = require("discord.js");

const cfg = require("./config");
const store = require("./tickets");
const Points = require("./points");

const TOKEN   = process.env.BOT_TOKEN;
const APP_ID  = process.env.APP_ID;
const GUILD_ID = process.env.GUILD_ID; // set for instant guild-scoped deploy; remove for global

const lastActivity = new Map();
const ACTIVITY_COOLDOWN = 60000; // 1 min between activity points

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

async function getOrCreateCategory(guild, name) {
  let category = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name
  );
  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
    });
  }
  return category;
}

async function moveToReadOnlyCategory(guild, channel, categoryName) {
  if (!channel) return;
  const category = await getOrCreateCategory(guild, categoryName);
  await channel.setParent(category.id, { lockPermissions: false });
  // Remove ticket creator's individual overwrites by fetching them
  const everyone = guild.roles.everyone;
  const overwrites = channel.permissionOverwrites.cache;
  for (const [, ov] of overwrites) {
    if (ov.type === 1) await ov.delete(); // remove member-specific overrides
  }
  await channel.permissionOverwrites.edit(everyone, {
    ViewChannel: true,
    SendMessages: false,
    AddReactions: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
  });
}

// ── Command definitions ───────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName("redkt")
    .setDescription("The system behind how RED verifies and governs knowledge across nodes"),

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
        .setDescription("Mark a ticket as complete and award points")
        .addStringOption((opt) =>
          opt.setName("ticket").setDescription("Ticket ID (e.g. T-001) or name").setRequired(true)
        )
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to award points to").setRequired(true)
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

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show the points leaderboard"),
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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  console.log(`\n🔴 RED Bot online as ${client.user.tag}`);
  await registerCommands();
});

// ── Activity points ───────────────────────────────────────

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  const now = Date.now();
  const last = lastActivity.get(message.author.id);
  if (last && now - last < ACTIVITY_COOLDOWN) return;
  lastActivity.set(message.author.id, now);
  Points.addPoints(message.author.id, message.author.tag, 1);
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

  // ── /redknowledgetree ────────────────────────────────────────────
 if (commandName === "redkt") {
  return interaction.reply({
    embeds: [embed(`🌲 RED Knowledge Tree`, cfg.project.redkt)],
  });
}


  // ── /tasks ────────────────────────────────────────────
  if (commandName === "tasks") {
    return interaction.reply({
      embeds: [embed(`📋 Tasks — How to Contribute`, cfg.project.tasks)],
    });
  }

  // ── /leaderboard ─────────────────────────────────────
  if (commandName === "leaderboard") {
    const leaderboard = Points.getLeaderboard(10);
    if (leaderboard.length === 0) {
      return interaction.reply({
        embeds: [embed("🏆 Leaderboard", "No points have been awarded yet.")],
      });
    }

    const lines = leaderboard.map((u, i) => {
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
      return `${medal} <@${u.userId}> — **${u.points}** point${u.points === 1 ? "" : "s"}`;
    });

    return interaction.reply({
      embeds: [embed("🏆 Points Leaderboard", lines.join("\n"))],
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
      const guild = interaction.guild;

      try {
        const category = await getOrCreateCategory(guild, "Tickets");
        const channelName = ticket.id.toLowerCase().replace(/[^a-z0-9-]/g, "");
        const channel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.roles.everyone,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: member.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
            },
            ...cfg.adminRoles
              .map((roleName) => guild.roles.cache.find((r) => r.name === roleName))
              .filter(Boolean)
              .map((role) => ({
                id: role.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
              })),
          ],
        });

        store.setChannelId(ticket.id, channel.id);
        const pts = Points.addPoints(member.id, member.user.tag, 2);

        return interaction.reply({
          embeds: [
            embed(
              "🔴 Ticket Created",
              `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n**By:** ${ticket.authorTag}\n**Channel:** ${channel}\n**+2 points (now ${pts} total)**`,
              0xe63946
            ),
          ],
        });
      } catch (err) {
        console.error("Failed to create ticket channel:", err);
        return interaction.reply({
          embeds: [
            embed(
              "🔴 Ticket Created",
              `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n**By:** ${ticket.authorTag}\n*(Could not create channel — check bot permissions)*`,
              0xe63946
            ),
          ],
        });
      }
    }

    // /ticket complete
    if (sub === "complete") {
      if (!isAdmin(member)) {
        return interaction.reply({
          embeds: [embed("🚫 Permission Denied", "Only admins, mods, or owners can complete tickets.", 0xff6b6b)],
          ephemeral: true,
        });
      }

      const query = interaction.options.getString("ticket");
      const targetUser = interaction.options.getUser("user");
      const found = store.find(query);

      if (!found) {
        return interaction.reply({
          embeds: [embed("❌ Not Found", `No ticket matching \`${query}\``, 0xff6b6b)],
          ephemeral: true,
        });
      }

      const ticket = store.complete(query);
      const pts = Points.addPoints(targetUser.id, targetUser.tag, 5);

      const channel = interaction.guild.channels.cache.get(ticket.channelId);
      await moveToReadOnlyCategory(interaction.guild, channel, "Archived Tickets");

      return interaction.reply({
        embeds: [
          embed(
            "✅ Ticket Completed",
            `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n**Closed by:** ${member.user.tag}\n**Awarded 5 points to:** ${targetUser} (now has ${pts} point${pts === 1 ? "" : "s"})`,
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

      const channel = interaction.guild.channels.cache.get(ticket.channelId);
      await moveToReadOnlyCategory(interaction.guild, channel, "Deleted Tickets");

      return interaction.reply({
        embeds: [
          embed(
            "🗑️ Ticket Deleted",
            `**ID:** \`${ticket.id}\`\n**Name:** ${ticket.name}\n*Channel moved to Deleted Tickets*`,
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
