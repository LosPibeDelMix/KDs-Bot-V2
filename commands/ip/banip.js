const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config');
const { createEmbed, replyError } = require('../../helpers');
const logs = require('../../logs');

const BANNED_IPS_FILE = path.join(__dirname, '../../bannedips.json');

/**
 * Carga las IPs baneadas del archivo JSON
 */
function loadBannedIPs() {
  try {
    if (fs.existsSync(BANNED_IPS_FILE)) {
      return JSON.parse(fs.readFileSync(BANNED_IPS_FILE));
    }
  } catch (error) {
    console.error('Error loading banned IPs:', error);
  }
  return {};
}

/**
 * Guarda las IPs baneadas en el archivo JSON
 */
function saveBannedIPs(data) {
  try {
    fs.writeFileSync(BANNED_IPS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving banned IPs:', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('banip')
    .setDescription('Registra una dirección IP como baneada')
    .addStringOption(opt => 
      opt.setName('ip').setDescription('Dirección IP a banear').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del baneo').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const ip = interaction.options.getString('ip');
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';

      // Validar formato de IP
      const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      if (!ipRegex.test(ip)) {
        return await replyError(interaction, '❌ Formato de IP inválido. Ejemplo: 192.168.1.1');
      }

      const banned = loadBannedIPs();

      // Verificar si ya está baneada
      if (banned[ip]) {
        return await replyError(interaction, `⚠️ La IP \`${ip}\` ya está baneada.`);
      }

      // Agregar IP a la lista de baneadas
      banned[ip] = {
        reason,
        bannedBy: interaction.user.tag,
        bannedByID: interaction.user.id,
        date: new Date().toISOString(),
      };
      saveBannedIPs(banned);

      // Loguear acción
      await logs.logBanIP(client, interaction.guild, ip, interaction.user, reason);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `🚫 IP Baneada Correctamente`,
        color: config.colors.ip,
        fields: [
          { name: '🌐 Dirección IP', value: `\`${ip}\``, inline: true },
          { name: '🛡️ Moderador', value: interaction.user.tag, inline: true },
          { name: '📋 Razón', value: reason, inline: false },
          { name: '📅 Fecha', value: new Date().toLocaleDateString('es-ES'), inline: true },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /banip:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};