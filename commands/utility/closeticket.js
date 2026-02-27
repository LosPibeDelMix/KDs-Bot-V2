const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const logs = require('../../logs');
const fs = require('fs');
const path = require('path');

const TICKETS_FILE = path.join(__dirname, '../../tickets.json');

function loadTickets() {
  try {
    if (fs.existsSync(TICKETS_FILE)) return JSON.parse(fs.readFileSync(TICKETS_FILE));
  } catch (error) {
    console.error('Error cargando tickets:', error);
  }
  return {};
}

function saveTickets(data) {
  try {
    fs.writeFileSync(TICKETS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error guardando tickets:', error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Cierra y elimina un ticket de soporte')
    .addStringOption(opt =>
      opt.setName('razon').setDescription('Razon del cierre').setRequired(false)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ flags: 64 });

      const channel = interaction.channel;
      const reason = interaction.options.getString('razon') || 'Ticket resuelto';

      // Buscar si este canal es un ticket
      const tickets = loadTickets();
      let ticketData = null;
      let ticketKey = null;

      for (const [key, ticket] of Object.entries(tickets)) {
        if (ticket.channelId === channel.id && !ticket.closed) {
          ticketData = ticket;
          ticketKey = key;
          break;
        }
      }

      if (!ticketData) {
        return await interaction.editReply({ content: '❌ Este no es un canal de ticket valido o ya fue cerrado.' });
      }

      // Marcar como cerrado
      ticketData.closed = true;
      ticketData.closedAt = new Date().toISOString();
      ticketData.closedBy = interaction.user.tag;
      tickets[ticketKey] = ticketData;
      saveTickets(tickets);

      // Obtener usuario del ticket
      const ticketUser = await client.users.fetch(ticketData.userId).catch(() => null);

      // Embed de cierre en el canal
      const closeEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle('🔒 Ticket Cerrado')
        .setDescription(`Este ticket ha sido cerrado por **${interaction.user.tag}**.\nEl canal se eliminara en **5 segundos**.`)
        .addFields(
          { name: '📋 Razon', value: reason, inline: false },
          { name: '⏰ Cerrado el', value: new Date().toLocaleDateString('es-ES'), inline: true },
          { name: '🎫 Ticket', value: `#${ticketData.number}`, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [closeEmbed] });

      // Log
      await logs.logTicketClosed(client, interaction.guild, ticketUser, channel, interaction.user, reason);

      // DM al usuario
      if (ticketUser) {
        try {
          const dmEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('🎫 Tu Ticket Ha Sido Cerrado')
            .setDescription(`Tu ticket **#${ticketData.number}** ha sido cerrado.`)
            .addFields(
              { name: '📋 Asunto', value: ticketData.asunto, inline: false },
              { name: '📋 Razon de cierre', value: reason, inline: false },
              { name: '👤 Cerrado por', value: interaction.user.tag, inline: true }
            )
            .setTimestamp();
          await ticketUser.send({ embeds: [dmEmbed] });
        } catch {
          console.log(`No se pudo enviar DM a ${ticketUser?.tag}`);
        }
      }

      // Confirmar al staff
      const confirmEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Ticket Cerrado Correctamente')
        .setDescription('El canal sera eliminado en 5 segundos.')
        .addFields(
          { name: '📌 Canal', value: channel.name, inline: true },
          { name: '🎫 Ticket', value: `#${ticketData.number}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [confirmEmbed] });

      // Eliminar canal después de 5 segundos
      setTimeout(async () => {
        await channel.delete(`Ticket #${ticketData.number} cerrado por ${interaction.user.tag}`).catch(() => {});
      }, 5000);

    } catch (error) {
      console.error('Error en comando /closeticket:', error);
      if (interaction.deferred) {
        return await interaction.editReply({ content: '❌ Hubo un error al cerrar el ticket.' });
      }
    }
  }
};