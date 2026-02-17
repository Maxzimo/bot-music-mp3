require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // ID del bot
const GUILD_ID = process.env.GUILD_ID;   // ID del servidor


const commands = [

  new SlashCommandBuilder()
    .setName('buscar')
    .setDescription('Descargar música')
    .addStringOption(option =>
      option
        .setName('query')
        .setDescription('Link o nombre de canción')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('limpiar')
    .setDescription('Borra todas las descargas')

].map(cmd => cmd.toJSON());


const rest = new REST({ version: '10' }).setToken(TOKEN);


(async () => {
  try {

    console.log('⏳ Registrando comandos...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente');

  } catch (error) {

    console.error('❌ Error registrando comandos:', error);
  }
})();
