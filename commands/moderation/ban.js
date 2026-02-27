const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, validateModerationAction, canBotBan, replyError } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un usuario del servidor')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario a banear').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del ban').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const target = await interaction.guild.members.fetch(interaction.options.getUser('usuario').id);
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';

      // Validaciones
      const validation = validateModerationAction(interaction.member, target, interaction.guild);
      if (!validation.valid) {
        return await replyError(interaction, validation.message);
      }

      if (!canBotBan(client, target)) {
        return await replyError(interaction, config.messages.memberBannable);
      }

      // Ejecutar acción
      await target.ban({ reason });

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `${config.emojis.ban} Usuario Baneado`,
        color: config.colors.moderation,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      // Loguear acción
      await logs.logBan(client, interaction.guild, target.user, interaction.user, reason);

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /ban:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};