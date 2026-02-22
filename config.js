const path = require('path');
require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    oauth: {
      clientId: process.env.OAUTH_CLIENT_ID || process.env.CLIENT_ID || '',
      clientSecret: process.env.OAUTH_CLIENT_SECRET || '',
      redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
      scopes: ['identify', 'guilds'],
    },
  },
  app: {
    port: Number(process.env.PORT || 3000),
    sessionSecret: process.env.SESSION_SECRET || 'change_me_session_secret',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  defaults: {
    staffRoleId: process.env.STAFF_ROLE_ID || '',
    categoryId: process.env.CATEGORY_ID || '',
    logChannelId: process.env.LOG_CHANNEL_ID || '',
    ticketNameFormat: process.env.TICKET_NAME_FORMAT || 'ticket-{username}',
    panelChannelId: process.env.PANEL_CHANNEL_ID || '',
    embed: {
      title: '🎫 Ticket Center',
      description:
        '• Vui lòng đọc chính sách trước khi trao đổi.\n• Hỗ trợ mua hàng và bảo hành nhanh chóng.\n• Hãy mô tả vấn đề rõ ràng, lịch sự.',
      color: '#5865F2',
      authorName: 'Support Team',
      authorIcon: '',
      footerText: 'Powered by GPT Ticket Suite',
      footerIcon: '',
      bannerUrl: '',
      thumbnailUrl: '',
    },
    categories: [
      { id: 'buy', label: '🛒 Mua hàng', description: 'Tư vấn mua hàng', emoji: '🛒' },
      { id: 'warranty', label: '🐰 Bảo hành', description: 'Hỗ trợ bảo hành', emoji: '🐰' },
      { id: 'support', label: '🆘 Hỗ trợ', description: 'Hỗ trợ chung', emoji: '🆘' },
    ],
  },
  paths: {
    dbFile: path.join(__dirname, 'database', 'data', 'guild-configs.json'),
    ticketFile: path.join(__dirname, 'database', 'data', 'tickets.json'),
  },
};
