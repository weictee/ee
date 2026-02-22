const express = require('express');
const { getGuildConfig, saveGuildConfig } = require('../../database/models/store');
const { defaults } = require('../../config');

const router = express.Router();

function ensureAuth(req, res, next) {
  if (!req.session.user) return res.redirect('/');
  next();
}

function ensureGuildAdmin(req, res, next) {
  const guild = (req.session.guilds || []).find((g) => g.id === req.params.guildId);
  if (!guild) return res.status(403).send('Forbidden');
  req.targetGuild = guild;
  next();
}

function isHexColor(value) {
  return /^#?[A-Fa-f0-9]{6}$/.test(value || '');
}

router.get('/servers', ensureAuth, (req, res) => {
  res.render('servers', { user: req.session.user, guilds: req.session.guilds || [] });
});

router.get('/guild/:guildId', ensureAuth, ensureGuildAdmin, (req, res) => {
  const cfg = getGuildConfig(req.params.guildId);
  res.render('guild', { guild: req.targetGuild, config: cfg, ticketTypes: defaults.categories });
});

router.post('/guild/:guildId/save', ensureAuth, ensureGuildAdmin, (req, res) => {
  const { categoryId, staffRoleId, logChannelId, panelChannelId, ticketNameFormat, title, description, color, bannerUrl, thumbnailUrl, authorName, authorIcon, footerText, footerIcon } = req.body;

  if (color && !isHexColor(color)) {
    return res.status(400).json({ error: 'Invalid color format' });
  }

  const updated = saveGuildConfig(req.params.guildId, {
    categoryId,
    staffRoleId,
    logChannelId,
    panelChannelId,
    ticketNameFormat,
    embed: {
      title,
      description,
      color: color.startsWith('#') ? color : `#${color}`,
      bannerUrl,
      thumbnailUrl,
      authorName,
      authorIcon,
      footerText,
      footerIcon,
    },
  });

  res.json({ ok: true, config: updated });
});

router.post('/guild/:guildId/apply', ensureAuth, ensureGuildAdmin, async (req, res) => {
  try {
    const { Client } = require('discord.js');
    const botConfig = require('../../config');
    const { panelEmbed, panelComponents, panelEditorButtons } = require('../../bot/handlers/embedFactory');

    const client = new Client({ intents: [] });
    await client.login(botConfig.discord.token);
    const cfg = getGuildConfig(req.params.guildId);
    if (!cfg.panelChannelId) throw new Error('panelChannelId is missing');

    const guild = await client.guilds.fetch(req.params.guildId);
    const channel = await guild.channels.fetch(cfg.panelChannelId);
    if (!channel || !channel.isTextBased()) throw new Error('Panel channel not found');

    await channel.send({ embeds: [panelEmbed(cfg)], components: [...panelComponents(), ...panelEditorButtons()] });
    await client.destroy();

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
