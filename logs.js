const { EmbedBuilder } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'guild-config.json');

function loadGuildConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error cargando guild-config.json:', error);
  }
  return {};
}

function saveGuildConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error guardando guild-config.json:', error);
  }
}

function getLogChannel(guildId) {
  const guildConfigs = loadGuildConfig();
  return guildConfigs[guildId]?.logChannelId || null;
}

function setLogChannel(guildId, channelId) {
  const guildConfigs = loadGuildConfig();
  if (!guildConfigs[guildId]) guildConfigs[guildId] = {};
  guildConfigs[guildId].logChannelId = channelId;
  saveGuildConfig(guildConfigs);
}

function removeLogChannel(guildId) {
  const guildConfigs = loadGuildConfig();
  if (guildConfigs[guildId]) {
    delete guildConfigs[guildId].logChannelId;
    if (Object.keys(guildConfigs[guildId]).length === 0) delete guildConfigs[guildId];
    saveGuildConfig(guildConfigs);
  }
}

async function logAction(client, guild, options = {}) {
  try {
    const logChannelId = getLogChannel(guild.id);
    if (!logChannelId) return;

    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(options.color || config.colors.moderation)
      .setTitle(options.title || 'Accion de Moderacion')
      .setTimestamp(new Date());

    if (options.fields?.length > 0) {
      options.fields.forEach(field => embed.addFields(field));
    }

    if (options.user) {
      embed.addFields({ 
        name: '👤 Usuario Afectado', 
        value: `${options.user.tag} (${options.user.id})`, 
        inline: true 
      });
    }

    if (options.moderator) {
      embed.addFields({ 
        name: '🛡️ Moderador', 
        value: `${options.moderator.tag} (${options.moderator.id})`, 
        inline: true 
      });
    }

    if (options.reason) {
      embed.addFields({ 
        name: '📋 Razon', 
        value: options.reason, 
        inline: false 
      });
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error al enviar log:', error);
  }
}

async function logBan(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '🔨 Usuario Baneado',
    color: config.colors.moderation,
    fields: [{ name: '⏰ Tipo', value: 'Ban Permanente', inline: true }],
    user, moderator, reason,
  });
}

async function logUnban(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '✅ Usuario Desbaneado',
    color: config.colors.success,
    fields: [{ name: '⏰ Tipo', value: 'Desbaneo', inline: true }],
    user, moderator, reason,
  });
}

async function logMute(client, guild, user, moderator, duration, reason) {
  await logAction(client, guild, {
    title: '🔇 Usuario Muteado',
    color: config.colors.moderation,
    fields: [{ name: '⏱️ Duracion', value: duration, inline: true }],
    user, moderator, reason,
  });
}

async function logUnmute(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '🔊 Usuario Desmuteado',
    color: config.colors.success,
    fields: [{ name: '⏰ Tipo', value: 'Desmuteado', inline: true }],
    user, moderator, reason,
  });
}

async function logWarn(client, guild, user, moderator, reason, totalWarns, maxWarns) {
  await logAction(client, guild, {
    title: '⚠️ Usuario Advertido',
    color: config.colors.warning,
    fields: [{ name: '📊 Warns', value: `${totalWarns}/${maxWarns}`, inline: true }],
    user, moderator, reason,
  });
}

async function logClearWarns(client, guild, user, moderator, reason, previousCount) {
  await logAction(client, guild, {
    title: '🧹 Warns Eliminados',
    color: config.colors.success,
    fields: [{ name: '📊 Warns Eliminados', value: `${previousCount}`, inline: true }],
    user, moderator, reason,
  });
}

async function logBanIP(client, guild, ip, moderator, reason) {
  await logAction(client, guild, {
    title: '🚫 IP Baneada',
    color: config.colors.ip,
    fields: [{ name: '🌐 Direccion IP', value: `\`${ip}\``, inline: true }],
    moderator, reason,
  });
}

async function logUnbanIP(client, guild, ip, moderator, reason) {
  await logAction(client, guild, {
    title: '✅ IP Desbaneada',
    color: config.colors.success,
    fields: [{ name: '🌐 Direccion IP', value: `\`${ip}\``, inline: true }],
    moderator, reason,
  });
}

async function logTicketCreated(client, guild, user, ticketChannel, reason) {
  await logAction(client, guild, {
    title: '🎫 Ticket Creado',
    color: config.colors.utility,
    fields: [
      { name: '📌 Canal', value: ticketChannel.toString(), inline: true },
      { name: '📋 Asunto', value: reason || 'Sin especificar', inline: false }
    ],
    user,
  });
}

async function logTicketClosed(client, guild, user, ticketChannel, closedBy, reason) {
  await logAction(client, guild, {
    title: '🎫 Ticket Cerrado',
    color: config.colors.warning,
    fields: [
      { name: '📌 Canal', value: `${ticketChannel.name}`, inline: true },
      { name: '👤 Cerrado por', value: `${closedBy.tag}`, inline: true },
      { name: '📋 Razon', value: reason || 'Sin especificar', inline: false }
    ],
    user,
  });
}

module.exports = {
  logAction,
  logBan,
  logUnban,
  logMute,
  logUnmute,
  logWarn,
  logClearWarns,
  logBanIP,
  logUnbanIP,
  logTicketCreated,
  logTicketClosed,
  getLogChannel,
  setLogChannel,
  removeLogChannel,
};