const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot y el estado de la conexión'),

  async execute(interaction, client) {
    try {
      const sent = await interaction.reply({ content: '🏓 Calculando...', fetchReply: true });
      const responseTime = sent.createdTimestamp - interaction.createdTimestamp;
      const apiPing = client.ws.ping;

      const getStatus = (ms) => {
        if (ms < 50)  return { icon: '🟢', label: 'Excelente' };
        if (ms < 100) return { icon: '🟢', label: 'Bueno' };
        if (ms < 200) return { icon: '🟡', label: 'Moderado' };
        return { icon: '🔴', label: 'Pobre' };
      };

      const apiStatus = getStatus(apiPing);
      const respStatus = getStatus(responseTime);

      const embed = await createEmbed({
        title: `${config.emojis.ping} Latencia del Bot`,
        color: config.colors.ping,
        fields: [
          { name: '⚡ WebSocket (API)', value: `${apiStatus.icon} \`${apiPing}ms\` — ${apiStatus.label}`, inline: true },
          { name: '💬 Tiempo de respuesta', value: `${respStatus.icon} \`${responseTime}ms\` — ${respStatus.label}`, inline: true },
          { name: '🌐 Servidores activos', value: `\`${client.guilds.cache.size}\``, inline: true },
        ],
        client,
      });

      return await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /ping:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};