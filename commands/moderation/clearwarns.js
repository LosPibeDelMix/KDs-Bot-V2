const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError, validateModerationAction } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Limpia todos los warns de un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario al que limpiar los warns').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón de la limpieza').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

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

      const warnKey = `${interaction.guild.id}-${target.user.id}`;
      const previousWarnCount = client.warns.get(warnKey)?.length || 0;

      // Limpiar warns del usuario
      if (previousWarnCount > 0) {
        client.warns.set(warnKey, []);
        client.saveWarns();
      }

      // Loguear acción
      await logs.logClearWarns(client, interaction.guild, target.user, interaction.user, reason, previousWarnCount);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `🧹 Warns Limpiados`,
        color: config.colors.success,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📊 Warns Eliminados', value: `${previousWarnCount}`, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      await interaction.editReply({ embeds: [embed] });

      // Enviar DM al usuario informándole
      try {
        const dmEmbed = await createEmbed({
          title: `🧹 Tus Warns Han Sido Limpiados`,
          description: `En **${interaction.guild.name}**`,
          color: config.colors.success,
          fields: [
            { name: '📋 Razón', value: reason },
          ],
          timestamp: true,
        });
        await target.user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log(`No se pudo enviar DM a ${target.user.tag}`);
      }
    } catch (error) {
      console.error('Error en comando /clearwarns:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};
