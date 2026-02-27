const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError, getBotPing } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      // Obtener latencias
      const botPing = getBotPing(client);
      
      // Calcular ping de la respuesta
      const responseTime = Date.now() - interaction.createdTimestamp;

      // Determinar estado basado en latencia
      let status = '🟢 Excelente';
      let statusValue = 'La latencia es óptima';
      
      if (botPing > 200) {
        status = '🔴 Pobre';
        statusValue = 'La latencia es alta';
      } else if (botPing > 100) {
        status = '🟡 Moderado';
        statusValue = 'La latencia es aceptable';
      } else if (botPing > 50) {
        status = '🟢 Bueno';
        statusValue = 'La latencia es buena';
      }

      const embed = await createEmbed({
        title: `${config.emojis.ping} Latencia del Bot`,
        color: config.colors.ping,
        fields: [
          {
            name: '⚡ Ping API de Discord',
            value: `\`${botPing}ms\``,
            inline: true
          },
          {
            name: '⏱️ Tiempo de Respuesta',
            value: `\`${responseTime}ms\``,
            inline: true
          },
          {
            name: '📊 Estado',
            value: `${status}\n${statusValue}`,
            inline: false
          },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /ping:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};
