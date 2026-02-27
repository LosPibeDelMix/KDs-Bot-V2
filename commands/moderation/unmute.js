const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Quita el mute (timeout) a un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario a desmutear').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del desmuteado').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const target = await interaction.guild.members.fetch(interaction.options.getUser('usuario').id);
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';

      if (!target) {
        return await replyError(interaction, config.messages.userNotFound);
      }

      // Ejecutar acción (null elimina el timeout)
      await target.timeout(null, reason);

      // Loguear acción
      await logs.logUnmute(client, interaction.guild, target.user, interaction.user, reason);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `🔊 Usuario Desmuteado`,
        color: config.colors.success,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /unmute:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};