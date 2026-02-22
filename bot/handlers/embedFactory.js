const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../../config');

function panelEmbed(guildConfig) {
  const e = guildConfig.embed;
  const embed = new EmbedBuilder()
    .setTitle(e.title)
    .setDescription(e.description)
    .setColor(e.color || '#5865F2')
    .setFooter({ text: e.footerText || 'Powered by Ticket Suite', iconURL: e.footerIcon || undefined });

  if (e.authorName) embed.setAuthor({ name: e.authorName, iconURL: e.authorIcon || undefined });
  if (e.bannerUrl) embed.setImage(e.bannerUrl);
  if (e.thumbnailUrl) embed.setThumbnail(e.thumbnailUrl);
  return embed;
}

function panelComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_select_type')
    .setPlaceholder('Chọn loại ticket bạn cần')
    .addOptions(
      config.defaults.categories.map((c) => ({
        label: c.label,
        description: c.description,
        value: c.id,
        emoji: c.emoji,
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function ticketActionRows(claimed = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket_claim').setLabel(claimed ? 'Claimed' : 'Claim Ticket').setStyle(ButtonStyle.Primary).setDisabled(claimed),
      new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('ticket_reopen').setLabel('Reopen').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('ticket_delete').setLabel('Delete').setStyle(ButtonStyle.Secondary)
    ),
  ];
}

function ticketWelcomeEmbed(typeLabel, user) {
  return new EmbedBuilder()
    .setColor('#57F287')
    .setTitle('🎟️ Ticket đã được tạo')
    .setDescription(`Xin chào ${user}, đội ngũ sẽ phản hồi sớm.\n**Loại ticket:** ${typeLabel}`)
    .setTimestamp();
}

function panelEditorButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('panel_edit_basic').setLabel('Edit Basic Info').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('panel_edit_author').setLabel('Edit Author').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_edit_footer').setLabel('Edit Footer').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('panel_edit_images').setLabel('Edit Images').setStyle(ButtonStyle.Secondary)
    ),
  ];
}

module.exports = { panelEmbed, panelComponents, ticketActionRows, ticketWelcomeEmbed, panelEditorButtons };
