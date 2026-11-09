FROM python:3.11-alpine

RUN adduser -D -u 10001 chainedrunner
USER chainedrunner
WORKDIR /home/chainedrunner

COPY runner_entry.py /home/chainedrunner/runner_entry.py

ENTRYPOINT ["python", "/home/chainedrunner/runner_entry.py"]

