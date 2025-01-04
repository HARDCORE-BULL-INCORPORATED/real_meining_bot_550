import type { Collection } from "discord.js";

declare module "discord.js" {
	export interface Client {
		commands: Collection<string, Command>;
	}
}

export interface Command {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: SlashCommandBuilder | any;
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
