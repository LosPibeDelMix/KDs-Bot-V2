const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serveravatar')
    .setDescription('Muestra el icono del servidor'),

  async execute(interaction, client) {
    try {
      const guild = interaction.guild;
      const iconUrl = guild.iconURL({ dynamic: true, size: 1024 });

      if (!iconUrl) {
        return await replyError(interaction, '❌ Este servidor no tiene icono configurado.');
      }

      const embed = await createEmbed({
        title: `🖼️ Icono de ${guild.name}`,
        color: config.colors.info,
        image: iconUrl,
        fields: [
          { 
            name: '🔗 Descargar', 
            value: `[PNG](${guild.iconURL({ format: 'png', size: 1024 })}) | [WebP](${guild.iconURL({ format: 'webp', size: 1024 })}) | [JPG](${guild.iconURL({ format: 'jpg', size: 1024 })})`,
            inline: false 
          }
        ],
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /serveravatar:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};