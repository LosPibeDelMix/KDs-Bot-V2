const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, validateModerationAction, replyError } = require('../../helpers');
const logs = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario a advertir').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón de la advertencia').setRequired(false)
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

      // Crear key única para el warn (guildId-userId)
      const warnKey = `${interaction.guild.id}-${target.user.id}`;
      if (!client.warns.has(warnKey)) {
        client.warns.set(warnKey, []);
      }

      // Agregar el warn
      const userWarns = client.warns.get(warnKey);
      userWarns.push({
        guildId: interaction.guild.id,
        userId: target.user.id,
        reason,
        moderator: interaction.user.tag,
        date: new Date().toISOString(),
      });

      // Guardar warns en archivo
      client.saveWarns();

      // Loguear acción
      await logs.logWarn(client, interaction.guild, target.user, interaction.user, reason, userWarns.length, config.warnSystem.maxWarns);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `${config.emojis.warn} Usuario Advertido`,
        color: config.colors.warning,
        fields: [
          { name: '👤 Usuario', value: `${target.user.tag} (${target.user.id})`, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📊 Total warns', value: `${userWarns.length}/${config.warnSystem.maxWarns}`, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
        ],
        thumbnail: target.user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      await interaction.editReply({ embeds: [embed] });

      // Enviar DM al usuario
      try {
        const dmEmbed = await createEmbed({
          title: `${config.emojis.warn} Advertencia Recibida`,
          description: `Has recibido un warn en **${interaction.guild.name}**`,
          color: config.colors.warning,
          fields: [
            { name: '📋 Razón', value: reason },
            { name: '📊 Warns totales', value: `${userWarns.length}/${config.warnSystem.maxWarns}` },
          ],
          timestamp: true,
        });
        await target.user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.log(`No se pudo enviar DM a ${target.user.tag}`);
      }
    } catch (error) {
      console.error('Error en comando /warn:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};