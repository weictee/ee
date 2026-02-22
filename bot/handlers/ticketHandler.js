const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { getGuildConfig, getTickets, setTicket, updateTicket, removeTicket, saveGuildConfig } = require('../../database/models/store');
const { panelEmbed, panelComponents, ticketActionRows, ticketWelcomeEmbed, panelEditorButtons } = require('./embedFactory');
const { buildHtmlTranscript } = require('../utils/transcript');

const creatingLock = new Set();

function sanitizeChannelName(input) {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 90);
}

function hasStaffRole(member, roleId) {
  return roleId ? member.roles.cache.has(roleId) : false;
}

async function sendPanel(interaction) {
  const guildConfig = getGuildConfig(interaction.guildId);
  const embed = panelEmbed(guildConfig);
  await interaction.reply({
    embeds: [embed],
    components: [...panelComponents(), ...panelEditorButtons()],
  });
}

function existingOpenTicket(guildId, userId) {
  const tickets = getTickets();
  return Object.values(tickets).find((t) => t.guildId === guildId && t.ownerId === userId && t.status !== 'deleted');
}

async function ensureCategory(guild, guildConfig) {
  if (guildConfig.categoryId) {
    const cat = guild.channels.cache.get(guildConfig.categoryId);
    if (cat) return cat;
  }
  const created = await guild.channels.create({ name: 'Tickets', type: ChannelType.GuildCategory });
  saveGuildConfig(guild.id, { categoryId: created.id });
  return created;
}

