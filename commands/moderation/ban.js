const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, validateModerationAction, canBotBan, replyError } = require('../../helpers');

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
    .addIntegerOption(opt =>
      opt.setName('dias').setDescription('Días de mensajes a eliminar (0-7)').setRequired(false)
        .setMinValue(0).setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const userObj = interaction.options.getUser('usuario');
      const razon = interaction.options.getString('razon') || 'Sin razón especificada';
      const dias = interaction.options.getInteger('dias') ?? 0;

      // Intentar obtener el member (puede no estar en el servidor)
      const target = await interaction.guild.members.fetch(userObj.id).catch(() => null);

      if (target) {
        const validation = validateModerationAction(interaction.member, target, interaction.guild);
        if (!validation.valid) return await replyError(interaction, validation.message);

        if (!canBotBan(target)) return await replyError(interaction, config.messages.memberBannable);

        // DM antes del ban
        try {
          const dm = await createEmbed({
            title: `${config.emojis.ban} Has sido baneado`,
            description: `Fuiste baneado de **${interaction.guild.name}**`,
            color: config.colors.moderation,
            fields: [
              { name: '📋 Razón', value: razon },
              { name: '🛡️ Moderador', value: interaction.user.tag },
            ],
          });
          await userObj.send({ embeds: [dm] });
        } catch (_) {}
      }

      await interaction.guild.members.ban(userObj.id, { reason: razon, deleteMessageDays: dias });

      const embed = await createEmbed({
        title: `${config.emojis.ban} Usuario Baneado`,
        color: config.colors.moderation,
        fields: [
          { name: '👤 Usuario', value: `${userObj.tag} (${userObj.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '🗑️ Msgs eliminados', value: `${dias} día(s)`, inline: true },
          { name: '📋 Razón', value: razon, inline: false },
        ],
        thumbnail: userObj.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /ban:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};