declare namespace bootstrap {
  class Tooltip {
    constructor(el: HTMLElement, options: { title: string });

    public static getInstance(el: HTMLElement): Tooltip;

    public hide(): void;
  }
}

function plausible(
  eventName: string,
  options?: {
    props?: { [propName: string]: string | number | boolean };
  },
): void;

declare module "justgage" {
  class JustGage {
    constructor(options: JustGage.Options);

    public refresh(
      val: number,
      max?: number,
      min?: number,
      label?: string,
    ): void;

    public destroy(): void;
  }

  export default JustGage;
}
