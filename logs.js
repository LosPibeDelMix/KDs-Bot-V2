const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'guild-config.json');

// ══════════════════════════════════════════
//  Config del servidor
// ══════════════════════════════════════════
function loadGuildConfig() {
  try {
    if (fs.existsSync(configPath)) return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) { console.error('Error cargando guild-config.json:', e); }
  return {};
}

function saveGuildConfig(data) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) { console.error('Error guardando guild-config.json:', e); }
}

function getLogChannel(guildId) {
  return loadGuildConfig()[guildId]?.logChannelId || null;
}

function setLogChannel(guildId, channelId) {
  const cfg = loadGuildConfig();
  if (!cfg[guildId]) cfg[guildId] = {};
  cfg[guildId].logChannelId = channelId;
  saveGuildConfig(cfg);
}

function removeLogChannel(guildId) {
  const cfg = loadGuildConfig();
  if (cfg[guildId]) {
    delete cfg[guildId].logChannelId;
    if (Object.keys(cfg[guildId]).length === 0) delete cfg[guildId];
    saveGuildConfig(cfg);
  }
}

// ══════════════════════════════════════════
//  Función base de log
// ══════════════════════════════════════════
async function logAction(client, guild, options = {}) {
  try {
    const logChannelId = getLogChannel(guild.id);
    if (!logChannelId) return;

    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(options.color || config.colors.moderation)
      .setTitle(options.title || 'Acción de Moderación')
      .setTimestamp();

    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail)   embed.setThumbnail(options.thumbnail);

    if (options.fields?.length > 0) {
      options.fields.forEach(f => embed.addFields(f));
    }

    if (options.user) {
      embed.addFields({
        name: '👤 Usuario Afectado',
        value: `<@${options.user.id}> — \`${options.user.tag}\`\n\`ID: ${options.user.id}\``,
        inline: true,
      });
    }

    if (options.moderator) {
      embed.addFields({
        name: '🛡️ Moderador',
        value: `<@${options.moderator.id}> — \`${options.moderator.tag}\``,
        inline: true,
      });
    }

    if (options.reason) {
      embed.addFields({ name: '📋 Razón', value: options.reason, inline: false });
    }

    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error al enviar log:', error);
  }
}

// ══════════════════════════════════════════
//  MODERACIÓN (existentes mejorados)
// ══════════════════════════════════════════
async function logBan(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '🔨 Usuario Baneado',
    color: '#E74C3C',
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '⏰ Tipo', value: '`Ban Permanente`', inline: true }],
    user, moderator, reason,
  });
}

async function logUnban(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '✅ Usuario Desbaneado',
    color: config.colors.success,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '⏰ Tipo', value: '`Desbaneo`', inline: true }],
    user, moderator, reason,
  });
}

async function logKick(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '👢 Usuario Expulsado',
    color: '#E67E22',
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '⏰ Tipo', value: '`Kick`', inline: true }],
    user, moderator, reason,
  });
}

async function logMute(client, guild, user, moderator, duration, reason) {
  await logAction(client, guild, {
    title: '🔇 Usuario Muteado',
    color: '#F39C12',
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '⏱️ Duración', value: `\`${duration}\``, inline: true }],
    user, moderator, reason,
  });
}

async function logUnmute(client, guild, user, moderator, reason) {
  await logAction(client, guild, {
    title: '🔊 Usuario Desmuteado',
    color: config.colors.success,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '⏰ Tipo', value: '`Desmuteado`', inline: true }],
    user, moderator, reason,
  });
}

async function logWarn(client, guild, user, moderator, reason, totalWarns, maxWarns) {
  const barra = '█'.repeat(Math.round((totalWarns / maxWarns) * 10)) + '░'.repeat(10 - Math.round((totalWarns / maxWarns) * 10));
  await logAction(client, guild, {
    title: '⚠️ Usuario Advertido',
    color: '#F39C12',
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [
      { name: '📊 Warns', value: `\`${totalWarns}/${maxWarns}\``, inline: true },
      { name: '📈 Progreso', value: `\`[${barra}]\``, inline: true },
    ],
    user, moderator, reason,
  });
}

