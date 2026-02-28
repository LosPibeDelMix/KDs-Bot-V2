const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');
const os = require('os');

// ══════════════════════════════════════════════════
//  ✏️  CAMBIÁ ESTO CON TU INFORMACIÓN PERSONAL
// ══════════════════════════════════════════════════
const CREADOR = {
  nombre:    'Tu Nombre / Alias',        // Tu nombre o alias
  discord:   'tunombre',                 // Tu usuario de Discord (sin @)
  github:    'https://github.com/tu',    // Tu GitHub (o ponés null para ocultarlo)
  youtube:   null,                       // Tu YouTube (o null)
  instagram: null,                       // Tu Instagram (o null)
  version:   '2.0.0',                    // Versión de tu bot
};
// ══════════════════════════════════════════════════

function formatUptime(ms) {
  const totalSeg = Math.floor(ms / 1000);
  const dias  = Math.floor(totalSeg / 86400);
  const horas = Math.floor((totalSeg % 86400) / 3600);
  const mins  = Math.floor((totalSeg % 3600) / 60);
  const segs  = totalSeg % 60;

  const partes = [];
  if (dias  > 0) partes.push(`${dias}d`);
  if (horas > 0) partes.push(`${horas}h`);
  if (mins  > 0) partes.push(`${mins}m`);
  partes.push(`${segs}s`);
  return partes.join(' ');
}

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function barraRam(usada, total) {
  const pct   = usada / total;
  const llena = Math.round(pct * 10);
  return `\`[${'█'.repeat(llena)}${'░'.repeat(10 - llena)}]\` ${Math.round(pct * 100)}%`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Muestra información completa sobre el bot y su creador'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      // ── Estadísticas del bot ──────────────────────
      const uptime       = client.uptime || 0;
      const uptimeStr    = formatUptime(uptime);
      const servidores   = client.guilds.cache.size;
      const totalUsuarios = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);
      const totalComandos = client.commands?.size || 0;
      const ping         = client.ws.ping;

      // ── RAM ──────────────────────────────────────
      const ramTotal  = os.totalmem();
      const ramLibre  = os.freemem();
      const ramUsada  = ramTotal - ramLibre;
      const ramBot    = process.memoryUsage().heapUsed;

      // ── Plataforma ───────────────────────────────
      const plataforma  = `${os.type()} ${os.arch()}`;
      const nodeVersion = process.version;

      // ── Redes sociales del creador ───────────────
      const redes = [];
      if (CREADOR.github)    redes.push(`🐙 [GitHub](${CREADOR.github})`);
      if (CREADOR.youtube)   redes.push(`▶️ [YouTube](${CREADOR.youtube})`);
      if (CREADOR.instagram) redes.push(`📸 [Instagram](${CREADOR.instagram})`);

      // ── Calcular color según ping ─────────────────
      const pingColor = ping < 100 ? config.colors.success
        : ping < 200 ? config.colors.warning
        : config.colors.error;

      const embed = await createEmbed({
        title: `🤖 ${client.user.username} — Bot Info`,
        description: `**Versión:** \`v${CREADOR.version}\`\n**Librería:** discord.js \`v14\``,
        color: pingColor,
        thumbnail: client.user.displayAvatarURL({ dynamic: true, size: 256 }),
        fields: [
            // ── Estadísticas
          {
            name: '📊 Estadísticas',
            value: [
              `🏠 **Servidores:** \`${servidores.toLocaleString('es-ES')}\``,
              `👥 **Usuarios totales:** \`${totalUsuarios.toLocaleString('es-ES')}\``,
              `⚡ **Comandos cargados:** \`${totalComandos}\``,
            ].join('\n'),
            inline: true,
          },

          // ── Rendimiento
          {
            name: '⚡ Rendimiento',
            value: [
              `🏓 **Ping WebSocket:** \`${ping}ms\``,
              `⏱️ **Uptime:** \`${uptimeStr}\``,
            ].join('\n'),
            inline: true,
          },

          // ── Espacio vacío para layout
          { name: '\u200b', value: '\u200b', inline: false },

          // ── RAM Sistema
          {
            name: '💾 RAM del Sistema',
            value: [
              `**Usada:** \`${formatBytes(ramUsada)}\` / \`${formatBytes(ramTotal)}\``,
              barraRam(ramUsada, ramTotal),
            ].join('\n'),
            inline: true,
          },

          // ── RAM Bot
          {
            name: '🤖 RAM del Bot (heap)',
            value: [
              `**Usada:** \`${formatBytes(ramBot)}\``,
              `**Node.js:** \`${nodeVersion}\``,
              `**Plataforma:** \`${plataforma}\``,
            ].join('\n'),
            inline: true,
          },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /botinfo:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};