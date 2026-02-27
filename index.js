require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const http = require('http');
const config = require('./config');
const { createErrorEmbed, replyError } = require('./helpers');

// ✅ Servidor web PRIMERO para que Render detecte el puerto
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ KDs Bot V2 activo!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor web activo en puerto ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember, Partials.Message],
});

client.commands = new Collection();
client.cooldowns = new Collection();
client.warns = new Map();

const WARNS_FILE = path.join(__dirname, 'warns.json');

function loadWarns() {
  try {
    if (fs.existsSync(WARNS_FILE)) {
      const data = fs.readFileSync(WARNS_FILE, 'utf-8');
      const warns = JSON.parse(data);
      warns.forEach((warn) => {
        const key = `${warn.guildId}-${warn.userId}`;
        if (!client.warns.has(key)) {
          client.warns.set(key, []);
        }
        client.warns.get(key).push(warn);
      });
    }
  } catch (error) {
    console.error('Error cargando warns:', error);
  }
}

function saveWarns() {
  try {
    const warns = [];
    client.warns.forEach((userWarns) => {
      warns.push(...userWarns);
    });
    fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));
  } catch (error) {
    console.error('Error guardando warns:', error);
  }
}

client.saveWarns = saveWarns;

function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let loadedCount = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadedCount += loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          loadedCount++;
        }
      } catch (error) {
        console.error(`Error cargando comando ${fullPath}:`, error);
      }
    }
  }
  return loadedCount;
}

const commandCount = loadCommands(path.join(__dirname, 'commands'));
loadWarns();

client.once('clientReady', () => {
  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log(`║ ✅  Bot listo como ${client.user.tag}`);
  console.log(`║ 📝  ${commandCount} comandos cargados`);
  console.log(`║ 👑  Hecho por <@${process.env.USER_ID}>`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  const totalUsuarios = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

  const actividades = [
    { nombre: '⚡ Usa /help', tipo: 3 },
    { nombre: '🎫 /ticket para soporte', tipo: 3 },
    { nombre: '🛡️ Moderando el servidor', tipo: 3 },
    { nombre: `👥 ${totalUsuarios.toLocaleString('es-ES')} miembros en total`, tipo: 3 },
  ];

  let actividadIndex = 0;

  function rotarActividad() {
    const actividad = actividades[actividadIndex];
    client.user.setActivity(actividad.nombre, { type: actividad.tipo });
    actividadIndex = (actividadIndex + 1) % actividades.length;
  }

  rotarActividad();
  setInterval(rotarActividad, 30000);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = client.cooldowns.get(command.data.name);
    const cooldownAmount = (config.cooldowns[command.data.name] || config.cooldowns.default) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = Math.round((expirationTime - now) / 1000);
        return await replyError(
          interaction,
          config.messages.cooldown.replace('{tiempo}', timeLeft)
        );
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    await command.execute(interaction, client);

  } catch (error) {
    console.error(`Error en comando ${interaction.commandName}:`, error);

    try {
      const embed = await createErrorEmbed(
        `${config.messages.error}\n\`\`\`${error.message}\`\`\``
      );
      const reply = { embeds: [embed], flags: 64 };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    } catch (replyError) {
      console.error('Error al responder con embed de error:', replyError);
    }
  }
});

process.on('unhandledRejection', (error) => {
  console.error('Error no manejado (Promise):', error);
});

process.on('uncaughtException', (error) => {
  console.error('Error no capturado (Exception):', error);
});

client.login(process.env.TOKEN);