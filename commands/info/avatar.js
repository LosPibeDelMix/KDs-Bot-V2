const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario (opcional, por defecto tú)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

      const embed = await createEmbed({
        title: `🖼️ Avatar de ${user.username}`,
        color: config.colors.info,
        image: avatarUrl,
        fields: [
          { 
            name: '🔗 Descargar', 
            value: `[PNG](${user.displayAvatarURL({ format: 'png', size: 1024 })}) | [WebP](${user.displayAvatarURL({ format: 'webp', size: 1024 })}) | [JPG](${user.displayAvatarURL({ format: 'jpg', size: 1024 })})`,
            inline: false 
          }
        ],
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /avatar:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};