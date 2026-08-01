/**
 * VertiFeed brand mark for Gutenberg block icons (24×24, currentColor).
 * Matches the final 3-bar vertical feed + play mark.
 */
import { SVG, Path, Rect } from '@wordpress/primitives';

export const vertifeedIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		{ /* Left rail */ }
		<Rect x="3.5" y="4" width="2.5" height="16" rx="1.25" fill="currentColor" opacity="0.55" />
		{ /* Center stage with play cutout */ }
		<Path
			fill="currentColor"
			fillRule="evenodd"
			clipRule="evenodd"
			d="M8 4h7.5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2.4 5.2 4.2 2.4a.9.9 0 0 1 0 1.55l-4.2 2.4A.9.9 0 0 1 9.1 14.7V9.9A.9.9 0 0 1 10.4 9.2Z"
		/>
		{ /* Right rail */ }
		<Rect x="18" y="4" width="3" height="16" rx="1.5" fill="currentColor" />
	</SVG>
);
