import * as path from "node:path";
import {
	NoSubscriberBehavior,
	VoiceConnectionStatus,
	createAudioPlayer,
	joinVoiceChannel,
} from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../discord";
import { AudioQueue } from "../audioQueue";

// Create a global instance of the queue
const audioQueue = new AudioQueue();

export const command: Command = {
	data: new SlashCommandBuilder()
		.setName("tanska")
		.setDescription("Tanska on paska maa!"),

	async execute(interaction) {
		try {
			const member = interaction.member;
			if (!member?.voice?.channel) {
				return interaction.reply("You need to be in a voice channel!");
			}

			const guildId = interaction.guild.id;
			const audioPath = path.join(
				__dirname,
				"../../sounds/tanskaonpaskamaa.mp3",
			);

			// Add the audio to the queue
			audioQueue.addToQueue(guildId, {
				audioPath,
				guildId,
				requestedBy: interaction.user.id,
			});

			// If nothing is playing, set up the connection and start playing
			if (!audioQueue.getIsPlaying(guildId)) {
				const connection = joinVoiceChannel({
					channelId: member.voice.channel.id,
					guildId: guildId,
					adapterCreator: interaction.guild.voiceAdapterCreator,
				});

				audioQueue.setConnection(guildId, connection);

				connection.on(VoiceConnectionStatus.Ready, () => {
					console.log("Connection is ready!");
				});

				connection.on("error", (error) => {
					console.error("Connection error:", error);
					audioQueue.setIsPlaying(guildId, false);
				});

				const player = createAudioPlayer({
					behaviors: {
						noSubscriber: NoSubscriberBehavior.Pause,
					},
				});

				audioQueue.setPlayer(guildId, player);

				const subscription = connection.subscribe(player);
				if (!subscription) {
					console.error("Failed to subscribe to the audio player");
					return;
				}

				player.on("stateChange", (oldState, newState) => {
					console.log(
						`Audio player state changed from ${oldState.status} to ${newState.status}`,
					);

					if (newState.status === "idle") {
						audioQueue.setIsPlaying(guildId, false);
						// Play next item in queue if it exists
						audioQueue.playNext(guildId);

						// If queue is empty, schedule disconnect
						if (audioQueue.getQueue(guildId).length === 0) {
							setTimeout(() => {
								connection.destroy();
							}, 900_000); // Wait 15 minutes before disconnecting
						}
					}
				});

				player.on("error", (error) => {
					console.error(`Error: ${error.message}`);
					audioQueue.setIsPlaying(guildId, false);
					setTimeout(() => {
						connection.destroy();
					}, 2000);
				});

				// Start playing the queue
				await audioQueue.playNext(guildId);
				await interaction.reply("Tanska on paska maa! Added to queue.");
			} else {
				await interaction.reply(
					`Added to queue! Position: ${audioQueue.getQueue(guildId).length}`,
				);
			}
		} catch (error) {
			console.error("Error in tanska command:", error);
			audioQueue.setIsPlaying(interaction.guild.id, false);
			await interaction.followUp("There was an error playing the audio!");
		}
	},
};

// Add a new command to show the current queue
export const queueCommand: Command = {
	data: new SlashCommandBuilder()
		.setName("queue")
		.setDescription("Show the current audio queue"),

	async execute(interaction) {
		const guildId = interaction.guild.id;
		const queue = audioQueue.getQueue(guildId);

		if (queue.length === 0) {
			return interaction.reply("The queue is currently empty!");
		}

		const queueList = queue
			.map(
				(item, index) => `${index + 1}. Requested by: <@${item.requestedBy}>`,
			)
			.join("\n");

		return interaction.reply(`Current Queue:\n${queueList}`);
	},
};
