const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Muestra los warns de un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario (opcional, por defecto tú)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const user = interaction.options.getUser('usuario') || interaction.user;
      const warnKey = `${interaction.guild.id}-${user.id}`;
      const userWarns = client.warns.get(warnKey) || [];

      // Si no hay warns
      if (userWarns.length === 0) {
        const embed = await createEmbed({
          title: '✅ Sin Warns',
          description: `**${user.username}** no tiene ningún warn registrado.`,
          color: config.colors.success,
          thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
          client,
        });
        return await interaction.editReply({ embeds: [embed] });
      }

      // Crear lista de warns
      const warnsText = userWarns
        .map((warn, index) => 
          `**#${index + 1}** - ${warn.reason}\n` +
          `  Moderador: ${warn.moderator}\n` +
          `  Fecha: ${new Date(warn.date).toLocaleDateString('es-ES')}`
        )
        .join('\n\n');

      const embed = await createEmbed({
        title: `⚠️ Warns de ${user.username}`,
        color: config.colors.warning,
        fields: [
          { 
            name: `📊 Total de Warns: ${userWarns.length}/${config.warnSystem.maxWarns}`, 
            value: warnsText,
            inline: false 
          },
          {
            name: '📋 Estado',
            value: userWarns.length >= config.warnSystem.maxWarns 
              ? '🚫 Este usuario ha alcanzado el máximo de warns.' 
              : `✅ Falta${userWarns.length === config.warnSystem.maxWarns - 1 ? '' : 'n'} ${config.warnSystem.maxWarns - userWarns.length} warn${config.warnSystem.maxWarns - userWarns.length === 1 ? '' : 's'} para el baneo automático.`,
            inline: false
          }
        ],
        thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /warns:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};
