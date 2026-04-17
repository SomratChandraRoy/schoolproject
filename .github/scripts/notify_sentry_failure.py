import os


def main() -> None:
    dsn = os.getenv("SENTRY_DSN", "").strip()
    if not dsn:
        print("SENTRY_DSN is not set. Skipping Sentry notification.")
        return

    import sentry_sdk

    sentry_sdk.init(
        dsn=dsn,
        environment=os.getenv("SENTRY_ENVIRONMENT", "production"),
        traces_sample_rate=0.0,
        profiles_sample_rate=0.0,
    )

    message = os.getenv("SENTRY_MESSAGE", "GitHub Actions workflow failed")
    level = os.getenv("SENTRY_LEVEL", "error")

    with sentry_sdk.push_scope() as scope:
        scope.set_tag("github.workflow", os.getenv("GITHUB_WORKFLOW", ""))
        scope.set_tag("github.repository", os.getenv("GITHUB_REPOSITORY", ""))
        scope.set_tag("github.ref", os.getenv("GITHUB_REF", ""))
        scope.set_tag("github.sha", os.getenv("GITHUB_SHA", ""))
        scope.set_extra(
            "run_url",
            f"{os.getenv('GITHUB_SERVER_URL', '')}/{os.getenv('GITHUB_REPOSITORY', '')}/actions/runs/{os.getenv('GITHUB_RUN_ID', '')}",
        )
        sentry_sdk.capture_message(message, level=level)

    sentry_sdk.flush(timeout=5)
    print("Sentry notification sent.")


if __name__ == "__main__":
    main()
