const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, validateModerationAction, canBotMute, minutesToMs, replyError } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutea (timeout) a un usuario temporalmente')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario a mutear').setRequired(true)
    )
    .addIntegerOption(opt => 
      opt.setName('minutos').setDescription('Duración en minutos (máx: 40320, ~28 días)').setRequired(false)
        .setMinValue(1).setMaxValue(40320)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del mute').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const target = await interaction.guild.members.fetch(interaction.options.getUser('usuario').id);
      const minutes = interaction.options.getInteger('minutos') || 10;
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';

      // Validaciones
      const validation = validateModerationAction(interaction.member, target, interaction.guild);
      if (!validation.valid) {
        return await replyError(interaction, validation.message);
      }

      if (!canBotMute(target)) {
        return await replyError(interaction, config.messages.memberModerable);
      }

      // Ejecutar acción (convertir minutos a milisegundos)
      await target.timeout(minutesToMs(minutes), reason);

      // Loguear acción
      await logs.logMute(client, interaction.guild, target.user, interaction.user, `${minutes} minutos`, reason);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `${config.emojis.mute} Usuario Muteado`,
        color: config.colors.moderation,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: `${interaction.user.tag}`, inline: true },
          { name: '⏱️ Duración', value: `${minutes} minutos`, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /mute:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};