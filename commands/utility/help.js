const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

// ══════════════════════════════════════════════════════════
//  Definición de categorías con TODOS los comandos actuales
// ══════════════════════════════════════════════════════════
const CATEGORIAS = {
  moderacion: {
    emoji: '🛡️',
    label: 'Moderación',
    descripcionCorta: 'Gestionar miembros del servidor',
    color: '#E74C3C',
    comandos: [
      { nombre: '/ban',        desc: 'Banear a un usuario (con opción de eliminar mensajes)' },
      { nombre: '/unban',      desc: 'Desbanear a un usuario por su ID' },
      { nombre: '/kick',       desc: 'Expulsar a un usuario del servidor' },
      { nombre: '/mute',       desc: 'Silenciar (timeout) a un usuario temporalmente' },
      { nombre: '/unmute',     desc: 'Quitar el silencio a un usuario' },
      { nombre: '/warn',       desc: 'Advertir a un usuario con razón' },
      { nombre: '/warns',      desc: 'Ver advertencias de un usuario (con paginación)' },
      { nombre: '/clearwarns', desc: 'Limpiar todas las advertencias de un usuario' },
      { nombre: '/clear',      desc: 'Borrar mensajes del canal (1–100, filtro por usuario)' },
      { nombre: '/nuke',       desc: '☢️ Eliminar TODOS los mensajes clonando el canal' },
    ],
  },

  informacion: {
    emoji: '📋',
    label: 'Información',
    descripcionCorta: 'Obtener información de usuarios y servidor',
    color: '#3498DB',
    comandos: [
      { nombre: '/userinfo',    desc: 'Ver información detallada de un usuario' },
      { nombre: '/serverinfo',  desc: 'Ver información detallada del servidor' },
      { nombre: '/avatar',      desc: 'Ver el avatar de un usuario en alta calidad' },
      { nombre: '/serveravatar',desc: 'Ver el avatar/ícono del servidor' },
      { nombre: '/botinfo',     desc: 'Ver estadísticas del bot, RAM, uptime y creador' },
      { nombre: '/ipshow',      desc: 'Mostrar la IP pública del servidor' },
    ],
  },

  ip: {
    emoji: '🔒',
    label: 'Gestión de IPs',
    descripcionCorta: 'Bloquear y gestionar IPs baneadas',
    color: '#C0392B',
    comandos: [
      { nombre: '/banip',   desc: 'Banear una dirección IP del servidor' },
      { nombre: '/unbanip', desc: 'Desbanear una dirección IP bloqueada' },
    ],
  },

  utilidad: {
    emoji: '🔧',
    label: 'Utilidades',
    descripcionCorta: 'Herramientas útiles para el servidor',
    color: '#2ECC71',
    comandos: [
      { nombre: '/embed',  desc: 'Crear un embed personalizado en cualquier canal' },
      { nombre: '/say',    desc: 'Hacer que el bot envíe un mensaje' },
      { nombre: '/ping',   desc: 'Ver latencia del bot (WebSocket + respuesta)' },
      { nombre: '/help',   desc: 'Mostrar este menú de ayuda' },
    ],
  },

  tickets: {
    emoji: '🎫',
    label: 'Tickets',
    descripcionCorta: 'Sistema de soporte por tickets',
    color: '#9B59B6',
    comandos: [
      { nombre: '/ticket',      desc: 'Abrir un ticket de soporte privado' },
      { nombre: '/closeticket', desc: 'Cerrar el ticket actual' },
      { nombre: '/setlog',      desc: 'Configurar el canal de logs del servidor' },
      { nombre: '/removelog',   desc: 'Quitar el canal de logs configurado' },
    ],
  },

  diversion: {
    emoji: '🎉',
    label: 'Diversión',
    descripcionCorta: 'Comandos para animar el servidor',
    color: '#FF1493',
    comandos: [
      { nombre: '/meme',   desc: 'Obtener un meme aleatorio' },
      { nombre: '/love',   desc: 'Calcular compatibilidad de amor entre dos personas' },
      { nombre: '/pp',     desc: 'El clásico... ya sabés 👀' },
      { nombre: '/beso',   desc: 'Enviar un beso a alguien' },
      { nombre: '/abrazo', desc: 'Darle un abrazo a alguien' },
    ],
  },
};

