/**
 * VertiFeed Video block editor component.
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	MediaUpload,
	MediaUploadCheck,
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	TextareaControl,
	ToolbarButton,
	Placeholder,
	Button,
} from '@wordpress/components';
import { video as videoIcon } from '@wordpress/icons';
import { useDispatch, useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import type { BlockEditProps, Block } from '@wordpress/blocks';
import type { VideoItemAttributes, WpMedia } from '../types';

interface MediaUploadRenderArgs {
	open: () => void;
}

interface SelectedMedia {
	id: number;
	type?: string;
	mime?: string;
}

function isVideoMedia( media: SelectedMedia ): boolean {
	if ( ! media?.id ) {
		return false;
	}
	if ( media.type === 'video' || media.mime?.startsWith( 'video/' ) ) {
		return true;
	}
	return ! media.type && ! media.mime;
}

export default function Edit( {
	attributes,
	setAttributes,
	clientId,
}: BlockEditProps< VideoItemAttributes > ) {
	const { videoId, title, caption, posterId } = attributes;

	const { replaceBlocks } = useDispatch( blockEditorStore ) as {
		replaceBlocks: (
			clientIds: string | string[],
			blocks: Block | Block[]
		) => void;
	};

	const video = useSelect(
		( select ): WpMedia | null => {
			if ( ! videoId ) {
				return null;
			}
			return (
				( select( 'core' ) as {
					getMedia: ( id: number ) => WpMedia | undefined;
				} ).getMedia( videoId ) ?? null
			);
		},
		[ videoId ]
	);

	const poster = useSelect(
		( select ): WpMedia | null => {
			if ( ! posterId ) {
				return null;
			}
			return (
				( select( 'core' ) as {
					getMedia: ( id: number ) => WpMedia | undefined;
				} ).getMedia( posterId ) ?? null
			);
		},
		[ posterId ]
	);

	const blockProps = useBlockProps( {
		className: 'vertifeed__item vertifeed__item--editor',
	} );

	const onSelectVideo = ( media: SelectedMedia | SelectedMedia[] ) => {
		const selected = ( Array.isArray( media ) ? media : [ media ] ).filter(
			isVideoMedia
		);

		if ( ! selected.length ) {
			return;
		}

		if ( selected.length === 1 ) {
			setAttributes( {
				videoId: selected[ 0 ].id,
				posterId: selected[ 0 ].id,
			} );
			return;
		}

		// Multiple videos: replace this item with one reel item per video.
		replaceBlocks(
			clientId,
			selected.map( ( item ) =>
				createBlock( 'vertifeed/video', {
					videoId: item.id,
					posterId: item.id,
					...( selected[ 0 ].id === item.id
						? { title, caption }
						: {} ),
				} )
			)
		);
	};

	const onSelectPoster = ( media: SelectedMedia ) => {
		setAttributes( { posterId: media.id } );
	};

	const removeVideo = () => {
		setAttributes( { videoId: 0, posterId: 0 } );
	};

	const isImageMedia = ( media?: WpMedia | null ): boolean =>
		!! media &&
		( media.media_type === 'image' ||
			!! media.mime_type?.startsWith( 'image/' ) );

	// Only treat the poster as a usable image when it actually points to an
	// image attachment. The default posterId mirrors the video attachment,
	// whose source_url is an MP4 and must not be rendered in an <img>.
	const posterIsImage = isImageMedia( poster );
	const posterImageUrl = posterIsImage
		? poster?.media_details?.sizes?.medium?.source_url || poster?.source_url
		: undefined;
	const posterThumbUrl = posterIsImage
		? poster?.media_details?.sizes?.thumbnail?.source_url ||
		  poster?.source_url
		: undefined;

	// Fallback used everywhere a thumbnail is shown: the video's first frame,
	// matching the frontend gallery tile behaviour.
	const firstFrameSrc = video?.source_url
		? `${ video.source_url }#t=0.1`
		: undefined;

	const videoName =
		video?.title?.rendered ||
		( video?.source_url ? video.source_url.split( '/' ).pop() : '' );

	const renderThumb = ( imageUrl?: string ) => {
		if ( imageUrl ) {
			return <img src={ imageUrl } alt="" />;
		}
		if ( firstFrameSrc ) {
			return (
				<video
					src={ firstFrameSrc }
					muted
					playsInline
					preload="metadata"
					tabIndex={ -1 }
					aria-hidden="true"
				/>
			);
		}
		return (
			<span className="vertifeed__selected-icon">{ '\u25B6' }</span>
		);
	};

	return (
		<>
			<BlockControls>
				<MediaUploadCheck>
					<MediaUpload
						onSelect={ onSelectVideo }
						allowedTypes={ [ 'video' ] }
						value={ videoId || undefined }
						multiple={ ! videoId }
						render={ ( { open }: MediaUploadRenderArgs ) => (
							<ToolbarButton
								icon={ videoIcon }
								label={
									videoId
										? __( 'Replace video', 'vertifeed' )
										: __( 'Select videos', 'vertifeed' )
								}
								onClick={ open }
							/>
						) }
					/>
				</MediaUploadCheck>
			</BlockControls>

			<InspectorControls>
				<PanelBody title={ __( 'Video', 'vertifeed' ) }>
					{ videoId > 0 && (
						<div className="vertifeed__selected">
							<span className="vertifeed__selected-thumb">
								{ renderThumb( posterImageUrl ) }
							</span>
							<span className="vertifeed__selected-info">
								<span className="vertifeed__selected-name">
									{ videoName ||
										__( 'Selected video', 'vertifeed' ) }
								</span>
								<span className="vertifeed__selected-meta">
									{ sprintf(
										/* translators: %d: attachment ID */
										__( 'ID: %d', 'vertifeed' ),
										videoId
									) }
								</span>
							</span>
						</div>
					) }
					<MediaUploadCheck>
						<MediaUpload
							onSelect={ onSelectVideo }
							allowedTypes={ [ 'video' ] }
							value={ videoId || undefined }
							multiple={ ! videoId }
							render={ ( { open }: MediaUploadRenderArgs ) => (
								<Button variant="secondary" onClick={ open }>
									{ videoId
										? __( 'Replace video', 'vertifeed' )
										: __( 'Select videos', 'vertifeed' ) }
								</Button>
							) }
						/>
					</MediaUploadCheck>
					{ videoId > 0 && (
						<Button
							variant="link"
							isDestructive
							onClick={ removeVideo }
							style={ { marginTop: '8px' } }
						>
							{ __( 'Remove video', 'vertifeed' ) }
						</Button>
					) }
				</PanelBody>
				{ videoId > 0 && (
					<PanelBody
						title={ __( 'Poster / thumbnail', 'vertifeed' ) }
						initialOpen={ false }
					>
						<div className="vertifeed__selected">
							<span className="vertifeed__selected-thumb">
								{ renderThumb( posterThumbUrl ) }
							</span>
							<span className="vertifeed__selected-info">
								<span className="vertifeed__selected-name">
									{ posterIsImage && posterId !== videoId
										? poster?.title?.rendered ||
										  __( 'Poster image', 'vertifeed' )
										: __( 'Video frame', 'vertifeed' ) }
								</span>
								<span className="vertifeed__selected-meta">
									{ posterIsImage && posterId !== videoId
										? sprintf(
												/* translators: %d: attachment ID */
												__( 'ID: %d', 'vertifeed' ),
												posterId
										  )
										: __(
												'Using video frame',
												'vertifeed'
										  ) }
								</span>
							</span>
						</div>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectPoster }
								allowedTypes={ [ 'image' ] }
								value={ posterId }
								render={ ( { open }: MediaUploadRenderArgs ) => (
									<Button variant="secondary" onClick={ open }>
										{ posterId > 0 && posterId !== videoId
											? __(
													'Replace poster image',
													'vertifeed'
											  )
											: __(
													'Select poster image',
													'vertifeed'
											  ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
						{ posterId > 0 && posterId !== videoId && (
							<Button
								variant="link"
								isDestructive
								onClick={ () =>
									setAttributes( { posterId: videoId } )
								}
								style={ { marginTop: '8px' } }
							>
								{ __( 'Remove poster image', 'vertifeed' ) }
							</Button>
						) }
						<p className="vertifeed__poster-help">
							{ __(
								'This image is used as the gallery thumbnail and the video poster.',
													'vertifeed'
							) }
						</p>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Content', 'vertifeed' ) }>
					<TextControl
						label={ __( 'Title', 'vertifeed' ) }
						value={ title }
						onChange={ ( value: string ) =>
							setAttributes( { title: value } )
						}
						help={ __(
							'Bold heading shown over the reel.',
													'vertifeed'
						) }
					/>
					<TextareaControl
						label={ __( 'Description', 'vertifeed' ) }
						value={ caption }
						onChange={ ( value: string ) =>
							setAttributes( { caption: value } )
						}
						help={ __(
							'Short text shown under the title.',
													'vertifeed'
						) }
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				{ ! videoId ? (
					<Placeholder
						icon={ videoIcon }
						label={ __( 'VertiFeed Video', 'vertifeed' ) }
						instructions={ __(
							'Select one or more videos from the Media Library.',
							'vertifeed'
						) }
					>
						<MediaUploadCheck>
							<MediaUpload
								onSelect={ onSelectVideo }
								allowedTypes={ [ 'video' ] }
								multiple
								render={ ( { open }: MediaUploadRenderArgs ) => (
									<Button variant="primary" onClick={ open }>
										{ __( 'Select videos', 'vertifeed' ) }
									</Button>
								) }
							/>
						</MediaUploadCheck>
					</Placeholder>
				) : (
					<>
						{ posterImageUrl ? (
							<img
								className="vertifeed__poster-preview"
								src={ posterImageUrl }
								alt={
									video?.title?.rendered ||
									__( 'Video preview', 'vertifeed' )
								}
							/>
						) : firstFrameSrc ? (
							<video
								className="vertifeed__poster-preview"
								src={ firstFrameSrc }
								muted
								playsInline
								preload="metadata"
								tabIndex={ -1 }
								aria-hidden="true"
							/>
						) : (
							<div className="vertifeed__poster-preview vertifeed__poster-preview--empty">
								{ video?.title?.rendered ||
									__( 'Video selected', 'vertifeed' ) }
							</div>
						) }
						{ ( title || caption ) && (
							<div className="vertifeed__meta-preview">
								{ title && (
									<span className="vertifeed__title-preview">
										{ title }
									</span>
								) }
								{ caption && (
									<span className="vertifeed__desc-preview">
										{ caption }
									</span>
								) }
							</div>
						) }
					</>
				) }
			</div>
		</>
	);
}
