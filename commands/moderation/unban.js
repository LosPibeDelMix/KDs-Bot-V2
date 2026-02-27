const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Desbanea a un usuario del servidor')
    .addStringOption(opt => 
      opt.setName('id').setDescription('ID del usuario a desbanear').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del desban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const userId = interaction.options.getString('id');
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';

      // Verificar si el usuario está baneado
      const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
      if (!ban) {
        return await replyError(interaction, '❌ Ese usuario no está baneado o el ID es inválido.');
      }

      // Ejecutar acción
      await interaction.guild.members.unban(userId, reason);

      // Loguear acción
      await logs.logUnban(client, interaction.guild, ban.user, interaction.user, reason);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `✅ Usuario Desbaneado`,
        color: config.colors.success,
        fields: [
          { name: '👤 Usuario', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: ban.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /unban:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};