// ══════════════════════════════════════════════════════════
//  Helpers para construir embeds y componentes
// ══════════════════════════════════════════════════════════
async function buildMainEmbed(client, interaction) {
  const totalComandos = Object.values(CATEGORIAS).reduce((a, c) => a + c.comandos.length, 0);

  const fields = Object.values(CATEGORIAS).map(cat => ({
    name: `${cat.emoji} ${cat.label.toUpperCase()} (${cat.comandos.length})`,
    value: cat.comandos.map(cmd => `\`${cmd.nombre}\``).join(' '),
    inline: false,
  }));

  fields.push({
    name: '💡 ¿Cómo usar?',
    value: 'Seleccioná una categoría en el menú de abajo para ver la descripción de cada comando.',
    inline: false,
  });

  return createEmbed({
    title: `📋 Centro de Ayuda — ${client.user.username}`,
    description: `Tengo **${totalComandos} comandos** divididos en **${Object.keys(CATEGORIAS).length} categorías**.\n\u200b`,
    color: config.colors.utility,
    fields,
    thumbnail: interaction.guild.iconURL({ dynamic: true, size: 256 }),
    client,
  });
}

async function buildCategoryEmbed(key, client) {
  const cat = CATEGORIAS[key];

  const fields = cat.comandos.map(cmd => ({
    name: cmd.nombre,
    value: cmd.desc,
    inline: false,
  }));

  return createEmbed({
    title: `${cat.emoji} ${cat.label}`,
    description: `_${cat.descripcionCorta}_\n\u200b`,
    color: cat.color,
    fields,
    client,
  });
}

function buildSelectMenu(categoriaActual = null) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_select')
      .setPlaceholder('📂 Seleccioná una categoría...')
      .addOptions(
        Object.entries(CATEGORIAS).map(([key, cat]) => ({
          label: `${cat.emoji}  ${cat.label}`,
          description: `${cat.comandos.length} comandos — ${cat.descripcionCorta}`,
          value: key,
          default: key === categoriaActual,
        }))
      )
  );
}

function buildButtonRow(categoriaActual) {
  const keys = Object.keys(CATEGORIAS);
  const idx  = keys.indexOf(categoriaActual);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_prev')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx <= 0 || categoriaActual === null),
    new ButtonBuilder()
      .setCustomId('help_home')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(categoriaActual === null),
    new ButtonBuilder()
      .setCustomId('help_next')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx >= keys.length - 1 || categoriaActual === null),
  );
}

// ══════════════════════════════════════════════════════════
//  Comando
// ══════════════════════════════════════════════════════════
module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles del bot'),

  async execute(interaction, client) {
    try {
      const mainEmbed = await buildMainEmbed(client, interaction);
      const selectRow = buildSelectMenu();
      const buttonRow = buildButtonRow(null);

      const reply = await interaction.reply({
        embeds: [mainEmbed],
        components: [selectRow, buttonRow],
        fetchReply: true,
      });

      let categoriaActual = null;
      const keys = Object.keys(CATEGORIAS);

      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 120_000,
      });

      collector.on('collect', async i => {
        try {
          // ── Select menu ──────────────────────────
          if (i.customId === 'help_select') {
            categoriaActual = i.values[0];
            const catEmbed = await buildCategoryEmbed(categoriaActual, client);
            return await i.update({
              embeds: [catEmbed],
              components: [buildSelectMenu(categoriaActual), buildButtonRow(categoriaActual)],
            });
          }

          // ── Botón inicio ─────────────────────────
          if (i.customId === 'help_home') {
            categoriaActual = null;
            const homeEmbed = await buildMainEmbed(client, interaction);
            return await i.update({
              embeds: [homeEmbed],
              components: [buildSelectMenu(), buildButtonRow(null)],
            });
          }

          // ── Botones anterior / siguiente ─────────
          if (i.customId === 'help_prev' || i.customId === 'help_next') {
            const idx = keys.indexOf(categoriaActual);
            categoriaActual = i.customId === 'help_prev'
              ? keys[Math.max(0, idx - 1)]
              : keys[Math.min(keys.length - 1, idx + 1)];

            const catEmbed = await buildCategoryEmbed(categoriaActual, client);
            return await i.update({
              embeds: [catEmbed],
              components: [buildSelectMenu(categoriaActual), buildButtonRow(categoriaActual)],
            });
          }
        } catch (err) {
          console.error('Error en interacción /help:', err);
        }
      });

      // Al expirar, deshabilitar todo
      collector.on('end', async () => {
        const disabledSelect = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_select_disabled')
            .setPlaceholder('⏱️ Menú expirado — usá /help de nuevo')
            .setDisabled(true)
            .addOptions([{ label: 'Expirado', value: 'expired' }])
        );
        const disabledButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('x1').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('x2').setEmoji('🏠').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId('x3').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        );
        await interaction.editReply({ components: [disabledSelect, disabledButtons] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error en comando /help:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};