async function logClearWarns(client, guild, user, moderator, reason, previousCount) {
  await logAction(client, guild, {
    title: '🧹 Warns Eliminados',
    color: config.colors.success,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [{ name: '📊 Warns eliminados', value: `\`${previousCount}\``, inline: true }],
    user, moderator, reason,
  });
}

async function logClear(client, guild, channel, moderator, cantidad, usuarioFiltro) {
  await logAction(client, guild, {
    title: '🗑️ Mensajes Eliminados',
    color: '#95A5A6',
    fields: [
      { name: '📢 Canal', value: `${channel}`, inline: true },
      { name: '🗑️ Cantidad', value: `\`${cantidad} mensaje(s)\``, inline: true },
      { name: '🔍 Filtro usuario', value: usuarioFiltro ? `\`${usuarioFiltro.tag}\`` : '`Ninguno`', inline: true },
    ],
    moderator,
  });
}

async function logNuke(client, guild, channel, moderator, reason) {
  await logAction(client, guild, {
    title: '☢️ Canal Nukeado',
    color: '#E74C3C',
    description: `> El canal **#${channel.name}** fue nukeado y todos sus mensajes eliminados.`,
    fields: [
      { name: '📢 Canal afectado', value: `\`#${channel.name}\``, inline: true },
    ],
    moderator, reason,
  });
}

// ══════════════════════════════════════════
//  IPs
// ══════════════════════════════════════════
async function logBanIP(client, guild, ip, moderator, reason) {
  await logAction(client, guild, {
    title: '🚫 IP Baneada',
    color: config.colors.ip,
    fields: [{ name: '🌐 Dirección IP', value: `\`${ip}\``, inline: true }],
    moderator, reason,
  });
}

async function logUnbanIP(client, guild, ip, moderator, reason) {
  await logAction(client, guild, {
    title: '✅ IP Desbaneada',
    color: config.colors.success,
    fields: [{ name: '🌐 Dirección IP', value: `\`${ip}\``, inline: true }],
    moderator, reason,
  });
}

// ══════════════════════════════════════════
//  TICKETS
// ══════════════════════════════════════════
async function logTicketCreated(client, guild, user, ticketChannel, reason) {
  await logAction(client, guild, {
    title: '🎫 Ticket Creado',
    color: config.colors.utility,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    fields: [
      { name: '📌 Canal', value: `${ticketChannel}`, inline: true },
      { name: '📋 Asunto', value: reason || 'Sin especificar', inline: false },
    ],
    user,
  });
}

async function logTicketClosed(client, guild, user, ticketChannel, closedBy, reason) {
  await logAction(client, guild, {
    title: '🎫 Ticket Cerrado',
    color: '#E67E22',
    thumbnail: user?.displayAvatarURL({ dynamic: true }),
    fields: [
      { name: '📌 Canal', value: `\`${ticketChannel.name}\``, inline: true },
      { name: '🔒 Cerrado por', value: `<@${closedBy.id}> — \`${closedBy.tag}\``, inline: true },
      { name: '📋 Razón', value: reason || 'Sin especificar', inline: false },
    ],
    user,
  });
}

// ══════════════════════════════════════════
//  🆕 INGRESO DE MIEMBROS
// ══════════════════════════════════════════
async function logMemberJoin(client, guild, member) {
  try {
    const logChannelId = getLogChannel(guild.id);
    if (!logChannelId) return;
    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return;

    const cuentaMs  = Date.now() - member.user.createdTimestamp;
    const diasCuenta = Math.floor(cuentaMs / (1000 * 60 * 60 * 24));
    const cuentaNueva = diasCuenta < 7;

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle('📥 Nuevo Miembro')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👤 Usuario',
          value: `<@${member.user.id}> — \`${member.user.tag}\`\n\`ID: ${member.user.id}\``,
          inline: false,
        },
        {
          name: '📅 Cuenta creada',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\`${diasCuenta} día(s) de antigüedad\``,
          inline: true,
        },
        {
          name: '👥 Miembro N°',
          value: `\`${guild.memberCount}\``,
          inline: true,
        },
        {
          name: cuentaNueva ? '⚠️ Cuenta nueva' : '✅ Cuenta verificada',
          value: cuentaNueva
            ? '`Esta cuenta tiene menos de 7 días. Posible alt/bot.`'
            : '`Cuenta con antigüedad normal.`',
          inline: false,
        },
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Error en logMemberJoin:', e);
  }
}

