const fs = require('fs');
const path = require('path');
const { Client, Collection, Intents } = require('discord.js');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });
const Redis = require('./utility/redis');

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, '/commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(path.join(__dirname, '/commands', file));
	client.commands.set(command.data.name, command);
}

client.connections = new Map();
client.db = new Redis();

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setPresence({ activities: [{ name: 'music' }], status: 'online' });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.run(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.editReply('There was an error while executing this command!');
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('voiceStateUpdate', async (oldState, newState) => {
	// leave channel if no one else is in there and destroy the queue
	const connection = client.connections.get(oldState.guild.id);
	if (!!connection && (oldState.channelId != newState.channelId) && (oldState.member.id != client.id)) {
		if (connection.voiceConnection.joinConfig.channelId == oldState.channelId) {
			if (oldState.channel.members.size == 1) {
				connection.voiceConnection.destroy();
				client.connections.delete(oldState.guild.id);
			}
		}
	}
});

client.login(process.env.BOT_TOKEN);