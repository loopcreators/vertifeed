<?php
/**
 * Plugin Name:       VidFeed
 * Plugin URI:        https://github.com/loopcreators/vidfeed
 * Description:       Play Media Library videos in a vertical swipe gallery via Gutenberg blocks.
 * Version:           1.0.1
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            Loop Creators
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       vidfeed
 *
 * @package VidFeed
 */

defined( 'ABSPATH' ) || exit;

define( 'VIDFEED_VERSION', '1.0.1' );
define( 'VIDFEED_PATH', plugin_dir_path( __FILE__ ) );
define( 'VIDFEED_URL', plugin_dir_url( __FILE__ ) );

require_once VIDFEED_PATH . 'includes/class-vidfeed.php';

VidFeed::init();
