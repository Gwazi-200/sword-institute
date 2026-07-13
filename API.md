# API Gateway

The platform uses apiService.js as the single entry point for external AI/provider requests.

## Supported patterns

- request({ endpoint, method, body, provider })
- sendToProfessor(message, context)

## Security

- input is sanitized before sending
- requests are tagged with a provider header
- errors are surfaced as friendly messages rather than raw stack traces
