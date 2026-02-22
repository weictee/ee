const { AttachmentBuilder } = require('discord.js');

function esc(v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function fetchAll(channel) {
  let before;
  const all = [];
  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    all.push(...batch.values());
    before = batch.last().id;
  }
  return all.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

async function buildHtmlTranscript(channel) {
  const messages = await fetchAll(channel);
  const rows = messages
    .map((m) => {
      const ts = new Date(m.createdTimestamp).toLocaleString();
      const atts = m.attachments.size
        ? `<div class="atts">${[...m.attachments.values()]
            .map((a) => `<a href="${esc(a.url)}">${esc(a.name)}</a>`)
            .join(' | ')}</div>`
        : '';
      return `<article><header><strong>${esc(m.author.tag)}</strong> <span>${esc(ts)}</span></header><p>${esc(
        m.content || '[embed/attachment]'
      )}</p>${atts}</article>`;
    })
    .join('\n');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(channel.name)} transcript</title>
  <style>body{font-family:Inter,system-ui;background:#1e1f22;color:#fff;padding:20px}article{background:#2b2d31;padding:12px;border-radius:8px;margin-bottom:10px}header{display:flex;justify-content:space-between;color:#b5bac1}.atts a{color:#88b4ff}</style>
  </head><body><h1>Transcript #${esc(channel.name)}</h1>${rows || '<p>No messages.</p>'}</body></html>`;

  return new AttachmentBuilder(Buffer.from(html, 'utf8'), { name: `${channel.name}-transcript.html` });
}

module.exports = { buildHtmlTranscript };
