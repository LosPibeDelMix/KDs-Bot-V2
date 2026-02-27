const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ipshow')
    .setDescription('Muestra información pública de una dirección IP')
    .addStringOption(opt => 
      opt.setName('ip').setDescription('Dirección IP a consultar').setRequired(true)
    ),

  async execute(interaction, client) {
    try {
      const ip = interaction.options.getString('ip');
      await interaction.deferReply();

      // Validar formato básico de IP
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(ip)) {
        return await replyError(interaction, '❌ Formato de IP inválido.');
      }

      // Hacer la solicitud a la API
      const res = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city,regionName,timezone,isp,org,lat,lon`, {
        timeout: 5000
      }).catch(() => null);

      if (!res || res.data.status === 'fail') {
        return await replyError(interaction, '❌ No se pudo obtener información de esa IP o es inválida.');
      }

      const d = res.data;
      
      const embed = await createEmbed({
        title: `🌐 Información de IP: ${ip}`,
        color: config.colors.info,
        fields: [
          { name: '🌍 País', value: `${d.country} (${d.countryCode})`, inline: true },
          { name: '🏙️ Ciudad', value: d.city || 'No disponible', inline: true },
          { name: '📡 ISP', value: d.isp || 'No disponible', inline: true },
          { name: '🗺️ Región', value: d.regionName || 'No disponible', inline: true },
          { name: '🕐 Zona Horaria', value: d.timezone || 'No disponible', inline: true },
          { name: '🏢 Organización', value: d.org || 'No disponible', inline: true },
          { name: '📍 Coordenadas', value: `${d.lat}, ${d.lon}`, inline: true },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /ipshow:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};