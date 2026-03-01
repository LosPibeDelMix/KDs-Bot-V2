require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs   = require('fs');
const path = require('path');
const http = require('http');
const config  = require('./config');
const { createErrorEmbed, replyError } = require('./helpers');
const logs = require('./logs');

// ══════════════════════════════════════════
//  Servidor web para Render
// ══════════════════════════════════════════
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('✅ KDs Bot V2 activo!');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor web activo en puerto ${PORT}`);
});

// ══════════════════════════════════════════
//  Cliente de Discord
// ══════════════════════════════════════════
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

client.commands  = new Collection();
client.cooldowns = new Collection();
client.warns     = new Map();

// ══════════════════════════════════════════
//  Sistema de Warns (carga y guardado)
// ══════════════════════════════════════════
const WARNS_FILE = path.join(__dirname, 'warns.json');

function loadWarns() {
  try {
    if (fs.existsSync(WARNS_FILE)) {
      const warns = JSON.parse(fs.readFileSync(WARNS_FILE, 'utf-8'));
      warns.forEach((warn) => {
        const key = `${warn.guildId}-${warn.userId}`;
        if (!client.warns.has(key)) client.warns.set(key, []);
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
    client.warns.forEach((userWarns) => warns.push(...userWarns));
    fs.writeFileSync(WARNS_FILE, JSON.stringify(warns, null, 2));
  } catch (error) {
    console.error('Error guardando warns:', error);
  }
}

client.saveWarns = saveWarns;

// ══════════════════════════════════════════
//  Carga de comandos
// ══════════════════════════════════════════
function loadCommands(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += loadCommands(fullPath);
    } else if (entry.name.endsWith('.js')) {
      try {
        const command = require(fullPath);
        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          count++;
        }
      } catch (error) {
        console.error(`Error cargando comando ${fullPath}:`, error);
      }
    }
  }
  return count;
}

const commandCount = loadCommands(path.join(__dirname, 'commands'));
loadWarns();

// ══════════════════════════════════════════
//  Bot listo
// ══════════════════════════════════════════
client.once('clientReady', () => {
  const totalUsuarios = client.guilds.cache.reduce((a, g) => a + g.memberCount, 0);

  console.log('');
  console.log('╔════════════════════════════════════════╗');
  console.log(`║ ✅  Bot listo como ${client.user.tag}`);
  console.log(`║ 📝  ${commandCount} comandos cargados`);
  console.log(`║ 🏠  ${client.guilds.cache.size} servidor(es)`);
  console.log(`║ 👥  ${totalUsuarios.toLocaleString('es-ES')} usuarios en total`);
  console.log(`║ 👑  Hecho por <@${process.env.USER_ID}>`);
  console.log('╚════════════════════════════════════════╝');
  console.log('');

  // Actividades rotativas
  const actividades = [
    { nombre: '⚡ Usa /help',                                tipo: 3 },
    { nombre: '🎫 /ticket para soporte',                     tipo: 3 },
    { nombre: '🛡️ Moderando el servidor',                   tipo: 3 },
    { nombre: `👥 ${totalUsuarios.toLocaleString('es-ES')} miembros en total`, tipo: 3 },
  ];

  let actividadIndex = 0;
  function rotarActividad() {
    const act = actividades[actividadIndex];
    client.user.setActivity(act.nombre, { type: act.tipo });
    actividadIndex = (actividadIndex + 1) % actividades.length;
  }
  rotarActividad();
  setInterval(rotarActividad, 30_000);
});

// ══════════════════════════════════════════
//  📥 Ingreso de miembros
// ══════════════════════════════════════════
client.on('guildMemberAdd', async (member) => {
  try {
    await logs.logMemberJoin(client, member.guild, member);
  } catch (error) {
    console.error('Error en guildMemberAdd:', error);
  }
});

// ══════════════════════════════════════════
//  📤 Salida de miembros
// ══════════════════════════════════════════
client.on('guildMemberRemove', async (member) => {
  try {
    await logs.logMemberLeave(client, member.guild, member);
  } catch (error) {
    console.error('Error en guildMemberRemove:', error);
  }
});

// ══════════════════════════════════════════
//  ⚡ Interacciones (comandos slash)
// ══════════════════════════════════════════
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    //── Cooldown ──────────────────────────────
    if (!client.cooldowns.has(command.data.name)) {
      client.cooldowns.set(command.data.name, new Collection());
    }

    const now            = Date.now();
    const timestamps     = client.cooldowns.get(command.data.name);
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

    // ── Log de uso del comando ─────────────────
    if (interaction.guild) {
      await logs.logCommandUsed(client, interaction.guild, interaction);
    }

    // ── Ejecutar comando ───────────────────────
    await command.execute(interaction, client);

  } catch (error) {
    console.error(`Error en comando /${interaction.commandName}:`, error);

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

// ══════════════════════════════════════════
//  Manejo global de errores
// ══════════════════════════════════════════
process.on('unhandledRejection', (error) => {
  console.error('Error no manejado (Promise):', error);
});

process.on('uncaughtException', (error) => {
  console.error('Error no capturado (Exception):', error);
});

// ══════════════════════════════════════════
//  Login
// ══════════════════════════════════════════
console.log('🔑 Token presente:', !!process.env.TOKEN);
console.log('🔑 Token longitud:', process.env.TOKEN?.length || 0);
console.log('🔄 Intentando conectar a Discord...');

client.login(process.env.TOKEN)
  .then(() => console.log('✅ Login exitoso'))
  .catch(err => {
    console.error('❌ Error al hacer login:', err.message);
    process.exit(1);
  });

// Heartbeat en consola cada 5 minutos
setInterval(() => {
  console.log(`💓 Bot activo — ${new Date().toISOString()} — Ping: ${client.ws.ping}ms`);
}, 5 * 60_000);