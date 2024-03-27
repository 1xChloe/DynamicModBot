import { ApplicationCommand, CommandInteraction, CommandInteractionOption, Interaction, PermissionString } from "discord.js";

type command_run = (interaction: CommandInteraction, ...args) => Promise<void>;

type command_config = {
	name: string,
	description: string,
	category?: string,
	ephemeral?: boolean,
	permissions?: PermissionString[],
	options?: CommandInteractionOption[],
	guild_id?: string,
	no_defer?: boolean,
	is_developer?: boolean
}

export function create_command(cb: command_run, config: command_config): void
export function get_command(name: string): {run: command_run, config: command_config}
export const list: {[name: string]: ApplicationCommand}