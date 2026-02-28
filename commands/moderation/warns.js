const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

const WARNS_POR_PAGINA = 3;

function buildWarnsEmbed(user, userWarns, pagina, totalPaginas, client) {
  const inicio = pagina * WARNS_POR_PAGINA;
  const fin    = inicio + WARNS_POR_PAGINA;
  const slice  = userWarns.slice(inicio, fin);

  const fields = slice.map((warn, i) => ({
    name: `⚠️ Warn #${inicio + i + 1}`,
    value: [
      `📋 **Razón:** ${warn.reason}`,
      `🛡️ **Moderador:** ${warn.moderator}`,
      `📅 **Fecha:** ${new Date(warn.date).toLocaleDateString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })}`,
    ].join('\n'),
    inline: false,
  }));

  // Barra de progreso visual
  const porcentaje  = userWarns.length / config.warnSystem.maxWarns;
  const barraTotal  = 10;
  const barraLlena  = Math.round(porcentaje * barraTotal);
  const barra       = '█'.repeat(barraLlena) + '░'.repeat(barraTotal - barraLlena);

  const estado = userWarns.length >= config.warnSystem.maxWarns
    ? '🚫 **MÁXIMO ALCANZADO** — Elegible para ban automático'
    : userWarns.length === config.warnSystem.maxWarns - 1
      ? `🟡 **Último aviso** — 1 warn más = ban automático`
      : `✅ Faltan **${config.warnSystem.maxWarns - userWarns.length}** warn(s) para ban automático`;

  return createEmbed({
    title: `⚠️ Warns de ${user.username}`,
    description: [
      `**Total:** \`${userWarns.length}/${config.warnSystem.maxWarns}\``,
      `\`[${barra}]\` ${Math.round(porcentaje * 100)}%`,
      `\n${estado}`,
    ].join('\n'),
    color: userWarns.length >= config.warnSystem.maxWarns
      ? config.colors.error
      : userWarns.length >= config.warnSystem.maxWarns - 1
        ? config.colors.warning
        : config.colors.info,
    fields,
    thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
    footer: {
      text: `Página ${pagina + 1} de ${totalPaginas} • ${userWarns.length} warn(s) en total`,
    },
    client,
  });
}

function buildButtons(pagina, totalPaginas) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('warns_first')
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === 0),
    new ButtonBuilder()
      .setCustomId('warns_prev')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pagina === 0),
    new ButtonBuilder()
      .setCustomId('warns_page')
      .setLabel(`${pagina + 1} / ${totalPaginas}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('warns_next')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pagina === totalPaginas - 1),
    new ButtonBuilder()
      .setCustomId('warns_last')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(pagina === totalPaginas - 1),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra las advertencias de un usuario con paginación')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario (por defecto tú mismo)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const user     = interaction.options.getUser('usuario') || interaction.user;
      const warnKey  = `${interaction.guild.id}-${user.id}`;
      const userWarns = client.warns.get(warnKey) || [];

      // Sin warns
      if (userWarns.length === 0) {
        const embed = await createEmbed({
          title: '✅ Sin Advertencias',
          description: `**${user.username}** no tiene ninguna advertencia registrada. ¡Sigue así! 🎉`,
          color: config.colors.success,
          thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
          client,
        });
        return await interaction.editReply({ embeds: [embed] });
      }

      // Calcular páginas
      let pagina      = 0;
      const totalPaginas = Math.ceil(userWarns.length / WARNS_POR_PAGINA);

      const embed   = await buildWarnsEmbed(user, userWarns, pagina, totalPaginas, client);
      const buttons = buildButtons(pagina, totalPaginas);

      const components = totalPaginas > 1 ? [buttons] : [];
      const reply = await interaction.editReply({ embeds: [embed], components });

      // Si solo hay 1 página no hace falta collector
      if (totalPaginas <= 1) return;

      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 90_000,
      });

      collector.on('collect', async i => {
        switch (i.customId) {
          case 'warns_first': pagina = 0; break;
          case 'warns_prev':  pagina = Math.max(0, pagina - 1); break;
          case 'warns_next':  pagina = Math.min(totalPaginas - 1, pagina + 1); break;
          case 'warns_last':  pagina = totalPaginas - 1; break;
        }

        const newEmbed   = await buildWarnsEmbed(user, userWarns, pagina, totalPaginas, client);
        const newButtons = buildButtons(pagina, totalPaginas);
        await i.update({ embeds: [newEmbed], components: [newButtons] });
      });

      collector.on('end', async () => {
        // Deshabilitar botones al expirar
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('d1').setEmoji('⏮️').setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('d2').setEmoji('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId('d3').setLabel(`${pagina + 1} / ${totalPaginas}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId('d4').setEmoji('▶️').setStyle(ButtonStyle.Primary).setDisabled(true),
          new ButtonBuilder().setCustomId('d5').setEmoji('⏭️').setStyle(ButtonStyle.Secondary).setDisabled(true),
        );
        await interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });

    } catch (error) {
      console.error('Error en comando /warns:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};