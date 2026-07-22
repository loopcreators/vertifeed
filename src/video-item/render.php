<?php
/**
 * VidFeed Video block render callback.
 *
 * @package VidFeed
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$vidfeed_video_id  = isset( $attributes['videoId'] ) ? (int) $attributes['videoId'] : 0;
$vidfeed_title     = isset( $attributes['title'] ) ? $attributes['title'] : '';
$vidfeed_caption   = isset( $attributes['caption'] ) ? $attributes['caption'] : '';
$vidfeed_poster_id = isset( $attributes['posterId'] ) ? (int) $attributes['posterId'] : 0;

if ( ! $vidfeed_video_id || ! wp_attachment_is( 'video', $vidfeed_video_id ) ) {
	return;
}

$vidfeed_video_url = wp_get_attachment_url( $vidfeed_video_id );

if ( ! $vidfeed_video_url ) {
	return;
}

$vidfeed_poster_url = '';

if ( $vidfeed_poster_id ) {
	$vidfeed_poster_url = wp_get_attachment_image_url( $vidfeed_poster_id, 'large' );
}

if ( ! $vidfeed_poster_url ) {
	$vidfeed_poster_url = wp_get_attachment_image_url( $vidfeed_video_id, 'large' );
}

$vidfeed_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'vidfeed__item',
	)
);
?>
<div <?php echo $vidfeed_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( $vidfeed_poster_url ) : ?>
		<div
			class="vidfeed__backdrop"
			style="background-image: url( <?php echo esc_url( $vidfeed_poster_url ); ?> );"
			aria-hidden="true"
		></div>
	<?php else : ?>
		<video
			class="vidfeed__backdrop vidfeed__backdrop--video"
			src="<?php echo esc_url( $vidfeed_video_url ); ?>#t=0.1"
			muted
			playsinline
			preload="metadata"
			tabindex="-1"
			aria-hidden="true"
		></video>
	<?php endif; ?>
	<video
		class="vidfeed__video"
		src="<?php echo esc_url( $vidfeed_video_url ); ?>"
		<?php if ( $vidfeed_poster_url ) : ?>
			poster="<?php echo esc_url( $vidfeed_poster_url ); ?>"
		<?php endif; ?>
		playsinline
		muted
		preload="metadata"
		data-wp-on--click="actions.togglePlay"
	></video>

	<div class="vidfeed__scrim" aria-hidden="true"></div>

	<?php if ( $vidfeed_title || $vidfeed_caption ) : ?>
	<div class="vidfeed__meta">
		<?php if ( $vidfeed_title ) : ?>
			<h3 class="vidfeed__title"><?php echo esc_html( $vidfeed_title ); ?></h3>
		<?php endif; ?>
		<?php if ( $vidfeed_caption ) : ?>
			<p class="vidfeed__desc"><?php echo esc_html( $vidfeed_caption ); ?></p>
		<?php endif; ?>
	</div>
	<?php endif; ?>
</div>
