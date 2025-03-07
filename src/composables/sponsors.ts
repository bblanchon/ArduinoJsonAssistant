export interface Sponsor {
  name: string;
  url: string;
  image: { url: string };
}

export function useSponsors() {
  const sponsorsEl = document.getElementById("assistant-sponsors");
  const sponsors: Sponsor[] = sponsorsEl?.textContent
    ? JSON.parse(sponsorsEl.textContent)
    : [];
  return sponsors;
}
