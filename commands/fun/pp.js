const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pp')
    .setDescription('Mide el tamaño de tu poder imaginativo 🍆')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario (opcional, por defecto tú)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      const user = interaction.options.getUser('usuario') || interaction.user;
      
      // Generar resultado determinístico basado en el ID del usuario
      const seed = user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const size = seed % 25; // 0-24 cm
      const pp = '8' + '='.repeat(size) + 'D';

      // Generar un mensaje basado en el tamaño (sin ser inapropiado)
      let message = '¡Resultado mediocre! 😅';
      if (size >= 20) message = '¡WOW! ¡Impresionante! 🔥';
      else if (size >= 15) message = '¡Bastante bien! 😎';
      else if (size >= 10) message = 'Nada malo 👍';
      else if (size >= 5) message = 'Podría ser mejor 😐';
      else message = 'Necesitas entrenar 💪';

      const embed = await createEmbed({
        title: `🍆 Medidor de Poder Imaginativo`,
        description: `Resultado de **${user.username}**:`,
        color: config.colors.fun,
        fields: [
          { name: '📏 Tamaño Visual', value: `\`\`\`${pp}\`\`\``, inline: false },
          { name: '📊 Centímetros', value: `${size} cm`, inline: true },
          { name: '💬 Veredicto', value: message, inline: true },
        ],
        thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /pp:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};