const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, validateModerationAction, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor')
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razón de la expulsión').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const target = await interaction.guild.members.fetch(interaction.options.getUser('usuario').id).catch(() => null);
      const razon = interaction.options.getString('razon') || 'Sin razón especificada';

      if (!target) return await replyError(interaction, config.messages.userNotFound);

      const validation = validateModerationAction(interaction.member, target, interaction.guild);
      if (!validation.valid) return await replyError(interaction, validation.message);

      if (!target.kickable) return await replyError(interaction, config.messages.memberModerable);

      // DM antes del kick
      try {
        const dm = await createEmbed({
          title: '👢 Has sido expulsado',
          description: `Fuiste expulsado de **${interaction.guild.name}**`,
          color: config.colors.moderation,
          fields: [
            { name: '📋 Razón', value: razon },
            { name: '🛡️ Moderador', value: interaction.user.tag },
          ],
        });
        await target.user.send({ embeds: [dm] });
      } catch (_) {}

      await target.kick(razon);

      const embed = await createEmbed({
        title: '👢 Usuario Expulsado',
        color: config.colors.moderation,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📋 Razón', value: razon, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /kick:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};