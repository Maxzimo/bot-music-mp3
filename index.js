require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const ytdlp = require('yt-dlp-exec');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const spotify = require('spotify-url-info')(fetch);


// ==================
// COOKIES YOUTUBE
// ==================
const COOKIES_FILE = path.join(__dirname, 'cookies.txt');

if (process.env.YT_COOKIES) {
  fs.writeFileSync(COOKIES_FILE, process.env.YT_COOKIES);
  console.log("✅ Cookies de YouTube cargadas");
}


// ==================
// DOWNLOADS
// ==================
const DOWNLOADS = path.join(__dirname, 'downloads');

if (!fs.existsSync(DOWNLOADS)) {
  fs.mkdirSync(DOWNLOADS);
}


// ==================
// CLIENT
// ==================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});


// ==================
// READY
// ==================
client.once('ready', () => {
  console.log(`🤖 Conectado como ${client.user.tag}`);
});


// ==================
// COMMANDS
// ==================
client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;


  // -------- LIMPIAR --------
  if (interaction.commandName === 'limpiar') {

    await interaction.deferReply();

    try {

      fs.rmSync(DOWNLOADS, { recursive: true, force: true });
      fs.mkdirSync(DOWNLOADS);

      await interaction.editReply("✅ Carpeta limpia");

    } catch (err) {

      console.error(err);
      await interaction.editReply("❌ Error al limpiar");
    }

    return;
  }


  // -------- BUSCAR --------
  if (interaction.commandName !== 'buscar') return;

  const query = interaction.options.getString('query');

  await interaction.deferReply();


  try {

    // SPOTIFY
    if (query.includes('open.spotify.com')) {

      if (query.includes('/album/')) {
        await spotifyAlbum(query, interaction);
        return;
      }

      if (query.includes('/track/')) {
        await spotifyTrack(query, interaction);
        return;
      }
    }


    // PLAYLIST
    if (query.includes('list=')) {
      await youtubePlaylist(query, interaction);
      return;
    }


    // NORMAL
    await downloadSong(query, interaction);


  } catch (err) {

    console.error(err);
    await interaction.editReply("❌ Error general");
  }
});


// ==================
// DOWNLOAD
// ==================
async function downloadSong(query, interaction, info = {}) {

  let final = query;

  if (!query.startsWith('http')) {
    final = `ytsearch1:${query}`;
  }


  try {

    // ===== METADATA =====
    const meta = await ytdlp(final, {
      dumpSingleJson: true,
      skipDownload: true,
      quiet: true,

      cookies: COOKIES_FILE,
      jsRuntimes: "node"
    });


    const title = info.title || meta.title || "Unknown";
    const artist = info.artist || meta.artist || meta.uploader || "Unknown";


    const filename = sanitize(`${artist} - ${title}.mp3`);
    const file = path.join(DOWNLOADS, filename);


    // ===== DOWNLOAD + TAGS =====
    await ytdlp(meta.webpage_url, {

      cookies: COOKIES_FILE,
      jsRuntimes: "node",

      format: "bestaudio",

      extractAudio: true,
      audioFormat: "mp3",

      output: file,

      // 🔥 FORZAR METADATA
      embedThumbnail: true,
      embedMetadata: true,

      postprocessorArgs: [
        "-metadata", `title=${title}`,
        "-metadata", `artist=${artist}`,
        "-metadata", "album=Music | MP3",
        "-metadata", "comment=Downloaded by Music | MP3",
        "-write_id3v2", "1"
      ],

      preferFfmpeg: true,

      quiet: true,
      noWarnings: true
    });


    // ===== SIZE =====
    const stats = fs.statSync(file);
    const sizeMB = stats.size / 1024 / 1024;


    if (sizeMB > 8) {

      fs.unlinkSync(file);

      await interaction.followUp(
        `❌ Archivo muy grande (${sizeMB.toFixed(2)} MB)`
      );

      return;
    }


    // ===== EMBED =====
    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle(title)
      .setDescription(`🎤 ${artist}`)
      .setFooter({ text: "Music | MP3" });


    await interaction.followUp({
      embeds: [embed],
      files: [file]
    });


    // ===== CLEAN =====
    setTimeout(() => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }, 15000);


  } catch (err) {

    console.error(err);

    await interaction.followUp("❌ Error descarga");
  }
}


// ==================
// SPOTIFY TRACK
// ==================
async function spotifyTrack(url, interaction) {

  await interaction.editReply("🎵 Leyendo Spotify...");


  try {

    const data = await spotify.getData(url);

    const artist = data.artists[0].name;
    const name = data.name;


    await downloadSong(
      `${artist} ${name}`,
      interaction,
      { title: name, artist }
    );


  } catch (err) {

    console.error(err);

    await interaction.editReply("❌ Error Spotify");
  }
}


// ==================
// SPOTIFY ALBUM
// ==================
async function spotifyAlbum(url, interaction) {

  await interaction.editReply("📀 Descargando álbum...");


  try {

    const data = await spotify.getData(url);

    const tracks = data?.tracks?.items || [];


    if (!tracks.length) {
      await interaction.editReply("❌ No hay canciones");
      return;
    }


    let i = 1;


    for (const track of tracks) {

      const artist = track.artists[0].name;
      const name = track.name;


      await interaction.followUp(`⬇️ (${i}/${tracks.length}) ${name}`);


      await downloadSong(
        `${artist} ${name}`,
        interaction,
        { title: name, artist }
      );


      await sleep(2000);

      i++;
    }


    await interaction.followUp("✅ Álbum terminado");


  } catch (err) {

    console.error(err);

    await interaction.editReply("❌ Error en álbum");
  }
}


// ==================
// PLAYLIST
// ==================
async function youtubePlaylist(url, interaction) {

  await interaction.editReply("📀 Descargando playlist...");


  try {

    const data = await ytdlp(url, {
      dumpSingleJson: true,
      skipDownload: true,
      quiet: true,

      cookies: COOKIES_FILE,
      jsRuntimes: "node"
    });


    const entries = data.entries || [];


    if (!entries.length) {

      await interaction.followUp("❌ No hay videos");

      return;
    }


    let i = 1;


    for (const video of entries) {

      await interaction.followUp(
        `⬇️ (${i}/${entries.length}) ${video.title}`
      );


      await downloadSong(video.webpage_url, interaction);


      await sleep(2000);

      i++;
    }


    await interaction.followUp("✅ Playlist terminada");


  } catch (err) {

    console.error(err);

    await interaction.followUp("❌ Error playlist");
  }
}


// ==================
// UTILS
// ==================
function sanitize(name) {
  return name.replace(/[<>:"\/\\|?*]/g, '');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}


// ==================
// LOGIN
// ==================
client.login(process.env.TOKEN);

