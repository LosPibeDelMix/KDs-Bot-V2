const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('☢️ Clona el canal actual eliminando TODOS sus mensajes')
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón del nuke').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction, client) {
    try {
      const razon = interaction.options.getString('razon') || 'Sin razón especificada';

      // Pedir confirmación con botones
      const confirmEmbed = await createEmbed({
        title: '☢️ ¡CONFIRMACIÓN REQUERIDA!',
        description: `¿Estás **absolutamente seguro** de que quieres nukear ${interaction.channel}?\n\n⚠️ **Esta acción eliminará TODOS los mensajes del canal de forma permanente.**\n📋 **Razón:** ${razon}`,
        color: '#FF0000',
        client,
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('nuke_confirm')
          .setLabel('💣 Confirmar Nuke')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('nuke_cancel')
          .setLabel('✖️ Cancelar')
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [confirmEmbed], components: [row], flags: 64 });

      // Esperar respuesta del botón
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && ['nuke_confirm', 'nuke_cancel'].includes(i.customId),
        time: 15000,
        max: 1,
      });

      collector.on('collect', async i => {
        if (i.customId === 'nuke_cancel') {
          const cancelEmbed = await createEmbed({
            title: '✅ Nuke Cancelado',
            description: 'El nuke fue cancelado. No se eliminaron mensajes.',
            color: config.colors.success,
            client,
          });
          return await i.update({ embeds: [cancelEmbed], components: [] });
        }

        if (i.customId === 'nuke_confirm') {
          await i.update({ content: '☢️ Ejecutando nuke...', embeds: [], components: [] });

          const canal = interaction.channel;
          const posicion = canal.position;
          const parent = canal.parentId;
          const permisos = canal.permissionOverwrites.cache;

          // Clonar el canal
          const nuevoCanal = await canal.clone({
            reason: `Nuke ejecutado por ${interaction.user.tag} | ${razon}`,
          });

          // Restaurar posición y categoría
          await nuevoCanal.setPosition(posicion);
          if (parent) await nuevoCanal.setParent(parent, { lockPermissions: false });

          // Restaurar permisos
          await nuevoCanal.permissionOverwrites.set(permisos);

          // Eliminar canal original
          await canal.delete(`Nuke por ${interaction.user.tag}`);

          // Enviar mensaje de confirmación en el nuevo canal
          const nukeEmbed = await createEmbed({
            title: '☢️ Canal Nukeado',
            description: `Este canal fue nukeado por **${interaction.user.tag}**.\nTodos los mensajes han sido eliminados.`,
            color: '#FF0000',
            fields: [
              { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
              { name: '📋 Razón', value: razon, inline: true },
            ],
            client,
          });

          await nuevoCanal.send({ embeds: [nukeEmbed] });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          const timeoutEmbed = await createEmbed({
            title: '⏱️ Tiempo Agotado',
            description: 'El nuke fue cancelado automáticamente por inactividad.',
            color: config.colors.warning,
            client,
          });
          await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error en comando /nuke:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};