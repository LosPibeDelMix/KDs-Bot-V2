const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { removeLogChannel, getLogChannel } = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removelog')
    .setDescription('Desactiva el sistema de logs de moderacion')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo administradores pueden ejecutar este comando.', 
          flags: 64 
        });
      }

      const currentLogChannel = getLogChannel(interaction.guildId);
      if (!currentLogChannel) {
        return interaction.reply({ 
          content: '❌ No hay un canal de logs configurado actualmente.', 
          flags: 64 
        });
      }

      removeLogChannel(interaction.guildId);

      const embed = new EmbedBuilder()
        .setColor('#00FF7F')
        .setTitle('✅ Sistema de Logs Desactivado')
        .setDescription('El canal de logs de moderacion ha sido eliminado correctamente.')
        .setTimestamp()
        .setFooter({ text: `Ejecutado por ${interaction.user.tag}` });

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Error en removelog:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: '❌ Hubo un error al desactivar los logs.', 
          flags: 64 
        });
      }
    }
  }
};