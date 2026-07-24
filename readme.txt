=== VertiFeed ===
Contributors: loopcreators
Tags: video, gallery, gutenberg, blocks, media
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show Media Library videos as a gallery grid; click a thumbnail to open a fullscreen vertical swipe player.

== Description ==

VertiFeed adds two Gutenberg blocks for creating vertical swipe video galleries on your WordPress site.

**VertiFeed Gallery** — A container block that displays videos as a responsive gallery grid of poster thumbnails. Clicking a thumbnail opens a fullscreen overlay with a vertical swipe video player.

**VertiFeed Video** — A child block for adding individual videos from the Media Library.

= Features =

* Responsive gallery grid of poster thumbnails (no autoplay on the page)
* Fullscreen overlay player opens on click, starting at the chosen video
* Vertical swipe, scroll, and keyboard navigation; close with Esc or the X button
* Self-hosted videos from the WordPress Media Library
* Muted autoplay inside the overlay with tap-to-play/pause
* Optional captions overlay per video
* Configurable columns, gap, aspect ratio, loop, progress bar, and mute toggle
* Built with the WordPress Interactivity API and block.json

== Installation ==

1. Upload the `vertifeed` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Insert a **VertiFeed Gallery** block in the block editor
4. Add **VertiFeed Video** blocks inside and select videos from the Media Library

== Frequently Asked Questions ==

= What video formats are supported? =

Any format supported by the WordPress Media Library and the visitor's browser (typically MP4 and WebM).

= Can I use YouTube or Vimeo videos? =

Not in v1. VertiFeed currently supports self-hosted Media Library videos only.

== Development ==

Source code and build tools are in the public repository:
https://github.com/loopcreators/vertifeed

This plugin is built with `@wordpress/scripts`. To regenerate the compiled files in `build/`:

1. Install dependencies: `yarn install`
2. Build assets: `yarn run build`

== Screenshots ==

1. VertiFeed Gallery grid of vertical video thumbnails in the block editor.
2. Fullscreen video player with mute toggle and swipe navigation.

== Changelog ==

= 1.0.0 =
* Initial release.
* Gallery grid of poster thumbnails with fullscreen overlay player.
* Video child block for Media Library videos.
* Columns, gap, tile aspect ratio, and player controls.
* Multi-select videos from the Media Library.
