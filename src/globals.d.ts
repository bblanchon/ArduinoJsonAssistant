declare namespace bootstrap {
  class Tooltip {
    constructor(el: HTMLElement, options: { title: string });

    public static getInstance(el: HTMLElement): Tooltip;

    public hide(): void;
  }
}
