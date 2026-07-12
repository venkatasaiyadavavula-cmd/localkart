#!/usr/bin/env bash
# Source from QA/deploy scripts to attach CI-only throttle bypass header to curl.
# Requires QA_THROTTLE_BYPASS_TOKEN in the environment (GitHub Actions secret + server .env).
#
# Use the QA_THROTTLE_CURL_HEADERS bash array — never $(qa_throttle_*) command substitution,
# which word-splits "Header: value" and passes the token as a bare URL to curl.

QA_THROTTLE_BYPASS_HEADER="${QA_THROTTLE_BYPASS_HEADER:-X-QA-Throttle-Bypass}"

# After qa_throttle_init_curl_headers: curl ... "${QA_THROTTLE_CURL_HEADERS[@]}" "$URL"
QA_THROTTLE_CURL_HEADERS=()

qa_throttle_init_curl_headers() {
  QA_THROTTLE_CURL_HEADERS=()
  if [ -n "${QA_THROTTLE_BYPASS_TOKEN:-}" ]; then
    QA_THROTTLE_CURL_HEADERS=(-H "${QA_THROTTLE_BYPASS_HEADER}:${QA_THROTTLE_BYPASS_TOKEN}")
  fi
}
