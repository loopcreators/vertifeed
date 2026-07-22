/**
 * VidFeed Gallery block editor component.
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

const ALLOWED_BLOCKS = [ 'vidfeed/video' ];
const TEMPLATE: [ string ][] = [ [ 'vidfeed/video' ] ];

const ASPECT_OPTIONS = [
	{ label: __( '9:16 (vertical)', 'vidfeed' ), value: '9/16' },
	{ label: __( '1:1 (square)', 'vidfeed' ), value: '1/1' },
	{ label: __( '4:5 (portrait)', 'vidfeed' ), value: '4/5' },
];

const ALIGN_OPTIONS = [
	{ label: __( 'Left', 'vidfeed' ), value: 'left' },
	{ label: __( 'Center', 'vidfeed' ), value: 'center' },
	{ label: __( 'Right', 'vidfeed' ), value: 'right' },
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
		createBlock( 'vidfeed/video', {
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

	const alignClass = `vidfeed__gallery--align-${ tileAlignment || 'left' }`;

	const blockProps = useBlockProps({
		className: 'vidfeed__feed vidfeed__feed--editor',
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
			{ __( 'Add videos', 'vidfeed' ) }
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
								label={ __( 'Add videos', 'vidfeed' ) }
								onClick={ open }
							/>
						) }
					/>
				</MediaUploadCheck>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Videos', 'vidfeed' ) }>
					<p className="vidfeed__add-videos-help">
						{ __(
							'Select multiple videos from the Media Library to add them as a gallery in one go.',
							'vidfeed'
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
				<PanelBody title={ __( 'Gallery', 'vidfeed' ) }>
					<RangeControl
						label={ __( 'Columns', 'vidfeed' ) }
						value={ columns }
						onChange={ ( value?: number ) =>
							setAttributes( { columns: value } )
						}
						min={ 1 }
						max={ 6 }
					/>
					<RangeControl
						label={ __( 'Gap (px)', 'vidfeed' ) }
						value={ gap }
						onChange={ ( value?: number ) =>
							setAttributes( { gap: value } )
						}
						min={ 0 }
						max={ 48 }
					/>
					<SelectControl
						label={ __( 'Tile aspect ratio', 'vidfeed' ) }
						value={ tileAspectRatio }
						options={ ASPECT_OPTIONS }
						onChange={ ( value: string ) =>
							setAttributes( { tileAspectRatio: value } )
						}
					/>
					<SelectControl
						label={ __( 'Gallery alignment', 'vidfeed' ) }
						value={ tileAlignment || 'left' }
						options={ ALIGN_OPTIONS }
						onChange={ ( value: string ) =>
							setAttributes( { tileAlignment: value } )
						}
						help={ __(
							'Align tiles when a row is not full.',
							'vidfeed'
						) }
					/>
				</PanelBody>
				<PanelBody
					title={ __( 'Player settings', 'vidfeed' ) }
					initialOpen={ false }
				>
					<ToggleControl
						label={ __( 'Autoplay in overlay', 'vidfeed' ) }
						checked={ autoplay }
						onChange={ ( value: boolean ) =>
							setAttributes( { autoplay: value } )
						}
						help={ __(
							'Automatically play the active reel when opened (muted).',
							'vidfeed'
						) }
					/>
					<ToggleControl
						label={ __( 'Loop feed', 'vidfeed' ) }
						checked={ loopFeed }
						onChange={ ( value: boolean ) =>
							setAttributes( { loopFeed: value } )
						}
						help={ __(
							'Return to the first reel after the last one ends.',
							'vidfeed'
						) }
					/>
					<ToggleControl
						label={ __( 'Show progress bar', 'vidfeed' ) }
						checked={ showProgress }
						onChange={ ( value: boolean ) =>
							setAttributes( { showProgress: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Show mute toggle', 'vidfeed' ) }
						checked={ showMuteToggle }
						onChange={ ( value: boolean ) =>
							setAttributes( { showMuteToggle: value } )
						}
					/>
					<ToggleControl
						label={ __( 'Show branding', 'vidfeed' ) }
						checked={ showBranding }
						onChange={ ( value: boolean ) =>
							setAttributes( { showBranding: value } )
						}
						help={ __(
							'Opt in to show a "Made With VidFeed" label in the player.',
							'vidfeed'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div
					className={ `vidfeed__gallery vidfeed__gallery--editor ${ alignClass }` }
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
