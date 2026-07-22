/**
 * VidFeed Gallery frontend interactivity.
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

const SWIPE_THRESHOLD = 50;
const SCROLL_LOCK_CLASS = 'vidfeed--scroll-locked';
// Short debounce so a single input can't double-fire; deliberate repeats still pass.
const NAV_LOCK_MS = 140;

// A trackpad/mouse momentum scroll fires a long burst of wheel events that decay
// in magnitude. We advance once per gesture, but detect a fresh push (delta spikes
// back up) so quick successive swipes feel responsive instead of forcing a wait.
const WHEEL_IDLE_MS = 120;
const REPUSH_RATIO = 1.8;
const MIN_WHEEL_DELTA = 6;

type TimerHandle = ReturnType< typeof setTimeout > | null;

interface VidFeedContext {
	activeIndex: number;
	totalItems: number;
	isOpen: boolean;
	isMuted: boolean;
	autoplay: boolean;
	loopFeed: boolean;
	progress: string;
	touchStartY: number;
	isDragging: boolean;
	muteLabel: string;
	unmuteLabel: string;
}

interface OverlayElements {
	overlay: HTMLElement | null;
	items: HTMLElement[];
	videos: HTMLVideoElement[];
}

let lastFocusedTile: HTMLElement | null = null;

interface FeedNavState {
	isNavigating: boolean;
	navLockTimer: TimerHandle;
	wheelGestureActive: boolean;
	wheelIdleTimer: TimerHandle;
	lastWheelDelta: number;
}

const feedNavState = new WeakMap< HTMLElement, FeedNavState >();

function getNavState( feedRoot: HTMLElement | null ): FeedNavState | null {
	if ( ! feedRoot ) {
		return null;
	}

	let state = feedNavState.get( feedRoot );
	if ( ! state ) {
		state = {
			isNavigating: false,
			navLockTimer: null,
			wheelGestureActive: false,
			wheelIdleTimer: null,
			lastWheelDelta: 0,
		};
		feedNavState.set( feedRoot, state );
	}
	return state;
}

function lockNavigation( feedRoot: HTMLElement | null ): void {
	const state = getNavState( feedRoot );
	if ( ! state ) {
		return;
	}

	state.isNavigating = true;
	if ( state.navLockTimer ) {
		clearTimeout( state.navLockTimer );
	}
	state.navLockTimer = setTimeout( () => {
		state.isNavigating = false;
	}, NAV_LOCK_MS );
}

function endWheelGestureSoon( feedRoot: HTMLElement | null ): void {
	const state = getNavState( feedRoot );
	if ( ! state ) {
		return;
	}

	if ( state.wheelIdleTimer ) {
		clearTimeout( state.wheelIdleTimer );
	}
	state.wheelIdleTimer = setTimeout( () => {
		state.wheelGestureActive = false;
	}, WHEEL_IDLE_MS );
}

function resetNavigationState( feedRoot: HTMLElement | null ): void {
	const state = getNavState( feedRoot );
	if ( ! state ) {
		return;
	}

	state.isNavigating = false;
	state.wheelGestureActive = false;
	state.lastWheelDelta = 0;
	if ( state.navLockTimer ) {
		clearTimeout( state.navLockTimer );
		state.navLockTimer = null;
	}
	if ( state.wheelIdleTimer ) {
		clearTimeout( state.wheelIdleTimer );
		state.wheelIdleTimer = null;
	}
}

function getFeedRoot( element: Element | null ): HTMLElement | null {
	return ( element?.closest?.( '.vidfeed__feed' ) as HTMLElement ) ?? null;
}

/**
 * Temporarily disable the track transition so a jump (open or wrap-around)
 * snaps into place instead of sweeping through every reel.
 */
function snapTrack( feedRoot: HTMLElement | null ): void {
	const track = feedRoot?.querySelector< HTMLElement >(
		'.vidfeed__track'
	);
	if ( ! track ) {
		return;
	}

	track.style.transition = 'none';
	requestAnimationFrame( () => {
		requestAnimationFrame( () => {
			track.style.transition = '';
		} );
	} );
}

function getOverlayElements( feedRoot: HTMLElement | null ): OverlayElements {
	if ( ! feedRoot ) {
		return { overlay: null, items: [], videos: [] };
	}

	const overlay = feedRoot.querySelector< HTMLElement >(
		'.vidfeed__overlay'
	);

	return {
		overlay,
		items: overlay
			? Array.from(
					overlay.querySelectorAll< HTMLElement >(
						'.vidfeed__item'
					)
			  )
			: [],
		videos: overlay
			? Array.from(
					overlay.querySelectorAll< HTMLVideoElement >(
						'.vidfeed__video'
					)
			  )
			: [],
	};
}

