import argparse
import json
import sys
import urllib.request

def main():
    parser = argparse.ArgumentParser(description="Probe exposed .git repository configuration")
    parser.add_argument("--url", required=True, help="Target URL (e.g. http://10.77.0.10:8080/.git/config)")
    args = parser.parse_args()

    try:
        req = urllib.request.Request(args.url, headers={"User-Agent": "ChainedRisk-Runner/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            if "[core]" in content or "repositoryformatversion" in content or "[remote" in content:
                print(json.dumps({
                    "status": "confirmed",
                    "exit_code": 0,
                    "evidence": content[:500],
                    "message": "Git exposure verified: found valid repository configuration markers"
                }))
                sys.exit(0)
            else:
                print(json.dumps({"status": "not_reproduced", "exit_code": 1, "message": "200 OK but git markers absent"}))
                sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "exit_code": 1, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
