const { SlashCommandBuilder, ChannelType, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
    .setName('ticket')
    .setDescription('Crea un nuevo ticket de soporte')
    .addStringOption(opt =>
      opt.setName('asunto').setDescription('Asunto del ticket').setRequired(true).setMaxLength(100)
    ),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ flags: 64 });

      const asunto = interaction.options.getString('asunto');
      const user = interaction.user;
      const guild = interaction.guild;

      // Verificar tickets abiertos
      const tickets = loadTickets();
      const userTicketsCount = Object.values(tickets).filter(t => t.userId === user.id && !t.closed).length;
      if (userTicketsCount >= 3) {
        return await interaction.editReply({ content: '❌ Solo puedes tener 3 tickets abiertos al mismo tiempo.' });
      }

      const ticketNumber = Object.keys(tickets).length + 1;

      // Obtener roles de administrador del servidor
      const adminRoles = guild.roles.cache.filter(role =>
        role.permissions.has(PermissionFlagsBits.Administrator) && role.id !== guild.id
      );

      // Construir permisos
      const permissionOverwrites = [
        // Nadie puede ver el canal por defecto
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        // Solo el creador del ticket puede verlo
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        // El bot puede verlo y gestionarlo
        {
          id: client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        },
      ];

      // Agregar permisos a todos los roles de administrador
      adminRoles.forEach(role => {
        permissionOverwrites.push({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages,
          ],
        });
      });

      // Crear canal
      const ticketChannel = await guild.channels.create({
        name: `ticket-${ticketNumber}-${user.username.substring(0, 8).toLowerCase()}`,
        type: ChannelType.GuildText,
        permissionOverwrites,
      });

      // Guardar ticket
      const ticketId = `ticket-${ticketNumber}`;
      tickets[ticketId] = {
        id: ticketId,
        number: ticketNumber,
        userId: user.id,
        userName: user.tag,
        channelId: ticketChannel.id,
        asunto,
        createdAt: new Date().toISOString(),
        closed: false,
      };
      saveTickets(tickets);

      // Embed de bienvenida
      const welcomeEmbed = new EmbedBuilder()
        .setColor(config.colors.utility)
        .setTitle(`🎫 Ticket #${ticketNumber}`)
        .setDescription(`Bienvenido **${user.username}**. El equipo de soporte atenderá tu ticket pronto.\nPara cerrar el ticket usa **/closeticket**.`)
        .addFields(
          { name: '📋 Asunto', value: asunto, inline: false },
          { name: '👤 Usuario', value: user.tag, inline: true },
          { name: '📅 Fecha', value: new Date().toLocaleDateString('es-ES'), inline: true },
          { name: '🔒 Acceso', value: 'Solo tú y los administradores pueden ver este canal.', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: `Ticket #${ticketNumber}` });

      await ticketChannel.send({ content: `${user}`, embeds: [welcomeEmbed] });

      // Log
      await logs.logTicketCreated(client, guild, user, ticketChannel, asunto);

      // Confirmar al usuario
      const confirmEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Ticket Creado')
        .setDescription(`Tu ticket ha sido creado correctamente.\n${ticketChannel.toString()}`)
        .setTimestamp();

      return await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Error en comando /ticket:', error);
      if (interaction.deferred) {
        return await interaction.editReply({ content: '❌ Hubo un error al crear el ticket.' });
      }
    }
  }
};