const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

// GIFs de besos (una buena variedad)
const KISS_GIFS = [
  'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
  'https://media.giphy.com/media/bGm9FuBCGg4SY/giphy.gif',
  'https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif',
  'https://media.giphy.com/media/wbcMnfHqOJX9K/giphy.gif',
  'https://media.giphy.com/media/KiwBbn8r9S9SO/giphy.gif',
  'https://media.giphy.com/media/l41lFw2EZifL7HA7K/giphy.gif',
  'https://media.giphy.com/media/n2ZSzcU4z39xy/giphy.gif',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('beso')
    .setDescription('Dale un beso a alguien 💋')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario al que besar').setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      const target = interaction.options.getUser('usuario');
      
      // Validar que no sea uno mismo
      if (target.id === interaction.user.id) {
        return await replyError(interaction, '❌ ¡No puedes besarte a ti mismo! 😅');
      }

      const gif = KISS_GIFS[Math.floor(Math.random() * KISS_GIFS.length)];

      const embed = await createEmbed({
        title: `💋 ¡Beso Romántico!`,
        description: `**${interaction.user.username}** le da un beso a **${target.username}** 😘✨`,
        color: config.colors.fun,
        image: gif,
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /beso:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};