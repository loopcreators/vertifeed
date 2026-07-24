<?php
/**
 * VertiFeed Gallery block render callback.
 *
 * @package VertiFeed
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$vertifeed_columns          = isset( $attributes['columns'] ) ? max( 1, min( 6, (int) $attributes['columns'] ) ) : 3;
$vertifeed_gap              = isset( $attributes['gap'] ) ? max( 0, min( 48, (int) $attributes['gap'] ) ) : 8;
$vertifeed_tile_aspect      = isset( $attributes['tileAspectRatio'] ) ? $attributes['tileAspectRatio'] : '9/16';
$vertifeed_tile_alignment   = isset( $attributes['tileAlignment'] ) ? $attributes['tileAlignment'] : 'left';
$vertifeed_autoplay         = isset( $attributes['autoplay'] ) ? (bool) $attributes['autoplay'] : true;
$vertifeed_loop_feed        = isset( $attributes['loopFeed'] ) ? (bool) $attributes['loopFeed'] : true;
$vertifeed_show_progress    = isset( $attributes['showProgress'] ) ? (bool) $attributes['showProgress'] : true;
$vertifeed_show_mute_toggle = isset( $attributes['showMuteToggle'] ) ? (bool) $attributes['showMuteToggle'] : true;
$vertifeed_show_branding    = isset( $attributes['showBranding'] ) ? (bool) $attributes['showBranding'] : false;

// Only allow numeric aspect ratios for the CSS custom property.
$vertifeed_aspect_css = '9 / 16';
if ( is_string( $vertifeed_tile_aspect )
	&& preg_match( '/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/', $vertifeed_tile_aspect, $vertifeed_aspect_match )
) {
	$vertifeed_aspect_css = $vertifeed_aspect_match[1] . ' / ' . $vertifeed_aspect_match[2];
}

$vertifeed_style_parts = array(
	'--vf-columns: ' . $vertifeed_columns,
	'--vf-gap: ' . $vertifeed_gap . 'px',
	'--vf-tile-aspect: ' . $vertifeed_aspect_css,
);

$vertifeed_inner_blocks = isset( $block->parsed_block['innerBlocks'] ) ? $block->parsed_block['innerBlocks'] : array();

$vertifeed_align_class = 'vertifeed__gallery--align-left';
if ( in_array( $vertifeed_tile_alignment, array( 'left', 'center', 'right' ), true ) ) {
	$vertifeed_align_class = 'vertifeed__gallery--align-' . $vertifeed_tile_alignment;
}

$vertifeed_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'               => 'vertifeed__feed',
		'style'               => implode( '; ', $vertifeed_style_parts ),
		'data-wp-interactive'  => 'vertifeed',
		'data-wp-context'      => wp_json_encode(
			array(
				'isOpen'             => false,
				'autoplay'           => $vertifeed_autoplay,
				'loopFeed'           => $vertifeed_loop_feed,
				'showProgress'       => $vertifeed_show_progress,
				'showMuteToggle'     => $vertifeed_show_mute_toggle,
				'activeIndex'        => 0,
				'isMuted'            => true,
				'totalItems'         => 0,
				'progress'           => '0%',
				'touchStartY'        => 0,
				'isDragging'         => false,
				'muteLabel'          => __( 'Mute', 'vertifeed' ),
				'unmuteLabel'        => __( 'Unmute', 'vertifeed' ),
			)
		),
		'data-wp-init'         => 'callbacks.onInit',
	)
);
?>
<div <?php echo $vertifeed_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="vertifeed__gallery <?php echo esc_attr( $vertifeed_align_class ); ?>" role="list">
		<?php
		$vertifeed_tile_index = 0;
		foreach ( $vertifeed_inner_blocks as $vertifeed_inner_block ) :
			$vertifeed_inner_attrs = isset( $vertifeed_inner_block['attrs'] ) ? $vertifeed_inner_block['attrs'] : array();
			$vertifeed_video_id    = isset( $vertifeed_inner_attrs['videoId'] ) ? (int) $vertifeed_inner_attrs['videoId'] : 0;

			if ( ! $vertifeed_video_id || ! wp_attachment_is( 'video', $vertifeed_video_id ) ) {
				continue;
			}

			// Resolve a poster image only when it points to an actual image attachment.
			$vertifeed_poster_id  = isset( $vertifeed_inner_attrs['posterId'] ) ? (int) $vertifeed_inner_attrs['posterId'] : 0;
			$vertifeed_poster_url = '';

			if ( $vertifeed_poster_id && wp_attachment_is_image( $vertifeed_poster_id ) ) {
				$vertifeed_poster_url = wp_get_attachment_image_url( $vertifeed_poster_id, 'medium_large' );
			}

			// Fallback: the video's first frame as the tile thumbnail.
			$vertifeed_video_url = wp_get_attachment_url( $vertifeed_video_id );

			if ( ! $vertifeed_poster_url && ! $vertifeed_video_url ) {
				continue;
			}

			$vertifeed_caption    = isset( $vertifeed_inner_attrs['caption'] ) ? $vertifeed_inner_attrs['caption'] : '';
			$vertifeed_video_post = get_post( $vertifeed_video_id );
			$vertifeed_label      = $vertifeed_caption ? $vertifeed_caption : ( $vertifeed_video_post ? $vertifeed_video_post->post_title : __( 'video', 'vertifeed' ) );
			?>
			<button
				type="button"
				class="vertifeed__tile"
				role="listitem"
				data-index="<?php echo esc_attr( (string) $vertifeed_tile_index ); ?>"
				data-wp-on--click="actions.openAt"
				aria-label="<?php echo esc_attr( sprintf( /* translators: %s: video title or caption */ __( 'Play video: %s', 'vertifeed' ), $vertifeed_label ) ); ?>"
			>
				<?php if ( $vertifeed_poster_url ) : ?>
					<img
						class="vertifeed__tile-image"
						src="<?php echo esc_url( $vertifeed_poster_url ); ?>"
						alt=""
						loading="lazy"
						decoding="async"
					/>
				<?php else : ?>
					<video
						class="vertifeed__tile-image vertifeed__tile-video"
						src="<?php echo esc_url( $vertifeed_video_url ); ?>#t=0.1"
						preload="metadata"
						muted
						playsinline
						tabindex="-1"
						aria-hidden="true"
					></video>
				<?php endif; ?>
				<span class="vertifeed__play-icon" aria-hidden="true"></span>
			</button>
			<?php
			++$vertifeed_tile_index;
		endforeach;
		?>
	</div>

	<div
		class="vertifeed__overlay"
		data-wp-bind--hidden="!context.isOpen"
		role="dialog"
		aria-modal="true"
		aria-label="<?php esc_attr_e( 'Video player', 'vertifeed' ); ?>"
		data-wp-on--keydown="actions.onKeydown"
		data-wp-on--wheel="actions.onWheel"
		data-wp-on--touchstart="actions.onTouchStart"
		data-wp-on--touchmove="actions.onTouchMove"
		data-wp-on--touchend="actions.onTouchEnd"
		tabindex="-1"
		hidden
	>
		<div class="vertifeed__viewport">
			<div
				class="vertifeed__track"
				data-wp-style--transform="state.trackTransform"
			>
				<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>

			<?php if ( $vertifeed_show_branding ) : ?>
				<div class="vertifeed__branding" aria-hidden="true">
					<span class="vertifeed__branding-made"><?php esc_html_e( 'Made With', 'vertifeed' ); ?></span>
					<span class="vertifeed__branding-name">VertiFeed</span>
				</div>
			<?php endif; ?>

			<button
				type="button"
				class="vertifeed__close"
				data-wp-on--click="actions.close"
				aria-label="<?php esc_attr_e( 'Close video player', 'vertifeed' ); ?>"
			>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
			</button>

			<?php if ( $vertifeed_show_mute_toggle ) : ?>
				<button
					type="button"
					class="vertifeed__mute-btn"
					data-wp-on--click="actions.toggleMute"
					data-wp-bind--aria-label="state.muteLabel"
				>
					<span class="vertifeed__mute-icon" data-wp-bind--hidden="!context.isMuted" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
					</span>
					<span class="vertifeed__mute-icon" data-wp-bind--hidden="context.isMuted" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
					</span>
				</button>
			<?php endif; ?>

			<?php if ( $vertifeed_show_progress ) : ?>
				<div class="vertifeed__feed-progress" aria-hidden="true">
					<div class="vertifeed__feed-progress-bar" data-wp-style--width="state.progress"></div>
				</div>
			<?php endif; ?>

			<div class="vertifeed__nav-hint" aria-hidden="true">
				<?php esc_html_e( 'Swipe or scroll', 'vertifeed' ); ?>
			</div>
		</div>
	</div>
</div>
