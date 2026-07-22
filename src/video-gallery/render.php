<?php
/**
 * VidFeed Gallery block render callback.
 *
 * @package VidFeed
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$vidfeed_columns          = isset( $attributes['columns'] ) ? max( 1, min( 6, (int) $attributes['columns'] ) ) : 3;
$vidfeed_gap              = isset( $attributes['gap'] ) ? max( 0, min( 48, (int) $attributes['gap'] ) ) : 8;
$vidfeed_tile_aspect      = isset( $attributes['tileAspectRatio'] ) ? $attributes['tileAspectRatio'] : '9/16';
$vidfeed_tile_alignment   = isset( $attributes['tileAlignment'] ) ? $attributes['tileAlignment'] : 'left';
$vidfeed_autoplay         = isset( $attributes['autoplay'] ) ? (bool) $attributes['autoplay'] : true;
$vidfeed_loop_feed        = isset( $attributes['loopFeed'] ) ? (bool) $attributes['loopFeed'] : true;
$vidfeed_show_progress    = isset( $attributes['showProgress'] ) ? (bool) $attributes['showProgress'] : true;
$vidfeed_show_mute_toggle = isset( $attributes['showMuteToggle'] ) ? (bool) $attributes['showMuteToggle'] : true;
$vidfeed_show_branding    = isset( $attributes['showBranding'] ) ? (bool) $attributes['showBranding'] : false;

// Only allow numeric aspect ratios for the CSS custom property.
$vidfeed_aspect_css = '9 / 16';
if ( is_string( $vidfeed_tile_aspect )
	&& preg_match( '/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/', $vidfeed_tile_aspect, $vidfeed_aspect_match )
) {
	$vidfeed_aspect_css = $vidfeed_aspect_match[1] . ' / ' . $vidfeed_aspect_match[2];
}

$vidfeed_style_parts = array(
	'--vf-columns: ' . $vidfeed_columns,
	'--vf-gap: ' . $vidfeed_gap . 'px',
	'--vf-tile-aspect: ' . $vidfeed_aspect_css,
);

$vidfeed_inner_blocks = isset( $block->parsed_block['innerBlocks'] ) ? $block->parsed_block['innerBlocks'] : array();

$vidfeed_align_class = 'vidfeed__gallery--align-left';
if ( in_array( $vidfeed_tile_alignment, array( 'left', 'center', 'right' ), true ) ) {
	$vidfeed_align_class = 'vidfeed__gallery--align-' . $vidfeed_tile_alignment;
}

$vidfeed_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class'               => 'vidfeed__feed',
		'style'               => implode( '; ', $vidfeed_style_parts ),
		'data-wp-interactive'  => 'vidfeed',
		'data-wp-context'      => wp_json_encode(
			array(
				'isOpen'             => false,
				'autoplay'           => $vidfeed_autoplay,
				'loopFeed'           => $vidfeed_loop_feed,
				'showProgress'       => $vidfeed_show_progress,
				'showMuteToggle'     => $vidfeed_show_mute_toggle,
				'activeIndex'        => 0,
				'isMuted'            => true,
				'totalItems'         => 0,
				'progress'           => '0%',
				'touchStartY'        => 0,
				'isDragging'         => false,
				'muteLabel'          => __( 'Mute', 'vidfeed' ),
				'unmuteLabel'        => __( 'Unmute', 'vidfeed' ),
			)
		),
		'data-wp-init'         => 'callbacks.onInit',
	)
);
?>
<div <?php echo $vidfeed_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="vidfeed__gallery <?php echo esc_attr( $vidfeed_align_class ); ?>" role="list">
		<?php
		$vidfeed_tile_index = 0;
		foreach ( $vidfeed_inner_blocks as $vidfeed_inner_block ) :
			$vidfeed_inner_attrs = isset( $vidfeed_inner_block['attrs'] ) ? $vidfeed_inner_block['attrs'] : array();
			$vidfeed_video_id    = isset( $vidfeed_inner_attrs['videoId'] ) ? (int) $vidfeed_inner_attrs['videoId'] : 0;

			if ( ! $vidfeed_video_id || ! wp_attachment_is( 'video', $vidfeed_video_id ) ) {
				continue;
			}

			// Resolve a poster image only when it points to an actual image attachment.
			$vidfeed_poster_id  = isset( $vidfeed_inner_attrs['posterId'] ) ? (int) $vidfeed_inner_attrs['posterId'] : 0;
			$vidfeed_poster_url = '';

			if ( $vidfeed_poster_id && wp_attachment_is_image( $vidfeed_poster_id ) ) {
				$vidfeed_poster_url = wp_get_attachment_image_url( $vidfeed_poster_id, 'medium_large' );
			}

			// Fallback: the video's first frame as the tile thumbnail.
			$vidfeed_video_url = wp_get_attachment_url( $vidfeed_video_id );

			if ( ! $vidfeed_poster_url && ! $vidfeed_video_url ) {
				continue;
			}

			$vidfeed_caption    = isset( $vidfeed_inner_attrs['caption'] ) ? $vidfeed_inner_attrs['caption'] : '';
			$vidfeed_video_post = get_post( $vidfeed_video_id );
			$vidfeed_label      = $vidfeed_caption ? $vidfeed_caption : ( $vidfeed_video_post ? $vidfeed_video_post->post_title : __( 'video', 'vidfeed' ) );
			?>
			<button
				type="button"
				class="vidfeed__tile"
				role="listitem"
				data-index="<?php echo esc_attr( (string) $vidfeed_tile_index ); ?>"
				data-wp-on--click="actions.openAt"
				aria-label="<?php echo esc_attr( sprintf( /* translators: %s: video title or caption */ __( 'Play video: %s', 'vidfeed' ), $vidfeed_label ) ); ?>"
			>
				<?php if ( $vidfeed_poster_url ) : ?>
					<img
						class="vidfeed__tile-image"
						src="<?php echo esc_url( $vidfeed_poster_url ); ?>"
						alt=""
						loading="lazy"
						decoding="async"
					/>
				<?php else : ?>
					<video
						class="vidfeed__tile-image vidfeed__tile-video"
						src="<?php echo esc_url( $vidfeed_video_url ); ?>#t=0.1"
						preload="metadata"
						muted
						playsinline
						tabindex="-1"
						aria-hidden="true"
					></video>
				<?php endif; ?>
				<span class="vidfeed__play-icon" aria-hidden="true"></span>
			</button>
			<?php
			++$vidfeed_tile_index;
		endforeach;
		?>
	</div>

	<div
		class="vidfeed__overlay"
		data-wp-bind--hidden="!context.isOpen"
		role="dialog"
		aria-modal="true"
		aria-label="<?php esc_attr_e( 'Video player', 'vidfeed' ); ?>"
		data-wp-on--keydown="actions.onKeydown"
		data-wp-on--wheel="actions.onWheel"
		data-wp-on--touchstart="actions.onTouchStart"
		data-wp-on--touchmove="actions.onTouchMove"
		data-wp-on--touchend="actions.onTouchEnd"
		tabindex="-1"
		hidden
	>
		<div class="vidfeed__viewport">
			<div
				class="vidfeed__track"
				data-wp-style--transform="state.trackTransform"
			>
				<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			</div>

			<?php if ( $vidfeed_show_branding ) : ?>
				<div class="vidfeed__branding" aria-hidden="true">
					<span class="vidfeed__branding-made"><?php esc_html_e( 'Made With', 'vidfeed' ); ?></span>
					<span class="vidfeed__branding-name">VidFeed</span>
				</div>
			<?php endif; ?>

			<button
				type="button"
				class="vidfeed__close"
				data-wp-on--click="actions.close"
				aria-label="<?php esc_attr_e( 'Close video player', 'vidfeed' ); ?>"
			>
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
			</button>

			<?php if ( $vidfeed_show_mute_toggle ) : ?>
				<button
					type="button"
					class="vidfeed__mute-btn"
					data-wp-on--click="actions.toggleMute"
					data-wp-bind--aria-label="state.muteLabel"
				>
					<span class="vidfeed__mute-icon" data-wp-bind--hidden="!context.isMuted" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
					</span>
					<span class="vidfeed__mute-icon" data-wp-bind--hidden="context.isMuted" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
					</span>
				</button>
			<?php endif; ?>

			<?php if ( $vidfeed_show_progress ) : ?>
				<div class="vidfeed__feed-progress" aria-hidden="true">
					<div class="vidfeed__feed-progress-bar" data-wp-style--width="state.progress"></div>
				</div>
			<?php endif; ?>

			<div class="vidfeed__nav-hint" aria-hidden="true">
				<?php esc_html_e( 'Swipe or scroll', 'vidfeed' ); ?>
			</div>
		</div>
	</div>
</div>
