<?php
/**
 * Plugin Name:       VertiFeed - Vertical Media Gallery
 * Plugin URI:        https://github.com/loopcreators/vertifeed
 * Description:       Play Media Library videos in a vertical swipe gallery via Gutenberg blocks.
 * Version:           1.0.1
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Tested up to:      7.0
 * Author:            Loop Creators
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       vertifeed
 *
 * @package VertiFeed
 */

defined( 'ABSPATH' ) || exit;

define( 'VERTIFEED_VERSION', '1.0.1' );
define( 'VERTIFEED_PATH', plugin_dir_path( __FILE__ ) );
define( 'VERTIFEED_URL', plugin_dir_url( __FILE__ ) );

require_once VERTIFEED_PATH . 'includes/class-vertifeed.php';

VertiFeed::init();
