import * as fs from "node:fs";
import * as path from "node:path";
import {
	Client,
	Collection,
	Events,
	GatewayIntentBits,
	REST,
	Routes,
} from "discord.js";
import type { Command } from "./discord";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
});

import { clientId as CLIENT_ID, token as TOKEN } from "./config.json";

client.commands = new Collection<string, Command>();

const rest = new REST().setToken(TOKEN);

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const { command } = require(filePath);

	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command);
	}
}

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: "There was an error executing this command!",
				ephemeral: true,
			});
		} else {
			await interaction.reply({
				content: "There was an error executing this command!",
				ephemeral: true,
			});
		}
	}
});

// Deploy commands
async function deployCommands() {
	const commands = [];
	const commandFiles = fs
		.readdirSync(commandsPath)
		.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		console.log(file);

		const { command } = require(filePath);
		commands.push(command.data.toJSON());
	}

	try {
		console.log("Started refreshing application (/) commands.");
		console.log(commands);

		await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
}

client.once(Events.ClientReady, () => {
	deployCommands();
	console.log("Ready!");
});

client.login(TOKEN);