async function createTicket(interaction, typeId) {
  const lockKey = `${interaction.guildId}:${interaction.user.id}`;
  if (creatingLock.has(lockKey)) {
    await interaction.reply({ content: 'Bạn đang tạo ticket, vui lòng chờ...', ephemeral: true });
    return;
  }

  const opened = existingOpenTicket(interaction.guildId, interaction.user.id);
  if (opened) {
    await interaction.reply({ content: `Bạn đã có ticket mở: <#${opened.channelId}>`, ephemeral: true });
    return;
  }

  creatingLock.add(lockKey);
  try {
    const guildConfig = getGuildConfig(interaction.guildId);
    const category = await ensureCategory(interaction.guild, guildConfig);
    const type = require('../../config').defaults.categories.find((c) => c.id === typeId);
    const channelName = sanitizeChannelName(
      guildConfig.ticketNameFormat
        .replace('{username}', interaction.user.username)
        .replace('{type}', typeId)
    );

    const permissionOverwrites = [
      { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
    ];

    if (guildConfig.staffRoleId) {
      permissionOverwrites.push({
        id: guildConfig.staffRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites,
      topic: `ticket-owner:${interaction.user.id};type:${typeId}`,
    });

    const created = setTicket(channel.id, {
      channelId: channel.id,
      guildId: interaction.guildId,
      ownerId: interaction.user.id,
      type: typeId,
      claimedBy: null,
      status: 'open',
      createdAt: Date.now(),
      closedAt: null,
    });

    await channel.send({
      content: `${interaction.user} <@&${guildConfig.staffRoleId}>`,
      embeds: [ticketWelcomeEmbed(type?.label || typeId, interaction.user)],
      components: ticketActionRows(false),
    });

    await interaction.reply({ content: `Đã tạo ticket: ${channel}`, ephemeral: true });
    await sendLog(interaction.guild, guildConfig.logChannelId, 'ticket_created', created);
  } finally {
    creatingLock.delete(lockKey);
  }
}

async function sendLog(guild, logChannelId, action, ticket, extra = '') {
  if (!logChannelId) return;
  const ch = guild.channels.cache.get(logChannelId);
  if (!ch || !ch.isTextBased()) return;
  const embed = new EmbedBuilder()
    .setColor('#FEE75C')
    .setTitle(`🧾 Ticket Log: ${action}`)
    .addFields(
      { name: 'Channel', value: `<#${ticket.channelId}>`, inline: true },
      { name: 'Owner', value: `<@${ticket.ownerId}>`, inline: true },
      { name: 'Type', value: ticket.type || 'unknown', inline: true },
      { name: 'Status', value: ticket.status, inline: true }
    )
    .setTimestamp();
  if (extra) embed.setDescription(extra);
  await ch.send({ embeds: [embed] });
}

async function claimTicket(interaction) {
  const ticket = getTickets()[interaction.channelId];
  if (!ticket) return interaction.reply({ content: 'Không tìm thấy dữ liệu ticket.', ephemeral: true });
  const guildConfig = getGuildConfig(interaction.guildId);
  if (!hasStaffRole(interaction.member, guildConfig.staffRoleId)) {
    return interaction.reply({ content: 'Chỉ staff mới claim ticket.', ephemeral: true });
  }
  if (ticket.claimedBy) return interaction.reply({ content: `Ticket đã được claim bởi <@${ticket.claimedBy}>.`, ephemeral: true });

  updateTicket(ticket.channelId, { claimedBy: interaction.user.id });
  await interaction.update({ components: ticketActionRows(true) });
  await interaction.followUp({ content: `✅ Ticket được claim bởi ${interaction.user}.` });
  await sendLog(interaction.guild, guildConfig.logChannelId, 'ticket_claimed', { ...ticket, claimedBy: interaction.user.id, status: ticket.status });
}

async function closeTicket(interaction) {
  const tickets = getTickets();
  const ticket = tickets[interaction.channelId];
  if (!ticket) return interaction.reply({ content: 'Không tìm thấy ticket.', ephemeral: true });
  const guildConfig = getGuildConfig(interaction.guildId);

  const allowed = interaction.user.id === ticket.ownerId || hasStaffRole(interaction.member, guildConfig.staffRoleId);
  if (!allowed) return interaction.reply({ content: 'Bạn không có quyền close ticket này.', ephemeral: true });

  updateTicket(ticket.channelId, { status: 'closed', closedAt: Date.now() });
  await interaction.reply({ content: 'Ticket đã đóng. Staff có thể reopen hoặc delete.' });
  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, { SendMessages: false, ViewChannel: true });
  await sendLog(interaction.guild, guildConfig.logChannelId, 'ticket_closed', { ...ticket, status: 'closed' });
}

async function reopenTicket(interaction) {
  const ticket = getTickets()[interaction.channelId];
  if (!ticket) return interaction.reply({ content: 'Không tìm thấy ticket.', ephemeral: true });
  const guildConfig = getGuildConfig(interaction.guildId);
  if (!hasStaffRole(interaction.member, guildConfig.staffRoleId)) {
    return interaction.reply({ content: 'Chỉ staff mới reopen ticket.', ephemeral: true });
  }

  updateTicket(ticket.channelId, { status: 'open' });
  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, { SendMessages: true, ViewChannel: true });
  await interaction.reply({ content: 'Đã reopen ticket.' });
  await sendLog(interaction.guild, guildConfig.logChannelId, 'ticket_reopened', { ...ticket, status: 'open' });
}

async function deleteTicket(interaction) {
  const ticket = getTickets()[interaction.channelId];
  if (!ticket) return interaction.reply({ content: 'Không tìm thấy ticket.', ephemeral: true });
  const guildConfig = getGuildConfig(interaction.guildId);
  if (!hasStaffRole(interaction.member, guildConfig.staffRoleId)) {
    return interaction.reply({ content: 'Chỉ staff mới delete ticket.', ephemeral: true });
  }

  const transcript = await buildHtmlTranscript(interaction.channel);
  const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannelId);
  if (logChannel && logChannel.isTextBased()) {
    await logChannel.send({ content: `📎 Transcript của ${interaction.channel.name}`, files: [transcript] });
  }

  await sendLog(interaction.guild, guildConfig.logChannelId, 'ticket_deleted', { ...ticket, status: 'deleted' });
  removeTicket(ticket.channelId);
  await interaction.reply({ content: 'Đang xóa ticket...' });
  await interaction.channel.delete('Ticket deleted by staff');
}

