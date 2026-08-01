/**
 * VertiFeed Video block registration.
 */
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import './editor.scss';
import Edit from './edit';
import metadata from './block.json';
import { vertifeedIcon } from '../icons/vertifeed';

registerBlockType( metadata.name, {
	...metadata,
	icon: vertifeedIcon,
	edit: Edit,
	save: () => null,
} as unknown as Parameters< typeof registerBlockType >[ 1 ] );