// ══════════════════════════════════════════
//  🆕 SALIDA DE MIEMBROS
// ══════════════════════════════════════════
async function logMemberLeave(client, guild, member) {
  try {
    const logChannelId = getLogChannel(guild.id);
    if (!logChannelId) return;
    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return;

    // Verificar si fue kickeado (revisando el audit log)
    let fueKick = false;
    let kickedBy = null;
    try {
      const auditLogs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 });
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === member.user.id && (Date.now() - entry.createdTimestamp) < 5000) {
        fueKick = true;
        kickedBy = entry.executor;
      }
    } catch (_) {}

    const roles = member.roles.cache
      .filter(r => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map(r => `<@&${r.id}>`)
      .slice(0, 5);

    const embed = new EmbedBuilder()
      .setColor(fueKick ? '#E67E22' : '#95A5A6')
      .setTitle(fueKick ? '👢 Miembro Expulsado (Kick)' : '📤 Miembro Salió')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        {
          name: '👤 Usuario',
          value: `\`${member.user.tag}\`\n\`ID: ${member.user.id}\``,
          inline: false,
        },
        {
          name: '📅 Entró al servidor',
          value: member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
            : '`Desconocido`',
          inline: true,
        },
        {
          name: '👥 Miembros restantes',
          value: `\`${guild.memberCount}\``,
          inline: true,
        },
        {
          name: '🎭 Roles que tenía',
          value: roles.length > 0 ? roles.join(' ') : '`Sin roles`',
          inline: false,
        },
        ...(fueKick && kickedBy ? [{
          name: '🛡️ Expulsado por',
          value: `<@${kickedBy.id}> — \`${kickedBy.tag}\``,
          inline: false,
        }] : []),
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Error en logMemberLeave:', e);
  }
}

// ══════════════════════════════════════════
//  🆕 USO DE COMANDOS
// ══════════════════════════════════════════
async function logCommandUsed(client, guild, interaction) {
  try {
    const logChannelId = getLogChannel(guild.id);
    if (!logChannelId) return;
    const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return;

    // Armar opciones usadas
    const opciones = interaction.options?.data?.map(opt => {
      const val = opt.value ?? `[${opt.type}]`;
      return `\`${opt.name}:\` ${val}`;
    }) || [];

    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('⚡ Comando Ejecutado')
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '💬 Comando',
          value: `\`/${interaction.commandName}\``,
          inline: true,
        },
        {
          name: '👤 Ejecutado por',
          value: `<@${interaction.user.id}> — \`${interaction.user.tag}\``,
          inline: true,
        },
        {
          name: '📢 Canal',
          value: `<#${interaction.channelId}>`,
          inline: true,
        },
        ...(opciones.length > 0 ? [{
          name: '⚙️ Opciones usadas',
          value: opciones.join('\n'),
          inline: false,
        }] : []),
      )
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });
  } catch (e) {
    console.error('Error en logCommandUsed:', e);
  }
}

module.exports = {
  logAction,
  getLogChannel,
  setLogChannel,
  removeLogChannel,
  logBan,
  logUnban,
  logKick,
  logMute,
  logUnmute,
  logWarn,
  logClearWarns,
  logClear,
  logNuke,
  logBanIP,
  logUnbanIP,
  logTicketCreated,
  logTicketClosed,
  logMemberJoin,
  logMemberLeave,
  logCommandUsed,
};