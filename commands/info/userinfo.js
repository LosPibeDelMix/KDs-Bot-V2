const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Muestra información detallada de un usuario')
    .addUserOption(opt => 
      opt.setName('usuario').setDescription('Usuario (opcional, por defecto tú)').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const target = interaction.options.getMember('usuario') || interaction.member;
      const user = target.user;

      // Obtener roles (filtrando el rol por defecto)
      const roles = target.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString())
        .slice(0, 25)
        .join(', ') || 'Ninguno';

      // Crear embed con información detallada
      const embed = await createEmbed({
        title: `👤 Información de ${user.username}`,
        color: config.colors.info,
        thumbnail: user.displayAvatarURL({ dynamic: true, size: 256 }),
        fields: [
          { name: '🆔 ID', value: user.id, inline: true },
          { name: '🏷️ Tag', value: user.tag, inline: true },
          { name: '🤖 Bot', value: user.bot ? 'Sí ✅' : 'No ❌', inline: true },
          { name: '📅 Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Se unió al servidor', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: '👑 Rol más alto', value: target.roles.highest.name, inline: true },
          { 
            name: `🎭 Roles (${target.roles.cache.filter(r => r.id !== interaction.guild.id).size})`, 
            value: roles.length > 1024 ? 'Demasiados roles para mostrar' : roles,
            inline: false 
          },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /userinfo:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};