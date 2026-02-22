const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('../config');
const {
  sendPanel,
  createTicket,
  claimTicket,
  closeTicket,
  reopenTicket,
  deleteTicket,
  openPanelEditorModal,
  submitPanelModal,
} = require('./handlers/ticketHandler');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') return sendPanel(interaction);

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
      return createTicket(interaction, interaction.values[0]);
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_claim') return claimTicket(interaction);
      if (interaction.customId === 'ticket_close') return closeTicket(interaction);
      if (interaction.customId === 'ticket_reopen') return reopenTicket(interaction);
      if (interaction.customId === 'ticket_delete') return deleteTicket(interaction);
      if (interaction.customId === 'panel_edit_basic') return openPanelEditorModal(interaction, 'basic');
      if (interaction.customId === 'panel_edit_author') return openPanelEditorModal(interaction, 'author');
      if (interaction.customId === 'panel_edit_footer') return openPanelEditorModal(interaction, 'footer');
      if (interaction.customId === 'panel_edit_images') return openPanelEditorModal(interaction, 'images');
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('panel_modal_')) {
      return submitPanelModal(interaction);
    }
  } catch (error) {
    console.error(error);
    const payload = { content: 'Đã có lỗi xảy ra khi xử lý interaction.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => null);
    else await interaction.reply(payload).catch(() => null);
  }
});

if (!config.discord.token) throw new Error('Missing TOKEN in .env');
client.login(config.discord.token);
