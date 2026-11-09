FROM python:3.12-slim
RUN pip install --no-cache-dir flask==3.0.3 && useradd -u 10001 app
WORKDIR /srv
COPY app.py .
USER 10001
EXPOSE 8080
CMD ["python","app.py"]
