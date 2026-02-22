const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('../config');

async function deploy() {
  const cmd = [new SlashCommandBuilder().setName('ticket').setDescription('Gửi ticket panel')].map((c) => c.toJSON());
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), { body: cmd });
  console.log('✅ Deployed /ticket command');
}

deploy().catch(console.error);
