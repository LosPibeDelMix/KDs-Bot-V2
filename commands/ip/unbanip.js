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
    .setName('unbanip')
    .setDescription('Elimina una dirección IP del registro de baneadas')
    .addStringOption(opt => 
      opt.setName('ip').setDescription('Dirección IP a desbanear').setRequired(true)
    )
    .addStringOption(opt => 
      opt.setName('razon').setDescription('Razón del desbaneo').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const ip = interaction.options.getString('ip');
      const reason = interaction.options.getString('razon') || 'Sin razón especificada';
      const banned = loadBannedIPs();

      // Validar que la IP esté baneada
      if (!banned[ip]) {
        return await replyError(interaction, `❌ La IP \`${ip}\` no está en la lista de baneadas.`);
      }

      // Obtener información anterior
      const previousData = banned[ip];

      // Eliminar IP de la lista
      delete banned[ip];
      saveBannedIPs(banned);

      // Loguear acción
      await logs.logUnbanIP(client, interaction.guild, ip, interaction.user, reason);

      // Crear embed de respuesta
      const embed = await createEmbed({
        title: `✅ IP Desbaneada Correctamente`,
        color: config.colors.success,
        fields: [
          { name: '🌐 Dirección IP', value: `\`${ip}\``, inline: true },
          { name: '🛡️ Desbaneado por', value: interaction.user.tag, inline: true },
          { name: '📋 Razón actual', value: reason, inline: false },
          { name: '📋 Razón original del baneo', value: previousData.reason || 'No disponible', inline: false },
          { name: '📅 Fecha', value: new Date().toLocaleDateString('es-ES'), inline: true },
        ],
        client,
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /unbanip:', error);
      return await replyError(interaction, config.messages.error);
    }
  }
};