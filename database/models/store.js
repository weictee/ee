const fs = require('fs');
const path = require('path');
const config = require('../../config');

function ensureFile(filePath, defaultValue) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

function readJson(filePath, fallback) {
  ensureFile(filePath, fallback);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function makeDefaultGuildConfig(guildId) {
  return {
    guildId,
    categoryId: config.defaults.categoryId,
    staffRoleId: config.defaults.staffRoleId,
    logChannelId: config.defaults.logChannelId,
    panelChannelId: config.defaults.panelChannelId,
    ticketNameFormat: config.defaults.ticketNameFormat,
    embed: { ...config.defaults.embed },
  };
}

function getAllGuildConfigs() {
  return readJson(config.paths.dbFile, {});
}

function getGuildConfig(guildId) {
  const db = getAllGuildConfigs();
  if (!db[guildId]) {
    db[guildId] = makeDefaultGuildConfig(guildId);
    writeJson(config.paths.dbFile, db);
  }
  return db[guildId];
}

function saveGuildConfig(guildId, patch) {
  const db = getAllGuildConfigs();
  const current = db[guildId] || makeDefaultGuildConfig(guildId);
  db[guildId] = {
    ...current,
    ...patch,
    embed: {
      ...current.embed,
      ...(patch.embed || {}),
    },
  };
  writeJson(config.paths.dbFile, db);
  return db[guildId];
}

function getTickets() {
  return readJson(config.paths.ticketFile, {});
}

function setTicket(ticketId, payload) {
  const tickets = getTickets();
  tickets[ticketId] = payload;
  writeJson(config.paths.ticketFile, tickets);
  return tickets[ticketId];
}

function updateTicket(ticketId, patch) {
  const tickets = getTickets();
  if (!tickets[ticketId]) return null;
  tickets[ticketId] = { ...tickets[ticketId], ...patch };
  writeJson(config.paths.ticketFile, tickets);
  return tickets[ticketId];
}

function removeTicket(ticketId) {
  const tickets = getTickets();
  delete tickets[ticketId];
  writeJson(config.paths.ticketFile, tickets);
}

module.exports = {
  getGuildConfig,
  saveGuildConfig,
  getTickets,
  setTicket,
  updateTicket,
  removeTicket,
};
