const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

const categorias = {
  moderacion: {
    emoji: '🛡️',
    label: 'Moderación',
    description: 'Comandos de moderación del servidor',
    value: '/ban /unban /kick /mute /unmute /warn /warns /clearwarns /clear /nuke',
    detalle: '`/ban` — Banear usuario\n`/unban` — Desbanear usuario\n`/kick` — Expulsar usuario\n`/mute` — Silenciar usuario (timeout)\n`/unmute` — Quitar silencio\n`/warn` — Advertir usuario\n`/warns` — Ver advertencias\n`/clearwarns` — Limpiar advertencias\n`/clear` — Borrar mensajes\n`/nuke` ☢️ — Borrar todos los mensajes del canal',
    color: config.colors.moderation,
  },
  info: {
    emoji: '👤',
    label: 'Información',
    description: 'Comandos de información',
    value: '/userinfo /serverinfo /avatar /serveravatar /ipshow',
    detalle: '`/userinfo` — Info de un usuario\n`/serverinfo` — Info del servidor\n`/avatar` — Ver avatar de usuario\n`/serveravatar` — Ver avatar del servidor\n`/ipshow` — Mostrar IP pública',
    color: config.colors.info,
  },
  ip: {
    emoji: '🚫',
    label: 'Gestión de IPs',
    description: 'Comandos de IPs baneadas',
    value: '/banip /unbanip',
    detalle: '`/banip` — Banear una IP\n`/unbanip` — Desbanear una IP',
    color: config.colors.ip,
  },
  utilidad: {
    emoji: '🔧',
    label: 'Utilidades',
    description: 'Herramientas útiles',
    value: '/embed /say /ping /help',
    detalle: '`/embed` — Crear un embed personalizado\n`/say` — Hacer hablar al bot\n`/ping` — Ver latencia del bot\n`/help` — Ver esta ayuda',
    color: config.colors.utility,
  },
  diversion: {
    emoji: '🎉',
    label: 'Diversión',
    description: 'Comandos divertidos',
    value: '/meme /love /pp /beso /abrazo',
    detalle: '`/meme` — Meme aleatorio\n`/love` — Compatibilidad de amor\n`/pp` — ... ya sabes 👀\n`/beso` — Enviar un beso\n`/abrazo` — Dar un abrazo',
    color: config.colors.fun,
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles del bot'),

  async execute(interaction, client) {
    try {
      const mainEmbed = await createEmbed({
        title: '📋 Centro de Ayuda',
        description: `Bienvenido al centro de ayuda de **${client.user.username}**!\nSelecciona una categoría en el menú de abajo para ver sus comandos.`,
        color: config.colors.utility,
        fields: Object.values(categorias).map(cat => ({
          name: `${cat.emoji} ${cat.label}`,
          value: `\`\`${cat.value}\`\``,
          inline: false,
        })),
        thumbnail: interaction.guild.iconURL({ dynamic: true, size: 256 }),
        client,
      });

      const menu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_menu')
          .setPlaceholder('📂 Selecciona una categoría...')
          .addOptions(
            Object.entries(categorias).map(([key, cat]) => ({
              label: `${cat.emoji} ${cat.label}`,
              description: cat.description,
              value: key,
            }))
          )
      );

      const reply = await interaction.reply({ embeds: [mainEmbed], components: [menu], fetchReply: true });

      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId === 'help_menu',
        time: 60000,
      });

      collector.on('collect', async i => {
        const cat = categorias[i.values[0]];
        const catEmbed = await createEmbed({
          title: `${cat.emoji} ${cat.label}`,
          description: cat.detalle,
          color: cat.color,
          client,
        });
        await i.update({ embeds: [catEmbed], components: [menu] });
      });

      collector.on('end', async () => {
        const disabledMenu = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('help_menu_disabled')
            .setPlaceholder('⏱️ Menú expirado — usa /help de nuevo')
            .setDisabled(true)
            .addOptions([{ label: 'Expirado', value: 'expired' }])
        );
        await interaction.editReply({ components: [disabledMenu] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error en comando /help:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};