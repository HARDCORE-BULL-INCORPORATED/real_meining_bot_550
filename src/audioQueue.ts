import {
	type AudioPlayer,
	StreamType,
	type VoiceConnection,
	createAudioResource,
} from "@discordjs/voice";

// Queue system interface
interface QueueItem {
	audioPath: string;
	guildId: string;
	requestedBy: string;
}

export class AudioQueue {
	private queue: Map<string, QueueItem[]> = new Map();
	private connections: Map<string, VoiceConnection> = new Map();
	private players: Map<string, AudioPlayer> = new Map();
	private isPlaying: Map<string, boolean> = new Map();

	constructor() {
		this.queue = new Map();
		this.connections = new Map();
		this.players = new Map();
		this.isPlaying = new Map();
	}

	addToQueue(guildId: string, item: QueueItem) {
		if (!this.queue.has(guildId)) {
			this.queue.set(guildId, []);
		}
		this.queue.get(guildId)?.push(item);
	}

	removeFromQueue(guildId: string) {
		const guildQueue = this.queue.get(guildId);
		if (guildQueue && guildQueue.length > 0) {
			return guildQueue.shift();
		}
		return null;
	}

	getQueue(guildId: string): QueueItem[] {
		return this.queue.get(guildId) || [];
	}

	setConnection(guildId: string, connection: VoiceConnection) {
		this.connections.set(guildId, connection);
	}

	getConnection(guildId: string): VoiceConnection | undefined {
		return this.connections.get(guildId);
	}

	setPlayer(guildId: string, player: AudioPlayer) {
		this.players.set(guildId, player);
	}

	getPlayer(guildId: string): AudioPlayer | undefined {
		return this.players.get(guildId);
	}

	setIsPlaying(guildId: string, status: boolean) {
		this.isPlaying.set(guildId, status);
	}

	getIsPlaying(guildId: string): boolean {
		return this.isPlaying.get(guildId) || false;
	}

	async playNext(guildId: string) {
		if (this.getIsPlaying(guildId)) return;

		const nextItem = this.removeFromQueue(guildId);
		if (!nextItem) return;

		const connection = this.getConnection(guildId);
		if (!connection) return;

		const player = this.getPlayer(guildId);
		if (!player) return;

		const resource = createAudioResource(nextItem.audioPath, {
			inputType: StreamType.Opus,
			inlineVolume: true,
		});

		this.setIsPlaying(guildId, true);
		player.play(resource);
	}
}
