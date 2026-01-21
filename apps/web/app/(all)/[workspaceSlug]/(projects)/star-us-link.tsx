import { useTheme } from "next-themes";
// plane imports
import { HEADER_GITHUB_ICON, GITHUB_REDIRECTED_TRACKER_EVENT } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// assets
import githubBlackImage from "@/app/assets/logos/github-black.png?url";
import githubWhiteImage from "@/app/assets/logos/github-white.png?url";
// helpers
import { captureElementAndEvent } from "@/helpers/event-tracker.helper";

export function StarUsOnGitHubLink() {
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { resolvedTheme } = useTheme();
  const imageSrc = resolvedTheme === "dark" ? githubWhiteImage : githubBlackImage;

  return <></>;
}
