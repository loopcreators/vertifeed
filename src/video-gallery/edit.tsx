/**
 * VertiFeed Gallery block editor component.
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InnerBlocks,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
	ToolbarButton,
	Button,
} from '@wordpress/components';
import { gallery as galleryIcon } from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import type { BlockEditProps, Block } from '@wordpress/blocks';
import type { GalleryAttributes } from '../types';

const ALLOWED_BLOCKS = [ 'vertifeed/video' ];
const TEMPLATE: [ string ][] = [ [ 'vertifeed/video' ] ];

const ASPECT_OPTIONS = [
	{ label: __( '9:16 (vertical)', 'vertifeed' ), value: '9/16' },
	{ label: __( '1:1 (square)', 'vertifeed' ), value: '1/1' },
	{ label: __( '4:5 (portrait)', 'vertifeed' ), value: '4/5' },
];

const ALIGN_OPTIONS = [
	{ label: __( 'Left', 'vertifeed' ), value: 'left' },
	{ label: __( 'Center', 'vertifeed' ), value: 'center' },
	{ label: __( 'Right', 'vertifeed' ), value: 'right' },
];

interface MediaUploadRenderArgs {
	open: () => void;
}

interface SelectedMedia {
	id: number;
	type?: string;
	mime?: string;
}

function formatAspectRatio( ratio: string ): string {
	const parts = ratio.split( '/' );
	return parts.length === 2 ? `${ parts[ 0 ] } / ${ parts[ 1 ] }` : '9 / 16';
}

function isVideoMedia( media: SelectedMedia ): boolean {
	if ( ! media?.id ) {
		return false;
	}
	if ( media.type === 'video' || media.mime?.startsWith( 'video/' ) ) {
		return true;
	}
	// Media Library may omit type/mime for already-known video attachments.
	return ! media.type && ! media.mime;
}

function createVideoItemBlocks( mediaItems: SelectedMedia[] ) {
	return mediaItems.filter( isVideoMedia ).map( ( media ) =>
		createBlock( 'vertifeed/video', {
			videoId: media.id,
			posterId: media.id,
		} )
	);
}

export default function Edit( {
	attributes,
	setAttributes,
	clientId,
}: BlockEditProps< GalleryAttributes > ) {
	const {
		columns,
		gap,
		tileAspectRatio,
		tileAlignment,
		autoplay,
		loopFeed,
		showProgress,
		showMuteToggle,
		showBranding,
	} = attributes;

	const { replaceInnerBlocks, insertBlocks } = useDispatch(
		blockEditorStore
	) as {
		replaceInnerBlocks: (
			rootClientId: string,
			blocks: Block[],
			updateSelection?: boolean
		) => void;
		insertBlocks: (
			blocks: Block | Block[],
			index?: number,
			rootClientId?: string,
			updateSelection?: boolean
		) => void;
	};

	const innerBlocks = useSelect(
		( select ): Block[] =>
			(
				select( blockEditorStore ) as unknown as {
					getBlocks: ( id: string ) => Block[];
				}
			).getBlocks( clientId ),
		[ clientId ]
	);

	const onSelectVideos = ( media: SelectedMedia | SelectedMedia[] ) => {
		const selected = Array.isArray( media ) ? media : [ media ];
		const newBlocks = createVideoItemBlocks( selected );

		if ( ! newBlocks.length ) {
			return;
		}

		const onlyEmptyPlaceholders =
			innerBlocks.length > 0 &&
			innerBlocks.every(
				( block ) => ! ( block.attributes?.videoId as number )
			);

		if ( onlyEmptyPlaceholders || innerBlocks.length === 0 ) {
			replaceInnerBlocks( clientId, newBlocks, false );
			return;
		}

		insertBlocks( newBlocks, undefined, clientId, false );
	};

	const alignClass = `vertifeed__gallery--align-${ tileAlignment || 'left' }`;

	const blockProps = useBlockProps({
		className: 'vertifeed__feed vertifeed__feed--editor',
		style: {
			'--vf-columns': columns,
			'--vf-gap': `${ gap }px`,
			'--vf-tile-aspect': formatAspectRatio( tileAspectRatio ),
		},
	} );

	const addVideosButton = ( {
		open,
		variant = 'secondary',
	}: MediaUploadRenderArgs & {
		variant?: 'primary' | 'secondary';
	} ) => (
		<Button variant={ variant } onClick={ open }>
			{ __( 'Add videos', 'vertifeed' ) }
		</Button>
	);

	return (
		<>
			<BlockControls group="other">
				<MediaUploadCheck>
					<MediaUpload
						onSelect={ onSelectVideos }
						allowedTypes={ [ 'video' ] }
						multiple
						render={ ( { open }: MediaUploadRenderArgs ) => (
							<ToolbarButton
								icon={ galleryIcon }
								label={ __( 'Add videos', 'vertifeed' ) }
								onClick={ open }
							/>
						) }
					/>
				</MediaUploadCheck>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Videos', 'vertifeed' ) }>
					<p className="vertifeed__add-videos-help">
						{ __(
							'Select multiple videos from the Media Library to add them as a gallery in one go.',
							'vertifeed'
						) }
					</p>
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectVideos }
							allowedTypes={ [ 'video' ] }
							multiple
							render={ ( {
								open,
							}: MediaUploadRenderArgs ) =>
								addVideosButton( { open, variant: 'secondary' } )
							}
						/>
					</MediaUploadCheck>
				</PanelBody>
				<PanelBody title={ __( 'Gallery', 'vertifeed' ) }>
					<RangeControl
						label={ __( 'Columns', 'vertifeed' ) }
						value={ columns }
						onChange={ ( value?: number ) =>
							setAttributes( { columns: value } )
						}
						min={ 1 }
						max={ 6 }
					/>
					<RangeControl
						label={ __( 'Gap (px)', 'vertifeed' ) }
						value={ gap }
						onChange={ ( value?: number ) =>
							setAttributes( { gap: value } )
						}
						min={ 0 }
						max={ 48 }
					/>
					<SelectControl
						label={ __( 'Tile aspect ratio', 'vertifeed' ) }
						value={ tileAspectRatio }
						options={ ASPECT_OPTIONS }
						onChange={ ( value: string ) =>
							setAttributes( { tileAspectRatio: value } )
						}
					/>
					<SelectControl
						label={ __( 'Gallery alignment', 'vertifeed' ) }
						value={ tileAlignment || 'left' }
						options={ ALIGN_OPTIONS }
						onChange={ ( value: string ) =>
							setAttributes( { tileAlignment: value } )
						}
						help={ __(
							'Align tiles when a row is not full.',
							'vertifeed'
						) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Player settings', 'vertifeed' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Autoplay in overlay', 'vertifeed' ) }
						checked={ autoplay }
						onChange={ ( value: boolean ) =>
							setAttributes( { autoplay: value } )
						}
						help={ __(
							'Automatically play the active reel when opened (muted).',
							'vertifeed'
						) }
					/>
					<ToggleControl
						label={ __( 'Loop feed', 'vertifeed' ) }
						checked={ loopFeed }
						onChange={ ( value: boolean ) =>
							setAttributes( { loopFeed: value } )
						}
						help={ __(
							'Return to the first reel after the last one ends.',
							'vertifeed'
						) }
					/>
					<ToggleControl
						label={ __( 'Show progress bar', 'vertifeed' ) }
						checked={ showProgress }
						onChange={ ( value: boolean ) =>
							setAttributes( { showProgress: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Show mute toggle', 'vertifeed' ) }
						checked={ showMuteToggle }
						onChange={ ( value: boolean ) =>
							setAttributes( { showMuteToggle: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Show branding', 'vertifeed' ) }
						checked={ showBranding }
						onChange={ ( value: boolean ) =>
							setAttributes( { showBranding: value } )
						}
						help={ __(
							'Opt in to show a "Made With VertiFeed" label in the player.',
							'vertifeed'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div
					className={ `vertifeed__gallery vertifeed__gallery--editor ${ alignClass }` }
				>
					<InnerBlocks
						allowedBlocks={ ALLOWED_BLOCKS }
						template={ TEMPLATE }
						renderAppender={ InnerBlocks.ButtonBlockAppender }
					/>
				</div>
			</div>
		</>
	);
}
