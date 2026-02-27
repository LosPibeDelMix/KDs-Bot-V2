const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles'),

  async execute(interaction, client) {
    try {
      const maker = await client.users.fetch(process.env.USER_ID);

      const embed = await createEmbed({
        title: '📋 Centro de Ayuda - Comandos Disponibles',
        description: 'Aquí están todos los comandos disponibles del bot. Haz clic en los comandos para usarlos.',
        color: config.colors.utility,
        fields: [
          {
            name: '🛡️ MODERACIÓN',
            value: '`/ban` `/unban` `/mute` `/unmute` `/warn` `/warns` `/clearwarns`\n_Gestionar miembros del servidor_',
            inline: false,
          },
          {
            name: '👤 INFORMACIÓN',
            value: '`/userinfo` `/serverinfo` `/avatar` `/serveravatar` `/ipshow`\n_Obtener información útil_',
            inline: false,
          },
          {
            name: '🚫 GESTIÓN DE IPs',
            value: '`/banip` `/unbanip`\n_Bloquear IPs sospechosas_',
            inline: false,
          },
          {
            name: '🔧 UTILIDADES',
            value: '`/embed` `/say` `/ping` `/help`\n_Herramientas útiles para el servidor_',
            inline: false,
          },
          {
            name: '🎉 DIVERSIÓN',
            value: '`/meme` `/love` `/pp` `/beso` `/abrazo`\n_Comandos para divertirse_',
            inline: false,
          },
          {
            name: '❓ ¿Necesitas ayuda?',
            value: `Usa el comando con \`/\` y el nombre del comando para obtener más información.\nEjemplo: \`/userinfo\``,
            inline: false,
          }
        ],
        thumbnail: interaction.guild.iconURL({ dynamic: true, size: 256 }),
        client,
      });

      return await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /help:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};