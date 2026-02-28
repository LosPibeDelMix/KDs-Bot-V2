const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Elimina mensajes del canal actual')
    .addIntegerOption(opt =>
      opt.setName('cantidad').setDescription('Cantidad de mensajes a eliminar (1-100)').setRequired(true)
        .setMinValue(1).setMaxValue(100)
    )
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Filtrar mensajes de un usuario específico').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ flags: 64 });

      const cantidad = interaction.options.getInteger('cantidad');
      const usuarioFiltro = interaction.options.getUser('usuario');

      // Obtener mensajes del canal
      const mensajes = await interaction.channel.messages.fetch({ limit: 100 });

      let mensajesFiltrados = mensajes;

      if (usuarioFiltro) {
        mensajesFiltrados = mensajes.filter(m => m.author.id === usuarioFiltro.id);
      }

      // Limitar a la cantidad solicitada
      const aEliminar = mensajesFiltrados.first(cantidad);

      if (aEliminar.length === 0) {
        return await replyError(interaction, '❌ No se encontraron mensajes para eliminar.');
      }

      // Solo se pueden borrar mensajes de los últimos 14 días en bulk
      const ahora = Date.now();
      const catorce_dias = 14 * 24 * 60 * 60 * 1000;
      const validos = aEliminar.filter(m => ahora - m.createdTimestamp < catorce_dias);

      if (validos.length === 0) {
        return await replyError(interaction, '❌ Los mensajes son muy antiguos (más de 14 días). Discord no permite borrarlos en bloque.');
      }

      const eliminados = await interaction.channel.bulkDelete(validos, true);

      const embed = await createEmbed({
        title: '🗑️ Mensajes Eliminados',
        color: config.colors.moderation,
        fields: [
          { name: '📊 Eliminados', value: `${eliminados.size} mensaje(s)`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📢 Canal', value: `${interaction.channel}`, inline: true },
          ...(usuarioFiltro ? [{ name: '👤 Usuario filtrado', value: usuarioFiltro.tag, inline: false }] : []),
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /clear:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};