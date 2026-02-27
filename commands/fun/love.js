const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('love')
    .setDescription('Calcula el porcentaje de amor entre dos personas 💕')
    .addUserOption(opt => 
      opt.setName('usuario1').setDescription('Primera persona').setRequired(true)
    )
    .addUserOption(opt => 
      opt.setName('usuario2').setDescription('Segunda persona (opcional, por defecto tú)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      const user1 = interaction.options.getUser('usuario1');
      const user2 = interaction.options.getUser('usuario2') || interaction.user;

      // Generar porcentaje determinístico basado en IDs
      const seed = (user1.id + user2.id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const percent = seed % 101;

      // Determinar emoji y mensaje según porcentaje
      let emoji = '💔';
      let message = 'No hay mucha química... 😕';
      let color = config.colors.fun;

      if (percent >= 90) {
        emoji = '💖';
        message = '¡AMOR PURO! ¡Son la pareja perfecta! 😍✨';
      } else if (percent >= 80) {
        emoji = '💖';
        message = '¡Amor verdadero! Son perfectos el uno para el otro 😍';
      } else if (percent >= 70) {
        emoji = '❤️';
        message = 'Hay mucho amor aquí... ¡Quizás sea para siempre! 💕';
      } else if (percent >= 60) {
        emoji = '❤️';
        message = 'Hay buena química entre ustedes 💕';
      } else if (percent >= 50) {
        emoji = '🧡';
        message = 'Hay potencial, ¡sigan intentando! 😊';
      } else if (percent >= 40) {
        emoji = '💛';
        message = 'Son más amigos que pareja 😅';
      } else if (percent >= 30) {
        emoji = '💙';
        message = 'Hay amistad, pero no mucho más 🫡';
      } else if (percent >= 20) {
        emoji = '💚';
        message = 'La química es casi nula... 😶';
      } else {
        emoji = '💔';
        message = 'Mejor como amigos 😅';
      }

      // Crear barra de progreso visual
      const barLength = 10;
      const filledBars = Math.floor((percent / 100) * barLength);
      const emptyBars = barLength - filledBars;
      const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

      const embed = await createEmbed({
        title: `${emoji} Medidor de Amor`,
        description: `**${user1.username}** 💕 **${user2.username}**`,
        color: config.colors.fun,
        fields: [
          { name: '💯 Compatibilidad', value: `\`${bar}\` **${percent}%**`, inline: false },
          { name: '💬 Veredicto', value: message, inline: false },
        ],
        thumbnail: user1.displayAvatarURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /love:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};