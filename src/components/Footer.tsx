import { Trans } from "@lingui/react/macro";

const REPO = "https://github.com/TylerR909/pi-wtf";
const BMAC = "https://buymeacoffee.com/tylerr909?new=1";
const YEAR = new Date().getFullYear();

interface Props {
  visible: boolean;
}

export function Footer({ visible }: Props) {
  const tab = visible ? 0 : -1;
  return (
    <footer className={`site-footer ${visible ? "is-visible" : "is-hidden"}`}>
      <a className="copy" href={REPO} target="_blank" rel="noopener noreferrer" tabIndex={tab}>
        © {YEAR} piwtf.com
      </a>
      <span className="dot" aria-hidden>
        ·
      </span>
      <span>
        <Trans>No warranties</Trans>
      </span>
      <span className="dot" aria-hidden>
        ·
      </span>
      <a href={BMAC} target="_blank" rel="noopener noreferrer" tabIndex={tab}>
        <Trans>Buy me a coffee</Trans>
      </a>
    </footer>
  );
}
