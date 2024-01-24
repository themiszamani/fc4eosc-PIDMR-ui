import { FaCalendar } from "react-icons/fa";
import packageJson from "../package.json";

function Footer() {
  // tag build information on footer
  const buildDate = import.meta.env.VITE_APP_BUILD_DATE;
  const buildCommitHash = import.meta.env.VITE_APP_BUILD_COMMIT_HASH;
  const buildCommitURL = import.meta.env.VITE_APP_BUILD_COMMIT_URL;

  return (
    <footer>
      <div className="text-center">
        <small className="text-muted">
          <span>
            Version: <strong>{packageJson.version}</strong>
          </span>
          {buildCommitHash && (
            <span style={{ marginLeft: "0.6rem" }}>
              Commit:{" "}
              <a
                className="text-muted cat-hash-link"
                target="_blank"
                rel="noreferrer"
                href={buildCommitURL}
              >
                {buildCommitHash}
              </a>
            </span>
          )}
          {buildDate && (
            <span style={{ marginLeft: "0.6rem" }}>
              <FaCalendar />: {buildDate}
            </span>
          )}
        </small>
      </div>
    </footer>
  );
}

export { Footer };
