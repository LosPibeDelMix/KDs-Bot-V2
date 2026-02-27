const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Crea un embed personalizado') 
    .addStringOption(opt => 
      opt.setName('titulo').setDescription('Título del embed').setRequired(true)
        .setMaxLength(256)
    )
    .addStringOption(opt => 
      opt.setName('descripcion').setDescription('Descripción del embed').setRequired(true)
        .setMaxLength(2048)
    )
    .addStringOption(opt => 
      opt.setName('color').setDescription('Color en HEX (ej: #FF5733)').setRequired(false)
    )
    .addStringOption(opt => 
      opt.setName('imagen').setDescription('URL de la imagen').setRequired(false)
    )
    .addStringOption(opt => 
      opt.setName('footer').setDescription('Texto del footer').setRequired(false)
        .setMaxLength(2048)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const titulo = interaction.options.getString('titulo');
      const descripcion = interaction.options.getString('descripcion');
      let color = interaction.options.getString('color') || config.colors.utility;
      const imagen = interaction.options.getString('imagen');
      const footer = interaction.options.getString('footer');

      // Validar color hexadecimal
      if (!color.match(/^#[0-9A-F]{6}$/i)) {
        return await replyError(interaction, '❌ Color inválido. Usa formato HEX con # (ej: #FF5733)');
      }

      // Crear el embed personalizado
      const customEmbed = await createEmbed({
        title: titulo,
        description: descripcion,
        color,
        image: imagen,
        footer: footer ? { text: footer } : null,
        client,
      });

      // Enviar el embed al canal
      await interaction.channel.send({ embeds: [customEmbed] });
      
      // Confirmar al usuario (efímero)
      return await interaction.editReply({ content: `✅ Embed creado y enviado al canal ${interaction.channel.toString()}` });
    } catch (error) {
      console.error('Error en comando /embed:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};