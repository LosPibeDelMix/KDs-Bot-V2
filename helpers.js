const { EmbedBuilder } = require('discord.js');
const config = require('./config');

let creatorCache = null;

async function createEmbed(options = {}) {
  const {
    title,
    description,
    color = config.colors.info,
    fields = [],
    image,
    thumbnail,
    footer,
    timestamp = true,
    client,
  } = options;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTimestamp(timestamp ? new Date() : null);

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (fields.length > 0) fields.forEach(field => embed.addFields(field));

  if (footer) {
    embed.setFooter(footer);
  } else if (client && process.env.USER_ID) {
    const footerData = await getCreatorFooter(client);
    if (footerData) embed.setFooter(footerData);
  }

  return embed;
}

async function getCreatorFooter(client) {
  try {
    if (!process.env.USER_ID) return null;
    if (creatorCache) return creatorCache;
    const user = await client.users.fetch(process.env.USER_ID);
    creatorCache = {
      text: `Hecho por ${user.username}`,
      iconURL: user.displayAvatarURL({ size: 256 }),
    };
    return creatorCache;
  } catch (error) {
    console.error('Error fetching creator footer:', error);
    return null;
  }
}

function validateModerationAction(moderator, target, guild) {
  if (!target) return { valid: false, message: config.messages.userNotFound };
  if (target.id === guild.ownerId) return { valid: false, message: config.messages.ownerProtected };
  if (moderator.id === target.id) return { valid: false, message: config.messages.selfAction };
  if (target.roles.highest.position >= moderator.roles.highest.position) {
    return { valid: false, message: config.messages.memberModerable };
  }
  return { valid: true, message: null };
}

function canBotBan(target) {
  return target?.bannable ?? false;
}

function canBotMute(target) {
  return target?.moderatable ?? false;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function minutesToMs(minutes) {
  return minutes * 60 * 1000;
}

async function createErrorEmbed(message) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.error)
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();
  return embed;
}

async function createSuccessEmbed(title, description) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.success)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  return embed;
}

async function replyError(interaction, message, ephemeral = true) {
  const embed = await createErrorEmbed(message);
  const reply = { embeds: [embed], flags: ephemeral ? 64 : undefined };
  if (interaction.replied || interaction.deferred) {
    return await interaction.followUp(reply);
  }
  return await interaction.reply(reply);
}

function getBotPing(client) {
  return client.ws.ping;
}

module.exports = {
  createEmbed,
  getCreatorFooter,
  validateModerationAction,
  canBotBan,
  canBotMute,
  formatTime,
  minutesToMs,
  createErrorEmbed,
  createSuccessEmbed,
  replyError,
  getBotPing,
};