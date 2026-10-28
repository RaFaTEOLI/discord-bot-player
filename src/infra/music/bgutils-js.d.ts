// bgutils-js only publishes subpath `exports`, which the project's default (node10) module
// resolution does not read. Point the subpaths at the package's own declaration files.
declare module 'bgutils-js/botguard' {
  export * from 'bgutils-js/dist/exports/botguard';
}

declare module 'bgutils-js/utils' {
  export * from 'bgutils-js/dist/exports/utils';
}
