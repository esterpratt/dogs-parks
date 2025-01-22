import 'csstype';

declare module 'csstype' {
  interface Properties {
    /** Allow any CSS variable */
    [key: `--${string}`]: string | number;
  }
}
