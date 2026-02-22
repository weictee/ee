const express = require('express');
const config = require('../../config');

const router = express.Router();

router.get('/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: config.discord.oauth.clientId,
    redirect_uri: config.discord.oauth.redirectUri,
    response_type: 'code',
    scope: config.discord.oauth.scopes.join(' '),
    prompt: 'consent',
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

router.get('/auth/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.redirect('/');

    const body = new URLSearchParams({
      client_id: config.discord.oauth.clientId,
      client_secret: config.discord.oauth.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.discord.oauth.redirectUri,
    });

    const tokenResp = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const tokenData = await tokenResp.json();

    const meResp = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await meResp.json();

    const guildResp = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildResp.json();

    req.session.user = user;
    req.session.guilds = (guilds || []).filter((g) => (BigInt(g.permissions) & BigInt(0x20)) === BigInt(0x20));
    req.session.accessToken = tokenData.access_token;
    res.redirect('/dashboard/servers');
  } catch (err) {
    console.error(err);
    res.status(500).send('OAuth failed');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

module.exports = router;
