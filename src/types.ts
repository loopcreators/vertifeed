/**
 * Shared TypeScript types for VertiFeed blocks.
 */

/** Minimal shape of a WordPress media (attachment) REST object. */
export interface WpMedia {
	id: number;
	source_url?: string;
	/** Top-level media type, e.g. 'image' or 'file'. */
	media_type?: string;
	/** MIME type, e.g. 'image/jpeg' or 'video/mp4'. */
	mime_type?: string;
	title?: { rendered?: string };
	media_details?: {
		sizes?: Record< string, { source_url?: string } | undefined >;
	};
}

export interface VideoItemAttributes {
	videoId: number;
	title: string;
	caption: string;
	posterId: number;
	// Satisfies the `Record<string, unknown>` constraint on BlockEditProps.
	[ key: string ]: unknown;
}

export interface GalleryAttributes {
	columns: number;
	gap: number;
	tileAspectRatio: string;
	tileAlignment: string;
	autoplay: boolean;
	loopFeed: boolean;
	showProgress: boolean;
	showMuteToggle: boolean;
	showBranding: boolean;
	// Satisfies the `Record<string, unknown>` constraint on BlockEditProps.
	[ key: string ]: unknown;
}
