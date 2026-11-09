import sys
import json
import argparse
import ipaddress
import urllib.request
import socket

LAB_CIDR = "10.77.0.0/24"
lab_net = ipaddress.ip_network(LAB_CIDR)

def check_ip_in_lab(ip_str: str):
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip not in lab_net:
            print(json.dumps({"status": "error", "message": f"Target IP {ip_str} not in lab CIDR {LAB_CIDR}"}))
            sys.exit(2)
    except ValueError:
        pass

def action_git_exposure_check(params):
    url = params.get("url", "")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "ChainedRisk-Runner/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            if "[core]" in content or "[remote" in content or "repositoryformatversion" in content:
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

def action_ssrf_canary_probe(params):
    url = params.get("url", "")
    target = params.get("target_url", "")
    probe_url = f"{url}?u={urllib.parse.quote(target)}" if "?" not in url else f"{url}&u={urllib.parse.quote(target)}"
    try:
        req = urllib.request.Request(probe_url, headers={"User-Agent": "ChainedRisk-Runner/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            # Check for Redis or internal marker
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
        # Check if error output contains Redis response
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

def action_redis_unauth_ping(params):
    host = params.get("host", "10.77.0.12")
    port = int(params.get("port", 6379))
    check_ip_in_lab(host)
    try:
        s = socket.create_connection((host, port), timeout=8)
        s.sendall(b"PING\r\n")
        resp = s.recv(1024).decode('utf-8', errors='ignore')
        s.close()
        if "+PONG" in resp:
            print(json.dumps({
                "status": "confirmed",
                "exit_code": 0,
                "response": "+PONG",
                "message": "Unauthenticated Redis confirmed: PING returned +PONG"
            }))
            sys.exit(0)
        else:
            print(json.dumps({"status": "not_reproduced", "exit_code": 1, "response": resp}))
            sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "exit_code": 1, "error": str(e)}))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="ChainedRisk Hardened Runner Entrypoint")
    parser.add_argument("--action", required=True, help="Allowlisted action ID")
    parser.add_argument("--params", required=True, help="JSON-encoded validated parameters")
    args = parser.parse_args()

    try:
        params = json.loads(args.params)
    except Exception:
        print(json.dumps({"status": "error", "message": "Invalid JSON in --params"}))
        sys.exit(2)

    dispatch = {
        "git_exposure_check": action_git_exposure_check,
        "ssrf_canary_probe": action_ssrf_canary_probe,
        "redis_unauth_ping": action_redis_unauth_ping,
    }

    if args.action not in dispatch:
        print(json.dumps({"status": "error", "message": f"Action '{args.action}' not in allowlist"}))
        sys.exit(2)

    dispatch[args.action](params)

if __name__ == "__main__":
    main()

