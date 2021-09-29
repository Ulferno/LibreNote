const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	// data of the command
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Displays the queue'),
	// array of guild ids, null for global command
	guilds: null,
	// method to run the command
	async run(interaction) {
		const member = interaction.member;

		if (!member) return interaction.reply({ content: 'You can only execute this command within a guild.', ephemeral: true });

		await interaction.deferReply();

		if (!member.voice.channelId) return interaction.editReply('You must be in a voice channel to run this command.');

		const connection = interaction.client.connections.get(interaction.guildId);

		if (!connection) {
			return interaction.editReply('No music is currently playing.');
		}

		const current = `Playing **[${connection.currentTrack.title}](${connection.currentTrack.url})**`;
		const queue = connection.queue
			.slice(0, 10)
			.map((track, index) => `${index + 1}. [${track.title}](${track.url}) | \`${new Date(Number(track.details.lengthSeconds) * 1000).toISOString().substr(11, 8)}\``)
			.join('\n');

		await interaction.editReply({
			embeds: [
				new MessageEmbed()
					.setDescription(`${current}\n\n${connection.shuffle ? '🔀 Shuffle enabled. Queue order will not be respected.\n\n' : ''}${connection.queue.length > 0 ? ('__Queue:__\n' + queue) : 'No tracks in the queue.'}`)
					.setFooter(`Showing ${Math.min(Math.max(connection.queue.length, 0), 10)} of ${connection.queue.length} tracks`),
			],
		});
	},
};