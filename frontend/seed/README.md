Demo scenario for ChainedRisk. Contains 3 hosts and 27 findings: a planted chain (fnd_git -> fnd_ssrf -> fnd_redis; individually Low/Medium/Medium) plus noise.
Load via UI "Load demo scenario" or POST the file to /api/v1/projects/{id}/ingest with source_tool=csv|json (native format).
Ground truth is in `ground_truth` for evaluation. Negative cases: enable Redis AUTH or block internal ranges in /fetch -> chain must disappear.
