<?php
/**
 * Main plugin bootstrap.
 *
 * @package VertiFeed
 */

defined( 'ABSPATH' ) || exit;

/**
 * VertiFeed plugin class.
 */
class VertiFeed {

	/**
	 * Initialize hooks.
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register_blocks' ) );
	}

	/**
	 * Register Gutenberg blocks.
	 */
	public static function register_blocks() {
		$blocks = array( 'video-item', 'video-gallery' );

		foreach ( $blocks as $block ) {
			$block_path = VERTIFEED_PATH . 'build/' . $block;

			if ( file_exists( $block_path . '/block.json' ) ) {
				register_block_type( $block_path );
			}
		}
	}
}
