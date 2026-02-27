/**
 * Configuración centralizada del bot
 * Colores, constantes, emojis, etc.
 */

module.exports = {
  // Colores por categoría (en hexadecimal)
  colors: {
    moderation: '#FF0000',   // Rojo para moderación
    info: '#3498DB',         // Azul para información
    fun: '#FF1493',          // Rosa para diversión
    ip: '#E74C3C',           // Rojo oscuro para IPs
    utility: '#2ECC71',      // Verde para utilidad
    success: '#27AE60',      // Verde oscuro para éxito
    error: '#E74C3C',        // Rojo para errores
    warning: '#F39C12',      // Naranja para advertencias
    ping: '#9B59B6',         // Morado para ping
  },

  // Mensajes estandarizados
  messages: {
    noPermissions: '❌ No tienes permisos para usar este comando.',
    noBotPermissions: '❌ No tengo permisos suficientes para completar esta acción.',
    userNotFound: '❌ Usuario no encontrado.',
    invalidUser: '❌ Debes especificar un usuario válido.',
    memberModerable: '❌ No puedo moderar a ese usuario. Posiblemente tenga más permisos que yo.',
    memberBannable: '❌ No puedo banear a ese usuario. Posiblemente tenga más permisos que yo.',
    ownerProtected: '❌ No puedo ejecutar acciones contra el propietario del servidor.',
    selfAction: '❌ No puedes ejecutar acciones contra ti mismo.',
    cooldown: '⏱️ Espera {tiempo} segundos antes de usar este comando de nuevo.',
    error: '❌ Ocurrió un error al ejecutar el comando. Por favor intenta de nuevo.',
    successAction: '✅ Acción completada correctamente.',
  },

  // Tiempos de espera (cooldowns) en segundos
  cooldowns: {
    meme: 3,
    love: 2,
    help: 1,
    userinfo: 1,
    serverinfo: 1,
    default: 2,
  },

  // Configuración de embeds
  embedDefaults: {
    timestamp: true,
    footer: true,
  },

  // Emojis útiles
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    user: '👤',
    members: '👥',
    roles: '🎭',
    mute: '🔇',
    ban: '🔨',
    warn: '⚠️',
    clock: '⏱️',
    calendar: '📅',
    link: '🔗',
    ping: '🏓',
    loading: '⏳',
  },

  // Configuración de warns
  warnSystem: {
    maxWarns: 3,
    autobanAt: 3,
    minutesToRemoveWarn: 7 * 24 * 60, // 7 días en minutos
  },

  // URLs y constantes
  defaults: {
    timeoutMax: 28 * 24 * 60, // 28 días en minutos (máximo de Discord)
  }
};
