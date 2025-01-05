import * as path from "node:path";
import {
	NoSubscriberBehavior,
	StreamType,
	VoiceConnectionStatus,
	createAudioPlayer,
	createAudioResource,
	joinVoiceChannel,
} from "@discordjs/voice";
import { SlashCommandBuilder } from "discord.js";
import type { Command } from "../../discord";

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

			await interaction.reply("Tanska on paska maa!");

			const connection = joinVoiceChannel({
				channelId: member.voice.channel.id,
				guildId: interaction.guild.id,
				adapterCreator: interaction.guild.voiceAdapterCreator,
			});

			// Handle connection ready state
			connection.on(VoiceConnectionStatus.Ready, () => {
				console.log("Connection is ready!");
			});

			// Handle connection errors
			connection.on("error", (error) => {
				console.error("Connection error:", error);
			});

			const player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Pause,
				},
			});

			const audioPath = path.join(
				__dirname,
				"../../sounds/tanskaonpaskamaa.mp3",
			);
			console.log("Audio file path:", audioPath);
			console.log(player);

			const resource = createAudioResource(audioPath, {
				inputType: StreamType.Opus,
				inlineVolume: true,
			});

			const subscription = connection.subscribe(player);

			if (!subscription) {
				console.error("Failed to subscribe to the audio player");
				return;
			}

			// Handle player state changes
			player.on("stateChange", (oldState, newState) => {
				console.log(
					`Audio player state changed from ${oldState.status} to ${newState.status}`,
				);
			});

			// Only destroy the connection after the audio has finished playing
			player.on("stateChange", (oldState, newState) => {
				if (newState.status === "idle") {
					setTimeout(() => {
						connection.destroy();
					}, 69_000_000_000); // Wait 2 seconds before disconnecting
				}
			});

			player.on("error", (error) => {
				console.error(`Error: ${error.message}`);
				setTimeout(() => {
					connection.destroy();
				}, 2000);
			});
			player.play(resource);
		} catch (error) {
			console.error("Error in tanska command:", error);
			await interaction.followUp("There was an error playing the audio!");
		}
	},
};
