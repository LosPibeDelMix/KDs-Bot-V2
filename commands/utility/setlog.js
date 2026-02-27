const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setLogChannel } = require('../../logs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlog')
    .setDescription('Establece el canal donde se enviaran los logs de moderacion')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de texto donde enviar los logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Solo administradores pueden ejecutar este comando.', 
          flags: 64 
        });
      }

      const logChannel = interaction.options.getChannel('canal');
      setLogChannel(interaction.guildId, logChannel.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Canal de Logs Establecido')
        .setDescription(`Los logs de moderacion se enviaran a ${logChannel}`)
        .setColor('#00FF7F')
        .addFields(
          { name: '📌 Canal', value: logChannel.toString(), inline: true },
          { name: '🆔 ID del Canal', value: `\`${logChannel.id}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Configurado por ${interaction.user.tag}` });

      await interaction.reply({ embeds: [embed], flags: 64 });

    } catch (error) {
      console.error('Error en setlog:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: '❌ Hubo un error al establecer el canal de logs.', 
          flags: 64 
        });
      }
    }
  }
};