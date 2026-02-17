client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // =========================
  // COMANDO /buscar
  // =========================
  if (interaction.commandName === 'buscar') {

    const query = interaction.options.getString('query');

    await interaction.reply("🔍 Procesando...");

    try {

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

      if (query.includes('playlist') || query.includes('list=')) {
        await downloadReminderPlaylist(query, interaction);
        return;
      }

      await downloadSong(query, interaction);

    } catch (err) {

      console.error(err);

      await interaction.followUp("❌ Error al descargar");
    }

    return;
  }


  // =========================
  // COMANDO /limpiar
  // =========================
  if (interaction.commandName === 'limpiar') {

    try {

      const files = fs.readdirSync('./downloads');

      if (!files.length) {

        await interaction.reply("📁 La carpeta ya está vacía");
        return;
      }

      let count = 0;

      for (const file of files) {

        const path = `./downloads/${file}`;

        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
          count++;
        }
      }

      await interaction.reply(`🧹 Limpieza completa: ${count} archivos borrados`);

    } catch (err) {

      console.error("Clean Error:", err);

      await interaction.reply("❌ Error al limpiar carpeta");
    }
  }

});

