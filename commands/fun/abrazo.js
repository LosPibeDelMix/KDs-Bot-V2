const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

// GIFs de abrazos (una buena variedad)
const HUG_GIFS = [
  'https://media.giphy.com/media/l2QDM9Jnim1YVILXa/giphy.gif',
  'https://media.giphy.com/media/3M4NpbLCTxBqU/giphy.gif',
  'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
  'https://media.giphy.com/media/lnlAifQdenMxW/giphy.gif',
  'https://media.giphy.com/media/xT9IgEx8SbQ0teblYQ/giphy.gif',
  'https://media.giphy.com/media/l0Iy0DCoEt872o9ER/giphy.gif',
  'https://media.giphy.com/media/qLWwFy78vhYMU/giphy.gif',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('abrazo')
    .setDescription('Dale un abrazo a alguien 🤗')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario al que abrazar').setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      const target = interaction.options.getUser('usuario');
      
      // Validar que no sea uno mismo
      if (target.id === interaction.user.id) {
        return await replyError(interaction, '❌ ¡No puedes abrazarte a ti mismo! 😅');
      }

      const gif = HUG_GIFS[Math.floor(Math.random() * HUG_GIFS.length)];

      const embed = await createEmbed({
        title: `🤗 ¡Abrazo Caluroso!`,
        description: `**${interaction.user.username}** le da un abrazo a **${target.username}** 💛`,
        color: config.colors.fun,
        image: gif,
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /abrazo:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};