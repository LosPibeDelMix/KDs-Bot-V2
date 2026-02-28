module.exports = {
  colors: {
    moderation: '#E74C3C',
    info: '#3498DB',
    fun: '#FF1493',
    ip: '#C0392B',
    utility: '#2ECC71',
    success: '#27AE60',
    error: '#E74C3C',
    warning: '#F39C12',
    ping: '#9B59B6',
    nuke: '#FF0000',
  },

  messages: {
    noPermissions: '❌ No tienes permisos para usar este comando.',
    noBotPermissions: '❌ No tengo permisos suficientes para completar esta acción.',
    userNotFound: '❌ Usuario no encontrado.',
    invalidUser: '❌ Debes especificar un usuario válido.',
    memberModerable: '❌ No puedo moderar a ese usuario. Posiblemente tenga más permisos que yo.',
    memberBannable: '❌ No puedo banear a ese usuario. Posiblemente tenga más permisos que yo.',
    ownerProtected: '❌ No puedo ejecutar acciones contra el propietario del servidor.',
    selfAction: '❌ No puedes ejecutar acciones contra ti mismo.',
    cooldown: '⏱️ Espera **{tiempo}** segundos antes de usar este comando de nuevo.',
    error: '❌ Ocurrió un error al ejecutar el comando. Por favor intenta de nuevo.',
    successAction: '✅ Acción completada correctamente.',
  },

  cooldowns: {
    meme: 5,
    love: 3,
    help: 3,
    userinfo: 2,
    serverinfo: 2,
    clear: 5,
    nuke: 30,
    ban: 3,
    kick: 3,
    mute: 3,
    warn: 2,
    default: 3,
  },

  embedDefaults: {
    timestamp: true,
    footer: true,
  },

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
    kick: '👢',
    warn: '⚠️',
    nuke: '☢️',
    clear: '🗑️',
    clock: '⏱️',
    calendar: '📅',
    link: '🔗',
    ping: '🏓',
    loading: '⏳',
  },

  warnSystem: {
    maxWarns: 3,
    autobanAt: 3,
    minutesToRemoveWarn: 7 * 24 * 60,
  },

  defaults: {
    timeoutMax: 28 * 24 * 60,
  }
};