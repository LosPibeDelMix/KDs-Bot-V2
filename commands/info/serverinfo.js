const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información detallada del servidor'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const guild = interaction.guild;
      await guild.fetch();

      // Contar miembros por tipo
      const botCount = guild.members.cache.filter(m => m.user.bot).size;
      const userCount = guild.memberCount - botCount;

      // Crear embed con información detallada
      const embed = await createEmbed({
        title: `🏠 Información de ${guild.name}`,
        color: config.colors.info,
        thumbnail: guild.iconURL({ dynamic: true, size: 256 }),
        fields: [
          { name: '🆔 ID', value: guild.id, inline: true },
          { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '👥 Miembros Totales', value: `${guild.memberCount}`, inline: true },
          { name: '👤 Usuarios', value: `${userCount}`, inline: true },
          { name: '🤖 Bots', value: `${botCount}`, inline: true },
          { name: '💬 Canales', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
          { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
          { name: '📊 Nivel de Boost', value: `Nivel ${guild.premiumTier || 0}`, inline: true },
          { name: '🛡️ Nivel Verificación', value: guild.verificationLevel.toString(), inline: true },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /serverinfo:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};