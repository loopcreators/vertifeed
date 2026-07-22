/**
 * VidFeed Video block registration.
 */
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import './editor.scss';
import Edit from './edit';
import metadata from './block.json';

registerBlockType( metadata.name, {
	...metadata,
	edit: Edit,
	save: () => null,
} as unknown as Parameters< typeof registerBlockType >[ 1 ] );
