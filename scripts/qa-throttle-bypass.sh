#!/usr/bin/env bash
# Source from QA/deploy scripts to attach CI-only throttle bypass header to curl.
# Requires QA_THROTTLE_BYPASS_TOKEN in the environment (GitHub Actions secret + server .env).

QA_THROTTLE_BYPASS_HEADER="${QA_THROTTLE_BYPASS_HEADER:-X-QA-Throttle-Bypass}"

qa_throttle_curl_args() {
  if [ -n "${QA_THROTTLE_BYPASS_TOKEN:-}" ]; then
    printf '%s\n' -H "${QA_THROTTLE_BYPASS_HEADER}: ${QA_THROTTLE_BYPASS_TOKEN}"
  fi
}
