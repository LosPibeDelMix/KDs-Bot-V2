const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Hace que el bot envíe un mensaje')
    .addStringOption(opt => 
      opt.setName('mensaje').setDescription('Mensaje a enviar').setRequired(true)
        .setMaxLength(2000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    try {
      const mensaje = interaction.options.getString('mensaje');

      // Validar que el mensaje no esté vacío
      if (!mensaje.trim()) {
        return await replyError(interaction, '❌ El mensaje no puede estar vacío.');
      }

      // Enviar el mensaje al canal
      await interaction.channel.send(mensaje);
      
      // Responder de forma efímera confirmando
      return await interaction.reply({ 
        content: `✅ Mensaje enviado correctamente en ${interaction.channel.toString()}`, 
        ephemeral: true 
      });
    } catch (error) {
      console.error('Error en comando /say:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};