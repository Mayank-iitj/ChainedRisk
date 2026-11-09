import argparse
import json
import socket
import sys

def main():
    parser = argparse.ArgumentParser(description="Probe unauthenticated Redis instance via PING command")
    parser.add_argument("--host", default="10.77.0.12", help="Redis host IP")
    parser.add_argument("--port", type=int, default=6379, help="Redis port")
    parser.add_argument("--expect", default="PONG", help="Expected response")
    args = parser.parse_args()

    try:
        s = socket.create_connection((args.host, args.port), timeout=8)
        s.sendall(b"PING\r\n")
        resp = s.recv(1024).decode("utf-8", errors="ignore")
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

if __name__ == "__main__":
    main()