function lockBodyScroll(): void {
	document.documentElement.classList.add( SCROLL_LOCK_CLASS );
}

function unlockBodyScroll(): void {
	document.documentElement.classList.remove( SCROLL_LOCK_CLASS );
}

const { actions } = store( 'vidfeed', {
	state: {
		get trackTransform(): string {
			const ctx = getContext< VidFeedContext >();
			// Translate in viewport units so each step always equals one full
			// reel height, regardless of how tall the (overflowing) track is.
			return `translateY(calc(${ ctx.activeIndex } * -100dvh))`;
		},
		get muteLabel(): string {
			const ctx = getContext< VidFeedContext >();
			return ctx.isMuted
				? ctx.unmuteLabel || 'Unmute'
				: ctx.muteLabel || 'Mute';
		},
		get progress(): string {
			const ctx = getContext< VidFeedContext >();
			return ctx.progress || '0%';
		},
	},

	actions: {
		openAt( event: MouseEvent ): void {
			const ctx = getContext< VidFeedContext >();
			const currentTarget = event.currentTarget as HTMLElement;
			const index = parseInt(
				currentTarget.getAttribute( 'data-index' ) ?? '',
				10
			);

			if ( Number.isNaN( index ) ) {
				return;
			}

			lastFocusedTile = currentTarget;
			ctx.isOpen = true;
			lockBodyScroll();

			const feedRoot = getFeedRoot( currentTarget );
			const { overlay } = getOverlayElements( feedRoot );

			if ( overlay ) {
				overlay.removeAttribute( 'hidden' );
				overlay.focus();
			}

			// Position instantly at the chosen reel without sweeping to it.
			snapTrack( feedRoot );
			actions.setActive( index );
		},

		close( event?: Event ): void {
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const { videos } = getOverlayElements( feedRoot );

			ctx.isOpen = false;
			ctx.progress = '0%';
			unlockBodyScroll();
			resetNavigationState( feedRoot );

			videos.forEach( ( video ) => {
				video.pause();
				video.currentTime = 0;
				video.ontimeupdate = null;
				video.onended = null;
			} );

			if ( lastFocusedTile?.focus ) {
				lastFocusedTile.focus();
			}

			if ( event?.preventDefault ) {
				event.preventDefault();
			}
		},

		toggleMute( event: Event ): void {
			event.stopPropagation();
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const { videos } = getOverlayElements( feedRoot );

			ctx.isMuted = ! ctx.isMuted;

			videos.forEach( ( video ) => {
				video.muted = ctx.isMuted;
			} );
		},

		togglePlay( event: Event ): void {
			const video = event.target as HTMLVideoElement | null;
			if ( ! video || video.tagName !== 'VIDEO' ) {
				return;
			}

			if ( video.paused ) {
				video.play().catch( () => {} );
			} else {
				video.pause();
			}
		},

		onWheel( event: WheelEvent ): void {
			const ctx = getContext< VidFeedContext >();
			if ( ! ctx.isOpen ) {
				return;
			}

			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const state = getNavState( feedRoot );
			if ( ! state ) {
				return;
			}

			event.preventDefault();

			const absDelta = Math.abs( event.deltaY );

			// During an active gesture, only act again on a clear fresh push:
			// momentum decays, so a delta that spikes back up means a new swipe.
			if ( state.wheelGestureActive ) {
				const isFreshPush =
					absDelta > MIN_WHEEL_DELTA &&
					absDelta > state.lastWheelDelta * REPUSH_RATIO;

				state.lastWheelDelta = Math.max( absDelta, MIN_WHEEL_DELTA );
				endWheelGestureSoon( feedRoot );

				if ( ! isFreshPush ) {
					return;
				}
			} else {
				state.wheelGestureActive = true;
				state.lastWheelDelta = Math.max( absDelta, MIN_WHEEL_DELTA );
				endWheelGestureSoon( feedRoot );
			}

			if ( event.deltaY > 0 ) {
				actions.next();
			} else if ( event.deltaY < 0 ) {
				actions.prev();
			}
		},

		onKeydown( event: KeyboardEvent ): void {
			const ctx = getContext< VidFeedContext >();

			if ( event.key === 'Escape' && ctx.isOpen ) {
				event.preventDefault();
				actions.close( event );
				return;
			}

			if ( ! ctx.isOpen ) {
				return;
			}

			if ( event.key === 'ArrowDown' ) {
				event.preventDefault();
				actions.next();
			} else if ( event.key === 'ArrowUp' ) {
				event.preventDefault();
				actions.prev();
			} else if ( event.key === 'm' || event.key === 'M' ) {
				actions.toggleMute( event );
			}
		},

		onTouchStart( event: TouchEvent ): void {
			const ctx = getContext< VidFeedContext >();
			if ( ! ctx.isOpen ) {
				return;
			}

			ctx.touchStartY = event.touches[ 0 ].clientY;
			ctx.isDragging = true;
		},

		onTouchMove( event: TouchEvent ): void {
			const ctx = getContext< VidFeedContext >();
			if ( ! ctx.isOpen || ! ctx.isDragging ) {
				return;
			}
			event.preventDefault();
		},

		onTouchEnd( event: TouchEvent ): void {
			const ctx = getContext< VidFeedContext >();
			if ( ! ctx.isOpen || ! ctx.isDragging ) {
				return;
			}

			const touchEndY = event.changedTouches[ 0 ].clientY;
			const deltaY = ctx.touchStartY - touchEndY;

			if ( Math.abs( deltaY ) > SWIPE_THRESHOLD ) {
				if ( deltaY > 0 ) {
					actions.next();
				} else {
					actions.prev();
				}
			}

			ctx.isDragging = false;
		},

		next(): void {
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const state = getNavState( feedRoot );

			if ( ! ctx.isOpen || ! state || state.isNavigating ) {
				return;
			}

			const { items } = getOverlayElements( feedRoot );
			const total = items.length;

			if ( total <= 1 ) {
				return;
			}

			let nextIndex = ctx.activeIndex + 1;
			let wrap = false;

			if ( nextIndex >= total ) {
				if ( ctx.loopFeed ) {
					nextIndex = 0;
					wrap = true;
				} else {
					return;
				}
			}

			lockNavigation( feedRoot );
			actions.setActive( nextIndex, wrap );
		},

		prev(): void {
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const state = getNavState( feedRoot );

			if ( ! ctx.isOpen || ! state || state.isNavigating ) {
				return;
			}

			const { items } = getOverlayElements( feedRoot );
			const total = items.length;

			if ( total <= 1 ) {
				return;
			}

			let prevIndex = ctx.activeIndex - 1;
			let wrap = false;

			if ( prevIndex < 0 ) {
				if ( ctx.loopFeed ) {
					prevIndex = total - 1;
					wrap = true;
				} else {
					return;
				}
			}

			lockNavigation( feedRoot );
			actions.setActive( prevIndex, wrap );
		},

		setActive( index: number, snap = false ): void {
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const feedRoot = getFeedRoot( ref );
			const { items, videos } = getOverlayElements( feedRoot );

			if ( index < 0 || index >= items.length ) {
				return;
			}

			if ( snap ) {
				snapTrack( feedRoot );
			}

			ctx.activeIndex = index;
			ctx.totalItems = items.length;
			ctx.progress = '0%';

			videos.forEach( ( video, i ) => {
				video.pause();
				video.currentTime = 0;
				video.ontimeupdate = null;
				video.onended = null;

				if ( i === index ) {
					video.muted = ctx.isMuted;

					if (
						ctx.isOpen &&
						ctx.autoplay &&
						! window.matchMedia(
							'(prefers-reduced-motion: reduce)'
						).matches
					) {
						video.play().catch( () => {} );
					}

					video.ontimeupdate = () => {
						if ( ctx.activeIndex === i && video.duration ) {
							const pct =
								( video.currentTime / video.duration ) * 100;
							ctx.progress = `${ pct }%`;
						}
					};

					video.onended = () => {
						if ( ctx.activeIndex === i ) {
							if ( ctx.loopFeed || i < items.length - 1 ) {
								actions.next();
							}
						}
					};
				}
			} );
		},
	},

	callbacks: {
		onInit(): void {
			const ctx = getContext< VidFeedContext >();
			const { ref } = getElement();
			const { items, videos } = getOverlayElements(
				ref as HTMLElement | null
			);

			ctx.totalItems = items.length;
			ctx.activeIndex = 0;
			ctx.isMuted = true;
			ctx.isOpen = false;
			ctx.progress = '0%';

			videos.forEach( ( video ) => {
				video.muted = true;
				video.playsInline = true;
			} );
		},
	},
} );
