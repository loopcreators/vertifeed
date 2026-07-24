<?php
/**
 * VertiFeed Video block render callback.
 *
 * @package VertiFeed
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Block inner content.
 * @var WP_Block $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$vertifeed_video_id  = isset( $attributes['videoId'] ) ? (int) $attributes['videoId'] : 0;
$vertifeed_title     = isset( $attributes['title'] ) ? $attributes['title'] : '';
$vertifeed_caption   = isset( $attributes['caption'] ) ? $attributes['caption'] : '';
$vertifeed_poster_id = isset( $attributes['posterId'] ) ? (int) $attributes['posterId'] : 0;

if ( ! $vertifeed_video_id || ! wp_attachment_is( 'video', $vertifeed_video_id ) ) {
	return;
}

$vertifeed_video_url = wp_get_attachment_url( $vertifeed_video_id );

if ( ! $vertifeed_video_url ) {
	return;
}

$vertifeed_poster_url = '';

if ( $vertifeed_poster_id ) {
	$vertifeed_poster_url = wp_get_attachment_image_url( $vertifeed_poster_id, 'large' );
}

if ( ! $vertifeed_poster_url ) {
	$vertifeed_poster_url = wp_get_attachment_image_url( $vertifeed_video_id, 'large' );
}

$vertifeed_wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'vertifeed__item',
	)
);
?>
<div <?php echo $vertifeed_wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php if ( $vertifeed_poster_url ) : ?>
		<div
			class="vertifeed__backdrop"
			style="background-image: url( <?php echo esc_url( $vertifeed_poster_url ); ?> );"
			aria-hidden="true"
		></div>
	<?php else : ?>
		<video
			class="vertifeed__backdrop vertifeed__backdrop--video"
			src="<?php echo esc_url( $vertifeed_video_url ); ?>#t=0.1"
			muted
			playsinline
			preload="metadata"
			tabindex="-1"
			aria-hidden="true"
		></video>
	<?php endif; ?>
	<video
		class="vertifeed__video"
		src="<?php echo esc_url( $vertifeed_video_url ); ?>"
		<?php if ( $vertifeed_poster_url ) : ?>
			poster="<?php echo esc_url( $vertifeed_poster_url ); ?>"
		<?php endif; ?>
		playsinline
		muted
		preload="metadata"
		data-wp-on--click="actions.togglePlay"
	></video>

	<div class="vertifeed__scrim" aria-hidden="true"></div>

	<?php if ( $vertifeed_title || $vertifeed_caption ) : ?>
	<div class="vertifeed__meta">
		<?php if ( $vertifeed_title ) : ?>
			<h3 class="vertifeed__title"><?php echo esc_html( $vertifeed_title ); ?></h3>
		<?php endif; ?>
		<?php if ( $vertifeed_caption ) : ?>
			<p class="vertifeed__desc"><?php echo esc_html( $vertifeed_caption ); ?></p>
		<?php endif; ?>
	</div>
	<?php endif; ?>
</div>
