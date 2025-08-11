import os
import time
import subprocess

def run_server():
    return subprocess.Popen(["python3", "server.py"])

if __name__ == "__main__":
    process = run_server()
    last_mtime = os.path.getmtime("server.py")

    try:
        while True:
            time.sleep(1)
            mtime = os.path.getmtime("server.py")
            if mtime != last_mtime:
                process.terminate()
                process = run_server()
                last_mtime = mtime
    except KeyboardInterrupt:
        process.terminate()
