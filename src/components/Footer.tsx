import { Trans } from "@lingui/react/macro";

const BMAC = "https://buymeacoffee.com/tylerr909?new=1";
const YEAR = new Date().getFullYear();

interface Props {
  visible: boolean;
}

export function Footer({ visible }: Props) {
  return (
    <footer className={`site-footer ${visible ? "is-visible" : "is-hidden"}`}>
      <a href={BMAC} target="_blank" rel="noopener noreferrer" tabIndex={visible ? 0 : -1}>
        <Trans>Buy me a coffee</Trans>
      </a>
      <span className="dot" aria-hidden>
        ·
      </span>
      <span className="copy">
        © {YEAR} Pi Trainer
        <span className="copy-note">
          {" "}
          <Trans>
            — original site content is copyrighted by default; no paperwork required for © to exist.
            π itself is public domain math. Don&apos;t sue circles.
          </Trans>
        </span>
      </span>
    </footer>
  );
}
