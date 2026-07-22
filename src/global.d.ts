/**
 * Ambient module declarations.
 */

// Style imports are handled by the build pipeline, not TypeScript.
declare module '*.scss';

// `@wordpress/block-editor` does not ship TypeScript declarations.
declare module '@wordpress/block-editor';