function buildModal(customId, title, fields) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);
  const rows = fields.map((f) =>
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId(f.id)
        .setLabel(f.label)
        .setStyle(f.style || TextInputStyle.Short)
        .setRequired(f.required ?? false)
        .setValue(f.value || '')
    )
  );
  return modal.addComponents(...rows);
}

async function openPanelEditorModal(interaction, section) {
  const cfg = getGuildConfig(interaction.guildId);
  if (!hasStaffRole(interaction.member, cfg.staffRoleId)) {
    return interaction.reply({ content: 'Chỉ staff mới chỉnh panel.', ephemeral: true });
  }

  const e = cfg.embed;
  if (section === 'basic') {
    return interaction.showModal(
      buildModal('panel_modal_basic', 'Edit Basic Embed', [
        { id: 'title', label: 'Title', value: e.title },
        { id: 'description', label: 'Description', value: e.description, style: TextInputStyle.Paragraph },
        { id: 'color', label: 'Color (#5865F2)', value: e.color },
      ])
    );
  }
  if (section === 'author') {
    return interaction.showModal(
      buildModal('panel_modal_author', 'Edit Author', [
        { id: 'authorName', label: 'Author Name', value: e.authorName },
        { id: 'authorIcon', label: 'Author Icon URL', value: e.authorIcon },
      ])
    );
  }
  if (section === 'footer') {
    return interaction.showModal(
      buildModal('panel_modal_footer', 'Edit Footer', [
        { id: 'footerText', label: 'Footer Text', value: e.footerText },
        { id: 'footerIcon', label: 'Footer Icon URL', value: e.footerIcon },
      ])
    );
  }

  return interaction.showModal(
    buildModal('panel_modal_images', 'Edit Images', [
      { id: 'bannerUrl', label: 'Banner URL', value: e.bannerUrl },
      { id: 'thumbnailUrl', label: 'Thumbnail URL', value: e.thumbnailUrl },
    ])
  );
}

async function submitPanelModal(interaction) {
  const cfg = getGuildConfig(interaction.guildId);
  const fields = interaction.fields;
  const patch = {};

  if (interaction.customId === 'panel_modal_basic') {
    patch.embed = {
      title: fields.getTextInputValue('title'),
      description: fields.getTextInputValue('description'),
      color: fields.getTextInputValue('color'),
    };
  }
  if (interaction.customId === 'panel_modal_author') {
    patch.embed = {
      authorName: fields.getTextInputValue('authorName'),
      authorIcon: fields.getTextInputValue('authorIcon'),
    };
  }
  if (interaction.customId === 'panel_modal_footer') {
    patch.embed = {
      footerText: fields.getTextInputValue('footerText'),
      footerIcon: fields.getTextInputValue('footerIcon'),
    };
  }
  if (interaction.customId === 'panel_modal_images') {
    patch.embed = {
      bannerUrl: fields.getTextInputValue('bannerUrl'),
      thumbnailUrl: fields.getTextInputValue('thumbnailUrl'),
    };
  }

  const updated = saveGuildConfig(interaction.guildId, patch);
  await interaction.reply({ content: 'Đã cập nhật panel embed.', ephemeral: true });

  if (cfg.panelChannelId) {
    const panelChannel = interaction.guild.channels.cache.get(cfg.panelChannelId);
    if (panelChannel && panelChannel.isTextBased()) {
      await panelChannel.send({ embeds: [panelEmbed(updated)], components: [...panelComponents(), ...panelEditorButtons()] });
    }
  }
}

module.exports = {
  sendPanel,
  createTicket,
  claimTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  openPanelEditorModal,
  submitPanelModal,
};
