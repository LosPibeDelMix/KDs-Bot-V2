require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════
//  Colores para la consola
// ══════════════════════════════════════════
const c = {
  reset:  '\x1b[0m',
  bright: '\x1b[1m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
};

const ok  = `${c.green}✔${c.reset}`;
const err = `${c.red}✘${c.reset}`;
const wrn = `${c.yellow}⚠${c.reset}`;
const inf = `${c.cyan}ℹ${c.reset}`;

// ══════════════════════════════════════════
//  Verificar variables de entorno
// ══════════════════════════════════════════
const requiredEnv = ['TOKEN', 'CLIENT_ID', 'GUILD_ID'];
const missingEnv = requiredEnv.filter(v => !process.env[v]);

if (missingEnv.length > 0) {
  console.log(`\n${err} ${c.bright}Variables de entorno faltantes:${c.reset}`);
  missingEnv.forEach(v => console.log(`   ${c.red}→ ${v}${c.reset}`));
  console.log(`\n${wrn} Asegurate de tener un archivo .env con estas variables.\n`);
  process.exit(1);
}

// ══════════════════════════════════════════
//  Cargar comandos
// ══════════════════════════════════════════
const commands = [];
const loaded   = [];
const failed   = [];

function loadCommands(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    console.log(`${err} No se pudo leer el directorio: ${dir}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      loadCommands(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.js')) continue;

    try {
      // Limpiar caché por si se re-ejecuta el script
      delete require.cache[require.resolve(fullPath)];

      const command = require(fullPath);

      if (!command.data) {
        failed.push({ file: entry.name, reason: 'Falta la propiedad "data"' });
        continue;
      }
      if (!command.execute) {
        failed.push({ file: entry.name, reason: 'Falta la propiedad "execute"' });
        continue;
      }
      if (typeof command.data.toJSON !== 'function') {
        failed.push({ file: entry.name, reason: '"data" no es un SlashCommandBuilder válido' });
        continue;
      }

      commands.push(command.data.toJSON());
      loaded.push({ file: entry.name, name: command.data.name });

    } catch (e) {
      failed.push({ file: entry.name, reason: e.message });
    }
  }
}

// ══════════════════════════════════════════
//  Mostrar encabezado
// ══════════════════════════════════════════
console.log('');
console.log(`${c.bright}${c.cyan}╔══════════════════════════════════════════╗${c.reset}`);
console.log(`${c.bright}${c.cyan}║       KDs Bot — Deploy de Comandos       ║${c.reset}`);
console.log(`${c.bright}${c.cyan}╚══════════════════════════════════════════╝${c.reset}`);
console.log('');

const commandsDir = path.join(__dirname, 'commands');
console.log(`${inf} Buscando comandos en: ${c.gray}${commandsDir}${c.reset}\n`);

loadCommands(commandsDir);

// ══════════════════════════════════════════
//  Reporte de carga
// ══════════════════════════════════════════
if (loaded.length > 0) {
  console.log(`${c.bright}${c.green}Comandos cargados exitosamente (${loaded.length}):${c.reset}`);
  loaded.forEach(cmd => {
    console.log(`  ${ok} ${c.bright}/${cmd.name}${c.reset} ${c.gray}← ${cmd.file}${c.reset}`);
  });
  console.log('');
}

if (failed.length > 0) {
  console.log(`${c.bright}${c.red}Comandos con errores (${failed.length}):${c.reset}`);
  failed.forEach(f => {
    console.log(`  ${err} ${c.red}${f.file}${c.reset}`);
    console.log(`     ${c.gray}→ ${f.reason}${c.reset}`);
  });
  console.log('');
}

if (commands.length === 0) {
  console.log(`${err} ${c.red}No se encontraron comandos válidos para registrar. Abortando.${c.reset}\n`);
  process.exit(1);
}

// ══════════════════════════════════════════
//  Registrar en Discord
// ══════════════════════════════════════════
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`${inf} Registrando ${c.bright}${commands.length} comandos${c.reset} en Discord...`);
    console.log(`${c.gray}   Guild ID  : ${process.env.GUILD_ID}${c.reset}`);
    console.log(`${c.gray}   Client ID : ${process.env.CLIENT_ID}${c.reset}\n`);

    const startTime = Date.now();

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    const elapsed = Date.now() - startTime;

    console.log(`${c.bright}${c.green}╔══════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bright}${c.green}║  ✅  Deploy completado exitosamente       ║${c.reset}`);
    console.log(`${c.bright}${c.green}╚══════════════════════════════════════════╝${c.reset}`);
    console.log('');
    console.log(`  ${ok} ${c.bright}${data.length} comandos${c.reset} registrados en Discord`);
    console.log(`  ${inf} Tiempo total: ${c.cyan}${elapsed}ms${c.reset}`);

    if (failed.length > 0) {
      console.log(`  ${wrn} ${c.yellow}${failed.length} comando(s) con errores no fueron registrados${c.reset}`);
    }

    console.log('');

  } catch (error) {
    console.log(`\n${c.bright}${c.red}╔══════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bright}${c.red}║  ❌  Error al registrar en Discord        ║${c.reset}`);
    console.log(`${c.bright}${c.red}╚══════════════════════════════════════════╝${c.reset}\n`);

    if (error.status === 401) {
      console.log(`  ${err} Token inválido o expirado. Verificá tu TOKEN en el .env`);
    } else if (error.status === 403) {
      console.log(`  ${err} Sin permisos. Verificá que el bot esté en el servidor con el CLIENT_ID correcto`);
    } else if (error.status === 404) {
      console.log(`  ${err} Servidor no encontrado. Verificá el GUILD_ID en el .env`);
    } else {
      console.log(`  ${err} ${c.red}${error.message}${c.reset}`);
      if (error.rawError) {
        console.log(`  ${c.gray}Detalle: ${JSON.stringify(error.rawError, null, 2)}${c.reset}`);
      }
    }

    console.log('');
    process.exit(1);
  }
})();