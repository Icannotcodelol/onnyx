declare module "pngjs" {
  interface PNGOptions {
    width: number;
    height: number;
  }

  class PNG {
    width: number;
    height: number;
    data: Buffer;

    constructor(options?: PNGOptions);

    static sync: {
      write(png: PNG): Buffer;
    };
  }

  export { PNG };
}
