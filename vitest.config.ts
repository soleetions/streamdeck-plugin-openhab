import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true
	},
	// The project's tsconfig.json intentionally omits `experimentalDecorators` (TC39 decorators),
	// which matches how the real build (@rollup/plugin-typescript) compiles `@action`-decorated
	// classes. Vitest's oxc-based transform currently fails to parse TC39 class decorators
	// ("SyntaxError: Invalid or unexpected token") on any file that imports one. Since
	// @elgato/streamdeck's `action` decorator ignores the TC39 `context` argument and only
	// depends on `target`, it behaves identically under legacy decorator emit, so switching only
	// oxc's decorator transform to legacy mode is safe and does not affect the production build.
	oxc: {
		decorator: {
			legacy: true
		}
	}
});
