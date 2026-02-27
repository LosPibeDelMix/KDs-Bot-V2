const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('../../config');

const SUBREDDITS_ES = [
  'Memes_es',
  'memesenespanol',
  'SpanishMeme',
  'mexico',
  'argentina',
  'spain',
  'Colombia',
  'latinoamerica',
  'es',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Obtené un meme aleatorio en español'),

  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      let post = null;

      const shuffled = [...SUBREDDITS_ES].sort(() => Math.random() - 0.5);

      for (const sub of shuffled) {
        try {
          const res = await axios.get(`https://meme-api.com/gimme/${sub}`, {
            timeout: 8000,
            headers: { 'User-Agent': 'DiscordBot/1.0' }
          });

          if (res.data?.url && !res.data.nsfw) {
            post = res.data;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!post) {
        return await interaction.editReply({
          content: '❌ No pude obtener un meme ahora mismo. Intentá de nuevo.'
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colors.fun)
        .setTitle(post.title.slice(0, 256))
        .setURL(post.postLink)
        .setImage(post.url)
        .addFields(
          { name: '⬆️ Votos', value: post.ups.toLocaleString('es-ES'), inline: true },
          { name: '💬 Comentarios', value: post.num_comments?.toLocaleString('es-ES') ?? '0', inline: true },
          { name: '📌 Comunidad', value: `r/${post.subreddit}`, inline: true },
          { name: '👤 Autor', value: `u/${post.author}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Bot hecho por <@${process.env.USER_ID}>` });

      return await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en /meme:', error);
      return await interaction.editReply({
        content: '❌ Ocurrió un error inesperado. Intentá de nuevo.'
      });
    }
  }
};